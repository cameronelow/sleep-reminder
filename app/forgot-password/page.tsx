"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import styles from "../sign-in/auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot password</h1>

        {submitted ? (
          <>
            <p className={styles.subtitle}>
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
            </p>
            <p className={styles.footer}>
              <Link href="/sign-in" className={styles.link}>
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>Enter your email and we&apos;ll send you a reset link.</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={styles.input}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" disabled={loading} className={styles.button}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className={styles.footer}>
              <Link href="/sign-in" className={styles.link}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
