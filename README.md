# Commonplace — Team Task Manager

A responsive team task manager built with React, Vite, Tailwind CSS, Express, Better Auth, and PostgreSQL.

## Features

- Email/password registration and sign-in with Better Auth, HTTP-only cookies, and persistent accounts.
- PostgreSQL-backed teams, memberships, and tasks; locally, Better Auth uses SQLite and task data uses in-memory storage when `DATABASE_URL` is unset.
- Create and manage teams, invite members by email, and assign tasks to team members.
- Task status, priority, due dates, search, and filters by team, assignee, and status.
- Zod validation, parameterized SQL, and authenticated team/task API routes.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL for persistent data and deployment (Neon is supported)

## Run locally

```sh
npm install
cp .env.example .env
npm run auth:migrate
npm run dev
```

On Windows PowerShell, copy the example with:

```powershell
Copy-Item .env.example .env
```

The default local setup uses `.data/auth.sqlite` for accounts and sessions, plus process-local memory for teams and tasks. It does not require PostgreSQL. To use PostgreSQL locally, set `DATABASE_URL` and `PGSSLMODE` as appropriate before running `npm run auth:migrate`.

Vite serves the frontend at <http://localhost:5173> and proxies `/api` to Express at <http://localhost:4000>.

## Build and run

```sh
npm run typecheck
npm run build
npm start
```

Production requires `DATABASE_URL` and `BETTER_AUTH_SECRET` (at least 32 characters). Set `BETTER_AUTH_URL` to the deployed application origin. The PostgreSQL database must have the Better Auth schema applied with `npm run auth:migrate`; application tables are initialized by the server.

## Deploy to Vercel with Neon

1. Sign in and link the project using the Vercel CLI (`vercel login`, then `vercel link`), or import the GitHub repository from the Vercel dashboard.
2. Create a Neon PostgreSQL database and configure the production environment variables in Vercel:
   - `DATABASE_URL`: the Neon pooled connection string.
   - `BETTER_AUTH_SECRET`: a unique random secret of at least 32 characters.
   - `BETTER_AUTH_URL`: the production application origin, for example `https://your-project.vercel.app`.
3. Pull the deployment environment into the ignored `.env` file using `vercel env pull .env`, then apply the Better Auth schema:

   ```sh
   npm run auth:migrate
   ```

4. Deploy a preview with `vercel deploy`, then verify registration, sign-in/out, team membership, and task CRUD. Promote/deploy to production only after the preview passes.

Keep database URLs and auth secrets in Vercel's environment settings or a protected local environment file. Never commit them or paste them into chat. This repository does not include Vercel credentials, a linked Vercel project, or Neon credentials.

## API

All endpoints are under `/api`. Better Auth provides the email/password endpoints below; team and task routes require a valid session cookie.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/sign-up/email` | Register and sign in |
| `POST` | `/api/auth/sign-in/email` | Sign in |
| `GET` | `/api/auth/session` | Read the current session |
| `POST` | `/api/auth/sign-out` | Sign out |
| `GET`, `POST` | `/api/teams` | List or create teams |
| `PATCH`, `DELETE` | `/api/teams/:teamId` | Update or delete a team (owner only) |
| `GET`, `POST` | `/api/teams/:teamId/members` | List or add members (adding is owner-only) |
| `GET`, `POST` | `/api/tasks` | List or create tasks |
| `PATCH`, `DELETE` | `/api/tasks/:taskId` | Update or delete a task |
| `GET` | `/api/health` | Read API and storage health |

Task listing accepts optional `teamId`, `assignee`, and `status` query parameters.
