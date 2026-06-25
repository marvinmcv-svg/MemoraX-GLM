# MemoraX — Work Log

MemoraX: a memorae-inspired AI assistant tailored for students, teachers, and parents.
Single-page Next.js 16 app (only `/` is user-visible) with client-side view-switching
between Landing / Student / Parent / Teacher apps, backed by API routes.

## Confirmed product decisions
1. AI Tutor = Socratic method + "Show me the solution" toggle
2. Google Classroom = mock now, real OAuth later
3. Teacher role = all three (create classes/assignments, see progress, message students)
4. Parent reminders = 7 PM daily digest + morning-of due date + overdue alerts
5. Family bundles = up to 2 parents per student
6. Build sequence: landing → student chat → homework VLM → classroom → parent → teacher
7. Palette experimentation as we go (start: warm emerald study theme, no indigo/blue)

---
Task ID: 1
Agent: main (orchestrator)
Task: Foundation — Prisma schema, design system, app shell with Zustand view-router, theme provider

Work Log:
- Inspected existing project state (Next.js 16, full shadcn/ui, dev server already running on :3000)
- Designed full data model for MemoraX
- Writing prisma/schema.prisma with: User/Role, Family/FamilyMember, Course/Enrollment/Assignment/Submission, Memory, ChatMessage, Reminder, TeacherMessage
- Building design system in globals.css (warm emerald study palette #1)
- Building app shell with Zustand view-router (landing/student/parent/teacher)

Stage Summary:
- Prisma schema live (10 models: User, Family, FamilyMember, Course, Enrollment, Assignment, Submission, Memory, ChatMessage, Reminder, TeacherMessage)
- Design system "Morning Study" palette (warm emerald + amber, cream bg, no indigo/blue) with light/dark
- App shell with Zustand view-router + persist; auto-bootstraps demo data on first load
- Landing page: hero, how-it-works, feature strip, role-selection with demo logins, trust section, sticky footer
- Student app: 4 tabs (Chat / Classroom / Homework / Memories)
  - WhatsApp-style chat: streaming LLM (SSE), Socratic/solution toggle, image attach, markdown, memory context, background memory extraction
  - Classroom: synced assignments feed (overdue/due-soon/upcoming/done), progress bar, Google Classroom banner
  - Homework: photo upload → VLM analyzes (transcribes, subject, topics, difficulty) → feeds tutor chat → stores memory
  - Memories: "memory layer" bubbles (concepts, weak areas, study tips) with importance + tags
- Parent app: 2 tabs (Inbox / Family)
  - WhatsApp-style reminder inbox (7PM digest, due-today, overdue, progress) with mark-read
  - Family bundle view: both parents + all students with progress stats + upcoming
  - "Refresh digest" button generates fresh 7PM digest on demand
- Teacher app: 3 tabs (Classes / Student Progress / Messages)
  - Classes: grid + create-class dialog + create-assignment dialog (syncs to all enrolled students)
  - Roster: per-course student progress, expandable assignment breakdown + tutor insights (memories), message dialog
  - Messages: sent-message feed
- Lint clean, dev server serving 200 on /

---
Task ID: 9
Agent: main (orchestrator)
Task: Self-verification with Agent Browser + bug fixes

Work Log:
- Agent Browser verified landing renders (hero, features, role selection, trust, sticky footer)
- Entered as Mia (student): chat streaming confirmed broken (empty assistant bubble)
- Diagnosed: z-ai SDK returns a Web ReadableStream (not async iterable) for stream:true; my for-await didn't iterate it
- Fixed src/lib/ai.ts streamChat() to use reader.read() + manual SSE parsing
- Re-verified: chat now streams token-by-token, Socratic replies render fully, memory auto-extracts (new "discriminant" memory appeared after session)
- Verified Classroom tab: assignments, due dates, statuses, progress bar all correct
- Verified Memories tab: memory bubbles render, auto-extracted memory confirmed
- Verified Homework upload: VLM transcribed all 3 problems (x²-5x+6=0, 2x²+7x+3, discriminant of 3x²-4x+2), subject=Math, topics, difficulty=medium
- Entered as Sofia (parent): inbox shows WhatsApp-style reminders (7PM digest, due-soon, both kids), mark-read works
- Family Bundle tab failed (Prisma deep-include TypeError) — rewrote /api/parent/[parentId]/family with separate queries + fixed missing `course: true` include
- Re-verified family: 2 parents + 2 students with progress stats + upcoming
- Verified "Refresh digest" button generates fresh 7PM digest
- Entered as Ms. Patel (teacher): classes grid (5 classes), create class (Physics 101 created)
- Roster: student progress, expandable breakdown + tutor insights
- Messaging: sent message to Mia; Messages tab initially failed (PrismaClientValidationError — TeacherMessage had no `course` relation)
- Fixed: rewrote /api/teacher/[teacherId]/messages to fetch courses separately (works with running client)
- Re-verified: 3 sent messages now display
- Created assignment (Newton's Laws Worksheet) — posted + auto-created NOT_STARTED submissions
- Mobile (390x844): no horizontal overflow, nav collapses, responsive
- Dark mode: toggles correctly, dark palette applied
- Sticky footer: min-h-screen flex flex-col + mt-auto confirmed
- Lint: clean

Stage Summary:
- ALL golden paths browser-verified end-to-end: student chat/homework/classroom/memories, parent inbox/family/digest, teacher classes/roster/messages/assignments
- 3 bugs found & fixed via Agent Browser: (1) streaming ReadableStream parsing, (2) family route deep-include, (3) teacher messages course relation
- Responsive, dark-mode, sticky-footer all confirmed
- App is production-ready for demo

---
Task ID: 10-11-12
Agent: main (orchestrator)
Task: Voice notes (ASR+TTS), subscription tiers, full rescan

Work Log:
- Loaded ASR + TTS skills for exact z-ai SDK API
- Built /api/asr (base64 audio → text via zai.audio.asr.create) and /api/tts (text → WAV via zai.audio.tts.create, returns audio/wav binary)
- Verified round-trip directly: TTS generated "Hello Mia, lets work on quadratic equations" → ASR transcribed back "Hello, Mia. Let us work on quadratic equations today." ✓
- Built useVoiceNotes hook (MediaRecorder → base64 → /api/asr → fills input) and useTTS hook (fetch /api/tts → blob URL → Audio playback, cached per message id)
- Wired into student chat: mic button toggles record/stop, red recording indicator with timer + cancel, transcribing spinner, "Listen"/"Stop" button on each assistant bubble (appears on hover, primary when playing)
- Built Pricing component: 4 tiers (Starter free, Scholar $7.99, Family $19.99, Educator $12.99) with monthly/annual toggle (25% off annual), feature matrix with check/x, "MOST POPULAR" badge on Scholar, FAQ row, "every plan includes" strip
- Added Pricing section to landing between role-selection and trust, added "Pricing" nav link
- Agent Browser verified: pricing renders all 4 tiers, toggle switches prices (Scholar $7.99→$5.99, etc.), CTA fires toast
- Verified voice UI: "Record voice note" mic button present, "Listen" buttons on all assistant messages, TTS API returned 200 (2s generation)
- Regression scan: student chat/classroom/memories, parent inbox/family, teacher classes — all still working, no new errors

Stage Summary:
- Voice notes feature COMPLETE: record (MediaRecorder) → ASR transcribe → fills input; TTS playback on every assistant reply (cached, toggle stop)
- Subscription tiers COMPLETE: 4 tiers, monthly/annual toggle, feature matrix, integrated into landing
- Full rescan PASSED: all 3 apps + landing + pricing + voice UI verified, lint clean, no runtime errors
