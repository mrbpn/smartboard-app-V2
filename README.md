# DeepBoard — Smart Classroom Platform

AI-powered lesson management for Dahua DeepHub smartboards.
**Now with Supabase — real database, real auth, real storage.**

---

## Step 1 — Set up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, password, and region → **Create project**
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** → paste the entire contents of `supabase/migrations/001_initial.sql` → **Run**
5. Go to **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Add env vars to Vercel

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add both variables:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
```

3. Click **Save** → **Redeploy**

That's it. The app is now fully live with a real database. ✓

---

## Local development

```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm install
npm run dev
# → http://localhost:3000
```

---

## What's connected to Supabase

| Feature | Status |
|---|---|
| Auth (login / register / session) | ✓ Real |
| Lessons — create, edit, delete | ✓ Real |
| Slides — save per lesson | ✓ Real |
| Quizzes — create, questions | ✓ Real |
| Quiz sessions — launch, join code | ✓ Real |
| Student responses | ✓ Real |
| Whiteboard snapshots | ✓ Real |
| Recordings metadata | ✓ Real |
| Templates library (seeded) | ✓ Real |
| File storage (media, avatars) | ✓ Real |
| Row-level security | ✓ Enabled |

---

## Pages

| Route | Description |
|---|---|
| `/login` | Supabase email auth |
| `/register` | Creates account + profile |
| `/dashboard` | Live stats from DB + recent lessons |
| `/lessons` | Real lesson list, search, filter, delete |
| `/lessons/new` | Create lesson — manual or AI |
| `/lessons/[id]` | Slide editor — saves to DB |
| `/quizzes` | Real quiz list + live session launcher |
| `/quizzes/new` | Quiz builder — saves to DB |
| `/whiteboard` | Canvas + OCR — saves snapshots |
| `/recordings` | Recording library |
| `/settings` | Profile updates, notifications, API status |
| `/join/[code]` | Student quiz join — no auth needed |
