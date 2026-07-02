# Task ADMIN-1 — Admin system + NextAuth authentication

**Agent:** main (admin-system builder)
**Task:** Build the missing admin system + wire up NextAuth v4 (per audit report A11).

## Files created
- `src/lib/auth.ts` — NextAuth config (Credentials provider, JWT strategy, `authOptions`, `getAuthSession()`, `requireAdmin()` guard). Stateless role check on the JWT.
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth v4 route handler (GET + POST).
- `src/app/api/admin/stats/route.ts` — GET aggregate counts (users by role, courses, assignments, submissions, memories, chats, reminders, families, active students).
- `src/app/api/admin/users/route.ts` — GET all users (safe fields only — no password hash), supports `?role=STUDENT` filter.
- `src/app/api/admin/activity/route.ts` — GET merged recent activity (last 20 chats + 20 homework memories + 20 reminders), sorted by date desc with actor names.
- `src/app/api/admin/reset/route.ts` — POST: re-seeds demo data (reuses `seedDatabase()`), gated by `requireAdmin`.
- `src/components/auth/session-provider.tsx` — client wrapper around `next-auth/react`'s `SessionProvider` (needed because the root layout is a server component).
- `src/components/admin/admin-login.tsx` — login card with email + password. Calls `signIn('credentials')`. Branches on role: ADMIN → set mock session + view='admin'; non-ADMIN → toast + redirect to landing + signOut.
- `src/components/admin/admin-app.tsx` — full admin dashboard: header (admin name + Sign out + Back to landing + Refresh), stats grid (11 stat cards), user management table (role filter tabs, scrollable), activity feed (scrollable, with type badges + time-ago), Danger zone card with reset button + AlertDialog confirmation, sticky footer.

## Files modified
- `prisma/schema.prisma` — added `ADMIN` to Role comment, added `password String?` to User.
- `src/lib/seed.ts` — added admin user (admin@memorax.school / admin1234, avatar 🛡️, role ADMIN), added bcrypt password hashes for all seeded users (demo1234 for students/parents/teacher, admin1234 for admin). Admin is upserted by email for idempotency.
- `src/lib/types.ts` — added `'ADMIN'` to `Role`, added `'adminLogin'` and `'admin'` to `View`.
- `src/lib/db.ts` — added a schema-hash invalidation guard so a stale PrismaClient singleton (cached across HMR / schema changes) is automatically dropped and re-instantiated.
- `src/app/layout.tsx` — wrapped app in `<AuthSessionProvider>` (inside `<ThemeProvider>`).
- `src/components/app-shell.tsx` — added `view === 'adminLogin'` and `view === 'admin'` cases.
- `src/components/landing/landing.tsx` — added a discreet "Admin" lock-icon button in the footer (next to "Reset demo"); not as prominent as the role cards.
- `.env` — added `NEXTAUTH_SECRET` (openssl rand -base64 32) and `NEXTAUTH_URL=http://localhost:3000`.

## Packages installed
- `bcryptjs@3.0.3` + `@types/bcryptjs@3.0.0`

## Verification

### Lint + tsc
- `bun run lint` → clean (no warnings, no errors).
- `npx tsc --noEmit` → 0 errors in `src/`. (4 pre-existing errors in `skills/` and `examples/` — out of scope per task constraints.)

### Database
- `bun run db:push` → schema applied (password field added, ADMIN role documented).
- `POST /api/force-seed` → `{"ok":true,"users":6,"familyId":"..."}` (admin + teacher + 2 students + 2 parents = 6).

### Curl tests
- `GET /api/admin/stats` (no auth) → **401** ✅
- `GET /api/admin/users` (no auth) → **401** ✅
- `GET /api/admin/activity` (no auth) → **401** ✅
- `POST /api/admin/reset` (no auth) → **401** ✅
- Bad password login → 401, no session ✅
- Admin login (admin@memorax.school / admin1234) → 200, session has `role: "ADMIN"` ✅
- Admin APIs with admin cookie → 200 with correct JSON ✅
- Non-admin (Mia) login → 200, session has `role: "STUDENT"`, but `GET /api/admin/stats` → 401 ✅
- `POST /api/admin/reset` with admin cookie → `{"ok":true,"users":6,...}` ✅

### Browser test (agent-browser)
1. Load `/` → landing renders, all role cards present, discreet "Admin" button in footer.
2. Click "Admin" → admin-login view with email + password fields + demo credential hints.
3. Click "Fill admin demo credentials" → fields populated.
4. Click "Sign in as Admin" → toast "Welcome back, Admin." + admin dashboard renders with:
   - Header: "MemoraX Admin" + "Signed in as Admin" + Back/Theme/Sign out buttons
   - Stats grid: 11 stat cards (6 users, 2 students active 2, 2 parents, 1 teacher, 5 courses, 7 assignments/7 submissions, 7 memories, 3 chats, 6 reminders, 1 family, 1 admin)
   - User management table with all 6 users + role filter tabs (All/Students/Parents/Teachers/Admins)
   - Activity feed with reminders + chats
   - Reset demo data button (in Danger zone card)
5. Click "Reset demo data" → AlertDialog confirmation → "Yes, reset everything" → toast "Demo data reset. 6 users re-seeded." + table refreshes with new users.
6. Click "Sign out" → returns to landing view.
7. Click Mia role card → student app loads with all 8 tabs (Tutor Chat, Classroom, Homework, Review, Exam Prep, Avatar & Shop, Study Groups, Memories). **Demo flow intact.**
8. Back to landing → Admin sign in → login as Mia (demo1234) → toast "Demo users: use the role cards on the home page to enter the app." + redirected to landing.
9. Login with bad password → toast "Invalid email or password." + stays on login page.

### dev.log
- All admin APIs return 200 with auth, 401 without auth.
- No 500 errors, no runtime exceptions, no Prisma errors after schema migration.
- `POST /api/auth/callback/credentials` returns 200 for valid creds, 401 for bad password.

## Stage Summary
- NextAuth v4 is fully wired: Credentials provider + JWT strategy + `requireAdmin` guard on every `/api/admin/*` route.
- Admin user (admin@memorax.school / admin1234) is seeded with a bcrypt-hashed password.
- All 4 admin APIs (stats, users, activity, reset) are gated and return 401 to anonymous callers AND to authenticated non-admins.
- Admin dashboard renders correctly with stats, user table, activity feed, and reset confirmation dialog.
- Demo flow (role cards on landing → student/parent/teacher apps) is unbroken.
- Sticky footer pattern, dark mode (semantic tokens only — no hardcoded indigo/blue), loading skeletons, and empty states are all in place.
- Lint clean, tsc clean (src/), 0 runtime errors.
