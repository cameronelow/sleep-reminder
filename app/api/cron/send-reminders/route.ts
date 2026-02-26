import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// Vercel calls this endpoint on the schedule defined in vercel.json.
// Each run checks which users have a reminder due in the current hour window.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const processed: { userId: string; status: string }[] = [];

  try {
    const usersWithSettings = await db.userSettings.findMany({
      where: { remindersEnabled: true },
      include: {
        user: {
          include: { pushSubscriptions: true },
        },
      },
    });

    for (const settings of usersWithSettings) {
      try {
        if (!settings.user.pushSubscriptions.length) {
          processed.push({ userId: settings.userId, status: "skipped-no-subscription" });
          continue;
        }

        const timezone = settings.timezone || "America/Chicago";

        // Get current day-of-week and HH:MM in the user's local timezone
        const localDayOfWeek = Number(formatInTimeZone(now, timezone, "i")); // 1=Mon ... 7=Sun
        const isWeekend = localDayOfWeek === 6 || localDayOfWeek === 7;
        const wakeTimeStr = isWeekend ? settings.weekendWakeTime : settings.weekdayWakeTime;

        // Compute the reminder time (minutes since midnight)
        const [wakeH, wakeM] = wakeTimeStr.split(":").map(Number);
        const wakeMinutes = wakeH * 60 + wakeM;
        const totalBeforeWake = settings.sleepHours * 60 + settings.windDownBuffer;
        const reminderMinutes = (wakeMinutes - totalBeforeWake + 1440) % 1440;
        const reminderH = Math.floor(reminderMinutes / 60);
        const reminderM = reminderMinutes % 60;

        // Build the exact reminder datetime in the user's timezone, then convert to UTC for comparison
        const localDateStr = formatInTimeZone(now, timezone, "yyyy-MM-dd");
        const localReminderStr = `${localDateStr}T${String(reminderH).padStart(2, "0")}:${String(reminderM).padStart(2, "0")}:00`;
        const reminderUTC = fromZonedTime(localReminderStr, timezone);

        // Check: does the scheduled reminder time fall within the current cron-run hour?
        const windowStart = new Date(now);
        windowStart.setMinutes(0, 0, 0);
        const windowEnd = new Date(windowStart);
        windowEnd.setHours(windowStart.getHours() + 1);

        if (reminderUTC < windowStart || reminderUTC >= windowEnd) {
          processed.push({ userId: settings.userId, status: "not-due-this-hour" });
          continue;
        }

        // Check: was a reminder already sent today in this timezone?
        const todayStart = fromZonedTime(`${localDateStr}T00:00:00`, timezone);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const existingReminder = await db.reminder.findFirst({
          where: {
            userId: settings.userId,
            scheduledFor: { gte: todayStart, lt: tomorrowStart },
            sentAt: { not: null },
          },
        });

        if (existingReminder) {
          processed.push({ userId: settings.userId, status: "already-sent-today" });
          continue;
        }

        // Build the human-readable message
        const bedtimeMinutes = (wakeMinutes - settings.sleepHours * 60 + 1440) % 1440;
        const bedH = Math.floor(bedtimeMinutes / 60);
        const bedM = bedtimeMinutes % 60;
        const bedPeriod = bedH < 12 ? "AM" : "PM";
        const bedDisplay = `${bedH % 12 || 12}:${String(bedM).padStart(2, "0")} ${bedPeriod}`;
        const wakeDisplay = `${wakeH % 12 || 12}:${String(wakeM).padStart(2, "0")} ${wakeH < 12 ? "AM" : "PM"}`;

        const message = `Bedtime in ${settings.windDownBuffer} min (${bedDisplay}). Wake up: ${wakeDisplay}. Sleep goal: ${settings.sleepHours}h.`;

        // Create reminder record
        const reminder = await db.reminder.create({
          data: {
            userId: settings.userId,
            scheduledFor: reminderUTC,
            message,
          },
        });

        // Dispatch via internal send endpoint
        const sendUrl = `${process.env.NEXT_PUBLIC_URL}/api/reminders/send`;
        let sendResult: { sent?: number; failed?: number } = {};

        try {
          const response = await fetch(sendUrl, {
            method: "POST",
            headers: {
              authorization: `Bearer ${process.env.CRON_SECRET}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              reminderId: reminder.id,
              userId: settings.userId,
              title: "Circadian",
              body: message,
            }),
          });

          if (response.ok) {
            sendResult = await response.json();
          } else {
            sendResult = { sent: 0, failed: 1 };
          }
        } catch {
          sendResult = { sent: 0, failed: 1 };
        }

        processed.push({
          userId: settings.userId,
          status: `dispatched-${sendResult.sent ?? 0}-sent-${sendResult.failed ?? 0}-failed`,
        });
      } catch (userErr) {
        processed.push({
          userId: settings.userId,
          status: `error-${userErr instanceof Error ? userErr.message : "unknown"}`,
        });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Cron job failed", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }

  return NextResponse.json({ processed, checkedAt: now.toISOString() });
}
