"use client";

import { useState, useEffect } from "react";
import { updateUserSettings } from "@/lib/actions/settings";
import styles from "./PushSubscribeButton.module.css";

interface Props {
  pushEnabled: boolean;
}

export default function PushSubscribeButton({ pushEnabled }: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  async function subscribe() {
    setLoading(true);
    setStatus(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save subscription on server.");
      }

      await updateUserSettings({ pushEnabled: true } as Parameters<typeof updateUserSettings>[0]);

      setSubscribed(true);
      setStatus("Notifications enabled! You'll receive reminders in this browser.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enable notifications.";
      setStatus(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setStatus(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setSubscribed(false);
      setStatus("Notifications disabled for this browser.");
    } catch {
      setStatus("Failed to disable notifications.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <p className={styles.unsupported}>
        Push notifications are not supported in this browser.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={subscribed ? styles.buttonDisable : styles.buttonEnable}
      >
        {loading
          ? "..."
          : subscribed
          ? "Disable Notifications"
          : "Enable Notifications"}
      </button>
      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
