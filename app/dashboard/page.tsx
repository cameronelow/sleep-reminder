import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserSettings } from "@/lib/actions/settings";
import { getUpcomingReminderTime } from "@/lib/actions/reminders";
import Link from "next/link";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const settings = await getUserSettings();
  const nextReminderTime = await getUpcomingReminderTime();

  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const todayType = isWeekend ? "weekend" : "weekday";
  const todayWake = settings
    ? isWeekend
      ? settings.weekendWakeTime
      : settings.weekdayWakeTime
    : null;

  return (
    <div>
      <h1 className={styles.heading}>
        Good {getTimeOfDay()}, {session?.user?.name?.split(" ")[0] ?? "there"}
      </h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Tonight&apos;s reminder</div>
          <div className={styles.cardValue}>
            {nextReminderTime ?? (settings ? nextReminderTime : "—")}
          </div>
          <div className={styles.cardSub}>
            {settings?.remindersEnabled
              ? `Wind-down alert for ${todayType}`
              : "Reminders paused"}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Wake time today</div>
          <div className={styles.cardValue}>
            {todayWake ? formatTime(todayWake) : "Not set"}
          </div>
          <div className={styles.cardSub}>
            {settings ? `${settings.sleepHours}h sleep goal` : "Configure in Settings"}
          </div>
        </div>
      </div>

      {!settings && (
        <div className={styles.setupCard}>
          <p>Welcome! Set up your sleep schedule to start receiving reminders.</p>
          <Link href="/dashboard/settings" className={styles.ctaLink}>
            Configure Settings
          </Link>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Browser Notifications</h2>
        <p className={styles.sectionDesc}>
          Enable push notifications so your browser can alert you at wind-down time —
          even when this tab is in the background.
        </p>
        <PushSubscribeButton pushEnabled={settings?.pushEnabled ?? false} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Links</h2>
        <div className={styles.quickLinks}>
          <Link href="/dashboard/settings" className={styles.quickLink}>
            Sleep Settings
          </Link>
          <Link href="/dashboard/history" className={styles.quickLink}>
            Reminder History
          </Link>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}
