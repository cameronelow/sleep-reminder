import { getReminderHistory } from "@/lib/actions/reminders";
import type { Prisma } from "@prisma/client";
import styles from "./page.module.css";

type ReminderWithNotifications = Prisma.ReminderGetPayload<{ include: { notifications: true } }>;

export default async function HistoryPage() {
  const reminders = await getReminderHistory();

  return (
    <div>
      <h1 className={styles.heading}>Reminder History</h1>
      <p className={styles.subtitle}>
        The last {reminders.length} reminder{reminders.length !== 1 ? "s" : ""} sent to your account.
      </p>

      {reminders.length === 0 ? (
        <div className={styles.empty}>
          No reminders have been sent yet. They will appear here after tonight&apos;s scheduled time.
        </div>
      ) : (
        <div className={styles.list}>
          {reminders.map((r: ReminderWithNotifications) => {
            const allSent = r.notifications.length > 0 && r.notifications.every((n) => n.status === "sent");
            const anyFailed = r.notifications.some((n) => n.status === "failed");
            const statusLabel = r.sentAt
              ? allSent
                ? "Delivered"
                : anyFailed
                ? "Partial failure"
                : "Sent"
              : "Pending";
            const statusClass = r.sentAt
              ? allSent
                ? styles.statusDelivered
                : anyFailed
                ? styles.statusFailed
                : styles.statusSent
              : styles.statusPending;

            return (
              <div key={r.id} className={styles.item}>
                <div className={styles.itemMain}>
                  <div className={styles.itemTime}>
                    {formatDateTime(r.scheduledFor)}
                  </div>
                  <div className={styles.itemMessage}>{r.message}</div>
                </div>
                <div className={`${styles.status} ${statusClass}`}>{statusLabel}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
