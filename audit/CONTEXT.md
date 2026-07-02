# MemoraX Audit — Shared Context for All Agents

## App Architecture
- Single Next.js 16 app, ONLY route is `/` (src/app/page.tsx → AppShell).
- Client-side view switching via Zustand store `useSession` (src/lib/session.ts). NOT real NextAuth — it's a mock persisted session.
- 4 views: `landing` | `student` | `parent` | `teacher`. User picks a role on the landing page; the mock session sets the current user.
- Bootstrap: on first load, AppShell calls POST /api/bootstrap which seeds demo data (idempotent). There is also POST /api/force-seed to re-seed.

## Dev server
- Running on http://localhost:3000 (internal). Do NOT tell users to visit localhost — they use the Preview Panel.
- Logs at /home/z/my-project/dev.log (read the TAIL only — file is large).

## Seeded users (find exact IDs by reading src/lib/seed.ts or GET /api/bootstrap)
- Students: Mia (grade 6), Leo (grade 4)
- Parents: Sofia (parent of Mia + Leo)
- Teacher: Ms. Patel (teaches several courses)

## Key paths
- Components: src/components/{landing,student,parent,teacher,shared,gamification,brand,ui}/
- APIs: src/app/api/...
- Lib: src/lib/{session,api-client,ai,db,seed,gamify,gamify-catalog,types,utils}.ts
- Prisma schema: prisma/schema.prisma (21 models)
- DB: SQLite via Prisma (`import { db } from '@/lib/db'`)

## How to test (use ALL of these)
1. **Agent Browser skill**: invoke `Skill(command="agent-browser")` to navigate/click/type/snapshot the UI at http://localhost:3000. This is a client-routed SPA — navigate by clicking role cards on the landing page, then tab bars inside each app.
2. **curl**: test API endpoints directly (GET/POST). Example: `curl -s http://localhost:3000/api/student/<id>/memories | head -c 500`.
3. **Read source**: verify logic in the component/API files for your scope.
4. **dev.log tail**: after triggering an action, `tail -30 /home/z/my-project/dev.log` to check for runtime errors / 500s / Prisma errors.

## CRITICAL RULES
- **DO NOT edit any source code.** You are a TESTER + REPORTER only. Fixes are consolidated by the orchestrator after all 12 agents report.
- **DO NOT call /api/force-seed or /api/bootstrap** (concurrent re-seeds by 12 agents will corrupt shared state). Assume data is already seeded.
- **Double-check every bug**: reproduce it at least twice (reload page, retry) before reporting. Do NOT report flaky or hallucinated bugs. If you can't reproduce, say "could not reproduce" — do not assert it's broken.
- **Triple-check severity**: a missing comma in a string is LOW; a 500 error on a core flow is CRITICAL; a broken tab is HIGH.
- Be precise: every bug report MUST include file path + line number + reproduction steps + expected vs actual.

## Report output
Write your full report to: `/home/z/my-project/audit/reports/<YOUR_TASK_ID>.md`
The orchestrator will merge all 12 reports into worklog.md after the parallel phase.
Use this template:

```markdown
# Audit Report — <TASK_ID>: <scope title>
Agent: <type>

## Scope
- Files: ...
- APIs: ...
- UI flows: ...

## What works (verified)
- ✅ ...

## Bugs found
### BUG <TASK_ID>-1 [CRITICAL|HIGH|MEDIUM|LOW]
- **File**: src/...:LINE
- **Repro**: step-by-step
- **Expected**: ...
- **Actual**: ...
- **Evidence**: (dev.log snippet / curl response / screenshot description)
- **Suggested fix**: ...

## Could-not-verify / Suspicions
- ...

## Verdict
PASS / PASS-WITH-BUGS / FAIL
```
