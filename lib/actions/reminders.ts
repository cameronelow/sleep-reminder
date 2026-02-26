"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");
  return session;
}

export async function getReminderHistory(limit = 50) {
  const session = await getSession();

  return db.reminder.findMany({
    where: { userId: session.user.id },
    include: { notifications: true },
    orderBy: { scheduledFor: "desc" },
    take: limit,
  });
}

export async function getUpcomingReminderTime(): Promise<string | null> {
  const session = await getSession();

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings || !settings.remindersEnabled) return null;

  const now = new Date();
  const timezone = settings.timezone || "America/Chicago";

  // Use the user's timezone for day-of-week (matches the cron logic)
  const localDayOfWeek = Number(formatInTimeZone(now, timezone, "i")); // 1=Mon ... 7=Sun
  const isWeekend = localDayOfWeek === 6 || localDayOfWeek === 7;
  const wakeTime = isWeekend ? settings.weekendWakeTime : settings.weekdayWakeTime;

  const [wakeH, wakeM] = wakeTime.split(":").map(Number);
  const totalBeforeWake = settings.sleepHours * 60 + settings.windDownBuffer;
  const wakeMinutes = wakeH * 60 + wakeM;
  const reminderMinutes = (wakeMinutes - totalBeforeWake + 1440) % 1440;
  const rH = Math.floor(reminderMinutes / 60);
  const rM = reminderMinutes % 60;

  const period = rH < 12 ? "AM" : "PM";
  const displayH = rH % 12 || 12;
  return `${displayH}:${String(rM).padStart(2, "0")} ${period}`;
}
