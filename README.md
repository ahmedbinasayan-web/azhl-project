# أ Azhl أزهل

**AI Customer Operations Platform for UAE Businesses**

Azhl automates WhatsApp customer service, generates social media content, and re-engages past clients — in Arabic and English — for UAE SMBs.

---

## Project Structure

```
azhl-project/
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout
│   │   ├── page.js                # Landing page (/)
│   │   ├── demo/page.js           # Live AI demo (/demo)
│   │   ├── dashboard/page.js      # Business dashboard (/dashboard)
│   │   └── api/
│   │       ├── whatsapp/route.js   # WhatsApp webhook endpoint
│   │       └── posts/generate/route.js  # Social post generation
│   ├── pages/
│   │   ├── LandingPage.jsx        # Full landing page with shader hero
│   │   ├── DemoPage.jsx           # Interactive WhatsApp AI demo
│   │   └── DashboardPage.jsx      # Business owner dashboard
│   ├── lib/
│   │   ├── supabase.js            # Supabase client
│   │   └── ai.js                  # Claude AI wrapper (replies + posts)
│   └── styles/
│       └── globals.css            # Global styles + font imports
├── supabase-schema.sql            # Database schema (run in Supabase SQL editor)
├── .env.example                   # Environment variables template
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
- Create a project at https://supabase.com
- Go to SQL Editor → paste contents of `supabase-schema.sql` → Run
- Copy your project URL and anon key

### 3. Set up environment
```bash
cp .env.example .env.local
# Fill in your keys: Supabase, Anthropic, WhatsApp API, Stripe
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy
```bash
# Deploy to Vercel (free)
npx vercel
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with animated hero |
| `/demo` | Interactive WhatsApp AI demo (4 business types) |
| `/dashboard` | Business owner dashboard |
| `/api/whatsapp` | WhatsApp webhook (POST: receive messages, GET: verification) |
| `/api/posts/generate` | Generate social media posts |

## Tech Stack

- **Frontend**: Next.js 14 + React + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **WhatsApp**: 360dialog API
- **Payments**: Stripe
- **Hosting**: Vercel (free tier)

## Design System

| Element | Value |
|---------|-------|
| Primary | `#0C1B33` (Navy) |
| Accent | `#0A8F7F` (Teal) |
| Light Accent | `#12C4AD` |
| Background | `#FAFAF7` (Cream) |
| Heading Font | Instrument Serif |
| Body Font | Syne |
| Arabic Font | Noto Kufi Arabic |

## License

Proprietary — All rights reserved.
