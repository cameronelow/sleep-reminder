"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import styles from "../sign-in/auth.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const result = await authClient.resetPassword({ token, newPassword: password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
    } else {
      router.push("/sign-in?reset=1");
    }
  }

  if (!token) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Invalid link</h1>
        <p className={styles.subtitle}>This reset link is missing or expired.</p>
        <p className={styles.footer}>
          <Link href="/forgot-password" className={styles.link}>
            Request a new one
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Reset password</h1>
      <p className={styles.subtitle}>Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={styles.input}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
