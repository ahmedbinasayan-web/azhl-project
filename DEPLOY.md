# Azhl أزهل — Deployment Guide

## Step 1: Push to GitHub

```bash
git init
git add -A
git commit -m "Initial Azhl commit"
git remote add origin https://github.com/YOUR_USERNAME/azhl-project.git
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Click **Deploy**

## Step 3: Add Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add every variable from `.env.example`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `WHATSAPP_API_KEY` | 360dialog Dashboard |
| `WHATSAPP_VERIFY_TOKEN` | Set to `azhl-verify-2026` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | See Step 6 |
| `NEXT_PUBLIC_APP_URL` | Your production URL e.g. `https://azhl.ai` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_EMAIL` | `mailto:hello@azhl.ai` |

## Step 4: Connect Custom Domain

1. In Vercel Dashboard → Project → Settings → Domains
2. Add `azhl.ai` (or `azhl.ae`)
3. Follow Vercel's DNS instructions to point your domain's nameservers or add CNAME/A records
4. Vercel provisions SSL automatically

## Step 5: Verify Cron Jobs

1. In Vercel Dashboard → Project → Settings → Cron Jobs
2. Confirm all 5 cron jobs from `vercel.json` appear:
   - `/api/cron` — daily 9 AM UTC
   - `/api/followup` — every Monday 10 AM UTC
   - `/api/posts/generate` — every Sunday 8 AM UTC
   - `/api/reviews` — daily 11 AM UTC
   - `/api/ads/create` — every Monday 12 PM UTC

## Step 6: Register Stripe Webhook

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://azhl.ai/api/billing/webhook`
4. Events to listen to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the **Signing secret** (`whsec_...`)
6. Add it as `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

## Step 7: Update Supabase Auth Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://azhl.ai`
3. Redirect URLs — add:
   - `https://azhl.ai/dashboard`
   - `https://azhl.ai/auth/callback`
4. Save

## Step 8: Test Everything Live

- [ ] Sign up with a new account → confirm email arrives with branded template
- [ ] Log in → dashboard loads correctly
- [ ] WhatsApp webhook responds to 360dialog verification request
- [ ] Stripe checkout completes and plan updates
- [ ] Push notification toggle in Settings works
- [ ] Cron jobs fire on schedule (check Vercel logs next day)

## Generating VAPID Keys

Run once locally (Node.js required):

```bash
npx web-push generate-vapid-keys
```

Copy the output public key to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and private key to `VAPID_PRIVATE_KEY`.
