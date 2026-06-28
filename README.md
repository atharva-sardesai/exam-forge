# ExamForge

ExamForge is a Vite/React exam simulator backed by Supabase Auth, Postgres, RLS, and Realtime.

## Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Only the `VITE_` variables are exposed to the browser. Keep the service-role key private and use it only for seeding.

## Database

Run the migration in Supabase SQL Editor or with the Supabase CLI:

```bash
supabase db push
```

Or set `DATABASE_URL` in `.env` and run:

```bash
npm run db:migrate
```

The migration creates:

- `profiles`
- `exams`
- `questions`
- `reference_notes`
- `exam_attempts`
- `exam_stats`

It also enables RLS and policies so exams/questions/notes are shared, while attempts and stats are private per user.

## Seed Shared Content

After migrations, seed the preloaded exams and reference notes:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run db:seed
```

The seed inserts shared preloaded exams and questions. It is repeatable for the seeded exams.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Routes

- `/login`
- `/signup`
- `/forgot-password`
- `/`
- `/exams`
- `/exams/new`
- `/exams/:examId`
- `/exams/:examId/manage`
- `/exam-session/:sessionId`
- `/results/:attemptId`
- `/notes`
- `/notes/:noteId`
- `/history`
- `/profile`

## Security Model

Shared content:

- Exams are readable by all authenticated users.
- Questions are readable by all authenticated users.
- Reference notes are readable by all authenticated users.
- Creators can edit/delete their own shared content, with preloaded exams protected from deletion.

Private content:

- Exam attempts are visible only to the user who created them.
- Exam stats are visible only to the owning user.

## Build

```bash
npm run build
```
