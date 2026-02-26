"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const VALID_TIMEZONES = new Set(Intl.supportedValuesOf("timeZone"));

const settingsSchema = z.object({
  weekdayWakeTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  weekendWakeTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  sleepHours: z.number().int().min(4).max(12),
  windDownBuffer: z.number().int().min(0).max(120),
  timezone: z.string().refine((tz) => VALID_TIMEZONES.has(tz), "Invalid timezone"),
  pushEnabled: z.boolean(),
  remindersEnabled: z.boolean(),
});

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");
  return session;
}

export async function getUserSettings() {
  const session = await getSession();

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  return settings;
}

export async function updateUserSettings(
  data: z.infer<typeof settingsSchema>
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  await db.userSettings.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: {
      userId: session.user.id,
      ...parsed.data,
    },
  });

  return { success: true };
}
