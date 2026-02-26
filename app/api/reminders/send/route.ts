import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/webpush";

// Internal endpoint called by the cron job to dispatch push notifications for a single reminder.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reminderId, userId, title, body: messageBody } = (await req.json()) as {
      reminderId: string;
      userId: string;
      title: string;
      body: string;
    };

    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.all(
      subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        const result = await sendPushNotification(sub, { title, body: messageBody });

        try {
          await db.notification.create({
            data: {
              reminderId,
              type: "push",
              status: result.success ? "sent" : "failed",
              errorMessage: result.error ?? null,
              sentAt: result.success ? new Date() : null,
            },
          });
        } catch {
          // Log the notification record failure but don't abort — the push was already sent
        }

        return result;
      })
    );

    // Mark reminder as sent regardless of individual push outcomes
    await db.reminder.update({
      where: { id: reminderId },
      data: { sentAt: new Date() },
    });

    return NextResponse.json({
      sent: results.filter((r: { success: boolean }) => r.success).length,
      failed: results.filter((r: { success: boolean }) => !r.success).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send reminder", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
