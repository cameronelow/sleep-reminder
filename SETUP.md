# Sleep Reminder — Setup Guide

A Next.js web app that sends browser push notifications when it's time to wind down for sleep. **100% free to run.**

## Prerequisites

- Node.js 18+ (managed via NVM)
- A Vercel account (free)
- A Resend account (free tier, 100 emails/day — for auth emails only)

---

## 1. Create a Vercel Postgres Database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → Storage → Create Database → Postgres (Neon)
2. Copy the `DATABASE_URL` connection string (the pooled one)

---

## 2. Set Up Resend (for auth emails)

1. Create a free account at [resend.com](https://resend.com)
2. Create an API key
3. (Optional) Add and verify a custom domain for the "from" address

---

## 3. Configure Environment Variables

Edit `.env.local` with your real values:

```bash
DATABASE_URL="postgresql://..."         # From Vercel Postgres
BETTER_AUTH_SECRET="..."               # Run: openssl rand -hex 32
BETTER_AUTH_URL="http://localhost:3000" # Change to your domain on Vercel
RESEND_API_KEY="re_..."
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BA8rgAsmoub1Cf7kguMibuVpUyR2K-SgLtyyWN8iXV-se6nsmQoBGWQYU0-qIrMpsSwTW6Py_ljX9mmscPdqAxE"
VAPID_PRIVATE_KEY="rXQOZA6dSg_B4YbuMTL3_AHwgVFf3j6TMGxThX19w4g"
VAPID_EMAIL="mailto:your@email.com"    # Your email
CRON_SECRET="..."                      # Run: openssl rand -hex 16
NEXT_PUBLIC_URL="http://localhost:3000" # Change to your domain on Vercel
```

> **Note:** The VAPID keys above were pre-generated for you. Use them as-is or regenerate with:
> ```bash
> npx web-push generate-vapid-keys
> ```

---

## 4. Run Database Migrations

```bash
# Install dependencies
source ~/.nvm/nvm.sh && nvm use 20
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push
```

---

## 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, configure your settings, and enable push notifications.

---

## 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables on Vercel:
vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL        # https://your-app.vercel.app
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_EMAIL
vercel env add CRON_SECRET
vercel env add NEXT_PUBLIC_URL        # https://your-app.vercel.app

# Deploy to production
vercel --prod
```

The `vercel.json` cron job is automatically activated on deployment (runs hourly, free on Vercel hobby plan).

---

## 7. Update Auth Config

After deploying, update `lib/auth.ts` to use your real domain for the email "from" address:

```typescript
from: "Sleep Reminder <noreply@yourdomain.com>",
```

---

## How It Works

1. **Sign up** at your deployed URL
2. Go to **Settings** → set your wake times, sleep goal, wind-down buffer, timezone
3. Go to **Dashboard** → click **Enable Notifications** → allow browser permission
4. The Vercel cron job runs every hour, checks who has a reminder due, and sends a Web Push notification
5. Your browser shows a native notification even when the tab is closed (as long as the browser is open)

### Reminder Schedule (default)
- **Weekdays (Mon–Fri):** 10:00 PM (for 6:30 AM wake, 8h sleep + 30min wind-down)
- **Weekends (Sat–Sun):** 11:30 PM (for 8:00 AM wake)

Change your wake times in Settings at any time — no re-deploy needed.

---

## Changing Settings After Deployment

| What to change | Where |
|---|---|
| Wake times, sleep hours, buffer | Settings page in the app |
| Add more notification channels | `lib/actions/settings.ts` + `app/api/reminders/send/route.ts` |
| Cron frequency | `vercel.json` (requires Vercel Pro for < 1 hour intervals) |

---

## Testing the Cron Manually

Force the cron to run immediately:

```bash
curl -X GET https://your-app.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check the response JSON to see which users were processed and whether notifications were sent.
