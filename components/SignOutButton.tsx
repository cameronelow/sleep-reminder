"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import styles from "./SignOutButton.module.css";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <button onClick={handleSignOut} className={styles.button}>
      Sign out
    </button>
  );
}
