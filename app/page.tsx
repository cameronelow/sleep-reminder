import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Circadian</h1>
          <p>
            Get a browser notification when it&apos;s time to wind down so you wake up
            well-rested every morning.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/sign-up">
            Get Started
          </Link>
          <Link className={styles.secondary} href="/sign-in">
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
