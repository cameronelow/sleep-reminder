import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <span className={styles.brand}>Circadian</span>
        <div className={styles.links}>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/dashboard/settings" className={styles.navLink}>Settings</Link>
          <Link href="/dashboard/history" className={styles.navLink}>History</Link>
        </div>
        <SignOutButton />
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
