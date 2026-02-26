"use client";

import { useState } from "react";
import { updateUserSettings } from "@/lib/actions/settings";
import styles from "./SettingsForm.module.css";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

interface Props {
  defaults: {
    weekdayWakeTime: string;
    weekendWakeTime: string;
    sleepHours: number;
    windDownBuffer: number;
    timezone: string;
    remindersEnabled: boolean;
    pushEnabled: boolean;
  };
}

export default function SettingsForm({ defaults }: Props) {
  const [weekdayWakeTime, setWeekdayWakeTime] = useState(defaults.weekdayWakeTime);
  const [weekendWakeTime, setWeekendWakeTime] = useState(defaults.weekendWakeTime);
  const [sleepHours, setSleepHours] = useState(defaults.sleepHours);
  const [windDownBuffer, setWindDownBuffer] = useState(defaults.windDownBuffer);
  const [timezone, setTimezone] = useState(defaults.timezone);
  const [remindersEnabled, setRemindersEnabled] = useState(defaults.remindersEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const reminderOffset = sleepHours * 60 + windDownBuffer;
  const weekdayReminderStr = computeReminderTime(weekdayWakeTime, reminderOffset);
  const weekendReminderStr = computeReminderTime(weekendWakeTime, reminderOffset);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateUserSettings({
      weekdayWakeTime,
      weekendWakeTime,
      sleepHours,
      windDownBuffer,
      timezone,
      remindersEnabled,
      pushEnabled: defaults.pushEnabled,
    });

    setSaving(false);
    setMessage({
      text: result.success ? "Settings saved." : (result.error ?? "Failed to save."),
      ok: result.success,
    });
  }

  return (
    <form onSubmit={handleSave} className={styles.form}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Wake Times</legend>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="weekdayWake">Weekday wake time</label>
            <input
              id="weekdayWake"
              type="time"
              value={weekdayWakeTime}
              onChange={(e) => setWeekdayWakeTime(e.target.value)}
              className={styles.input}
            />
            <span className={styles.hint}>Reminder at {weekdayReminderStr}</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="weekendWake">Weekend wake time</label>
            <input
              id="weekendWake"
              type="time"
              value={weekendWakeTime}
              onChange={(e) => setWeekendWakeTime(e.target.value)}
              className={styles.input}
            />
            <span className={styles.hint}>Reminder at {weekendReminderStr}</span>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Sleep Goal</legend>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="sleepHours">Hours of sleep</label>
            <select
              id="sleepHours"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className={styles.select}
            >
              {[5, 6, 7, 7.5, 8, 8.5, 9, 10].map((h) => (
                <option key={h} value={h}>
                  {h}h
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="windDown">Wind-down buffer</label>
            <select
              id="windDown"
              value={windDownBuffer}
              onChange={(e) => setWindDownBuffer(Number(e.target.value))}
              className={styles.select}
            >
              {[0, 15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "None" : `${m} min`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Preferences</legend>

        <div className={styles.field}>
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={styles.select}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Reminders enabled</div>
            <div className={styles.toggleSub}>
              Pause all reminders without losing your settings
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </fieldset>

      {message && (
        <p className={message.ok ? styles.success : styles.error}>{message.text}</p>
      )}

      <button type="submit" disabled={saving} className={styles.saveButton}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}

function computeReminderTime(wakeTime: string, offsetMinutes: number): string {
  const [h, m] = wakeTime.split(":").map(Number);
  const wakeMinutes = h * 60 + m;
  const reminderMinutes = (wakeMinutes - offsetMinutes + 1440) % 1440;
  const rH = Math.floor(reminderMinutes / 60);
  const rM = reminderMinutes % 60;
  const period = rH < 12 ? "AM" : "PM";
  return `${rH % 12 || 12}:${String(rM).padStart(2, "0")} ${period}`;
}
