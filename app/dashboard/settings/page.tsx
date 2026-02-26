import { getUserSettings } from "@/lib/actions/settings";
import SettingsForm from "@/components/SettingsForm";
import styles from "./page.module.css";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  const defaults = {
    weekdayWakeTime: settings?.weekdayWakeTime ?? "06:30",
    weekendWakeTime: settings?.weekendWakeTime ?? "08:00",
    sleepHours: settings?.sleepHours ?? 8,
    windDownBuffer: settings?.windDownBuffer ?? 30,
    timezone: settings?.timezone ?? "America/Chicago",
    remindersEnabled: settings?.remindersEnabled ?? true,
    pushEnabled: settings?.pushEnabled ?? false,
  };

  return (
    <div>
      <h1 className={styles.heading}>Sleep Settings</h1>
      <p className={styles.subtitle}>
        Configure your wake times and sleep goals. Reminders will fire{" "}
        {defaults.sleepHours}h {defaults.windDownBuffer}min before your wake time.
      </p>
      <SettingsForm defaults={defaults} />
    </div>
  );
}
