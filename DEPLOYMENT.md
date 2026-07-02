# MemoraX — Deployment Guide

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "MemoraX v1.0 — ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/memorax.git
git push -u origin main
```

## Step 2: Create a PostgreSQL Database (FREE)

### Option A: Vercel Postgres (easiest)
1. Go to https://vercel.com/dashboard → New Project → Storage tab
2. Create a Postgres database (free tier: 256MB, plenty for launch)
3. Copy the connection string (starts with `postgres://`)

### Option B: Supabase (more generous free tier)
1. Go to https://supabase.com → New Project
2. Go to Settings → Database → Connection string
3. Copy the URI (starts with `postgres://`)

### Option C: Neon (best free tier for serverless)
1. Go to https://neon.tech → New Project
2. Copy the connection string

## Step 3: Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework preset: Next.js (auto-detected)
4. **Environment Variables** — add these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgres://...` (from Step 2) |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (your Vercel URL) |

5. Click **Deploy**
6. Wait for the build to complete (~2-3 minutes)

## Step 4: Initialize the Database

After the first deploy, your database is empty. To seed it:

1. Go to your Vercel project → Settings → Functions
2. Find the URL for your deployed app
3. Run this in your terminal:
```bash
curl -X POST https://your-app.vercel.app/api/bootstrap
curl -X POST https://your-app.vercel.app/api/admin/ensure-admin
```

This creates:
- The demo Garcia family (students, parents, teacher)
- The default admin account

## Step 5: Test the App

1. Visit your Vercel URL
2. Click "Sign In"
3. Login as admin: `admin@memorax.app` / `admin123`
4. Create a real user from the admin dashboard
5. Sign out, sign in as the new user
6. Send a chat message to the AI tutor

## Step 6: Add Stripe (when ready to charge)

1. Create a Stripe account: https://dashboard.stripe.com
2. Go to Developers → API Keys
3. Copy the Publishable key and Secret key
4. In Vercel → Settings → Environment Variables, add:
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
5. In Stripe → Developers → Webhooks → Add endpoint
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel
6. Redeploy

## Step 7: Add Telegram Bot (when ready)

1. Open Telegram, message @BotFather
2. Send `/newbot`, follow prompts
3. Copy the bot token
4. In Vercel → Settings → Environment Variables, add:
   - `TELEGRAM_BOT_TOKEN` = your token
5. Set the webhook:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook"
```
6. Redeploy

## Step 8: Add WhatsApp (when ready)

1. Go to https://developers.facebook.com/
2. Create an app → Add WhatsApp product
3. Get the access token and phone number ID
4. In Vercel → Settings → Environment Variables, add:
   - `WHATSAPP_ACCESS_TOKEN` = your token
   - `WHATSAPP_PHONE_NUMBER_ID` = your phone number ID
   - `WHATSAPP_VERIFY_TOKEN` = `memorax-verify`
5. In Meta Dashboard → Webhooks → Subscribe to messages
   - Callback URL: `https://your-app.vercel.app/api/whatsapp/webhook`
   - Verify token: `memorax-verify`
6. Redeploy

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@memorax.app | admin123 |
| Student (Scholar) | mia@memorax.family | student123 |
| Student (Free) | leo@memorax.family | student123 |
| Parent (Family) | sofia@memorax.family | parent123 |
| Parent (Family) | carlos@memorax.family | parent123 |
| Teacher (Educator) | mspatel@memorax.school | teacher123 |

## Post-Deployment Checklist

- [ ] App loads at Vercel URL
- [ ] Admin login works
- [ ] Can create a new user
- [ ] New user can sign in
- [ ] AI tutor chat works (sends + receives messages)
- [ ] Homework photo upload works
- [ ] Avatar shop buy/equip works
- [ ] Parent inbox shows reminders
- [ ] Teacher dashboard shows students
- [ ] Stripe checkout works (test mode)
- [ ] Telegram bot responds to messages
- [ ] Privacy policy dialog opens
- [ ] Cookie consent banner appears
