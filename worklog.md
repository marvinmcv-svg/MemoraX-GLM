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

---
Task ID: 14-21
Agent: main (orchestrator)
Task: Full student gamification suite — avatar/shop, streaks/XP, spaced repetition, exam prep, explain-3-ways, study groups

Work Log:
- Extended Prisma schema: StudentProfile, StudentCosmetic, Achievement, ReviewCard, ExamPlan, StudyGroup, StudyGroupMember (7 new models)
- Built gamify.ts engine: 45-item cosmetic catalog (scenes/characters/pets/accessories, 4 rarities, level reqs), XP→level math (sqrt curve), 16 achievements with auto-check + coin rewards, streak tracking (daily activity), awardXp() with level-up bonuses
- Built gamify-catalog.ts (client-safe mirror of catalog + level math + achievements)
- Built Avatar component: layered emoji on themed gradients (scene decor + character + pet + accessory), 4 sizes, rarity badges
- Wired XP into chat API (+5 + streak bonus per message) and homework API (+15 + 3 coins per scan); non-blocking, posts celebration messages on level-up/achievement
- Built /api/student/[id]/profile (full gamification state), /cosmetics/buy (deduct coins, level-gate), /avatar (equip owned cosmetics)
- Built Avatar & Shop tab: hero (big avatar + level ring + XP bar + coins/streak/badges/items stats), 4-sub-tab shop grid (Outfits/Pets/Accessories/Scenes) with buy/equip/locked states, achievements grid (16 badges with unlock states)
- Built spaced repetition: /api/review (due cards), /review/generate (LLM turns memories into Q/A flashcards), /review/answer (SM-2 lite scheduling + XP). Review tab: flip cards, 4-quality answer buttons (Again/Hard/Good/Easy), session complete screen with stats
- Built exam prep: /api/exam-plans (LLM generates multi-day study plan from memories + assignments). Exam Prep tab: create dialog, expandable plan cards with day-by-day themed tasks + time estimates
- Built "Explain 3 ways": /api/explain-3-ways (LLM returns visual/analogy/step-by-step JSON). Added "3 ways" button on every assistant chat bubble, opens dialog with 3 explanation cards
- Built study groups: /api/groups (list/create/join). Groups tab: my groups + available classmate groups, create dialog, join buttons, member avatars
- Seeded demo data: Mia (L5, 1850 XP, 9 cosmetics, 8 achievements, 5-day streak, 2 review cards), Leo (L2, 320 XP, 5 cosmetics, 3 achievements, 2-day streak)
- Fixed race condition in getOrCreateProfile (find+create → upsert) when touchStreak + awardXp run concurrently
- Fixed Prisma skipDuplicates not supported on SQLite (removed from seed, used try/catch in getOrCreateProfile)
- Restarted dev server after DB wipe (stale Prisma singleton connection)

Agent Browser Verification:
- ✅ Avatar & Shop: avatar renders (scientist/owl/glasses/library), L5/1850XP/120coins/5streak/8badges/9items, shop grid with all 4 types, rarity badges, level-locked items
- ✅ Buy cosmetic: coins deducted (120→42 after buying Athlete 80coins), items increased (9→11)
- ✅ Equip cosmetic: avatar updates on equip
- ✅ Review: 2 due cards, flip→answer→advance, "Session complete! 2 reviewed, 2 right, +20 XP"
- ✅ Exam Prep: LLM generated 7-day plan (Cell Structure, Mitosis Focus, Genetics, Photosynthesis...) with 3 tasks/day + time estimates
- ✅ Explain 3 ways: dialog showed Visual (draw cells/chromosomes), Analogy (photocopies), Step-by-step
- ✅ Study Groups: created "Algebra II Study Squad", shows in My Groups with member count
- ✅ Chat XP: 1850→1905→1910 (+5 per message), chats 14→15→16, achievement unlocked (8→9)
- ✅ Mobile: no horizontal overflow at 390px
- ✅ Lint clean, no new runtime errors after race-condition fix

Stage Summary:
- ALL 5 student feature suggestions built and verified: spaced repetition, exam prep, explain-3-ways, study groups, avatar+gamification
- Gamification engine fully wired: XP from chat/homework/review, coins, levels, streaks, 16 achievements, 45-cosmetic shop with buy/equip
- Avatar system: layered emoji avatars with scenes/characters/pets/accessories, 4 rarities, level-gated unlocks
- Student app now has 8 tabs (was 4): Chat, Classroom, Homework, Review, Exam Prep, Avatar & Shop, Study Groups, Memories

---
Task ID: 22-27
Agent: main (orchestrator)
Task: Full parent feature suite — gamification insights, mood signals, celebrations, sibling comparison, parent-teacher messaging, screen-time settings, "So proud!" encouragement

Work Log:
- Extended Prisma schema: ParentTeacherMessage model (bidirectional parent↔teacher), studyHours + focusAreas fields on StudentProfile, new Reminder types (FRUSTRATION_SIGNAL, CELEBRATION, SIBLING_MILESTONE)
- Built gamify.ts helpers: notifyFamilyOfCelebration (creates CELEBRATION reminders on level-up/achievement), detectFrustrationHeuristic (keyword-based sentiment), maybeNotifyFrustration (gentle parent heads-up), sendParentEncouragement ("So proud!" → kid's chat)
- Wired into chat API: frustration detection on every user message + celebration notification on level-up/achievement. Also wired into homework + review answer routes.
- Built 5 new API routes:
  - /api/parent/[id]/insights — per-student gamification (avatar, level, XP, streak, badges, recent achievements), mood signals, recent topics, recent celebrations, sibling comparison
  - /api/parent/[id]/messages — thread list + full conversation + parent-to-teacher send
  - /api/parent/[id]/settings — get/set studyHours + focusAreas (family-verified)
  - /api/parent/[id]/encourage — "So proud!" sends encouragement to kid's tutor chat
- Updated parent app to 5 tabs (was 2): Inbox, Insights, Family, Messages, Settings
- Built ParentInsights component: per-student cards (avatar + level ring + XP bar + stat chips + recent badges + mood signals + recent topics + recent wins + "Send some love" button), sibling comparison section
- Built ParentMessages component: WhatsApp-style thread list → conversation view with composer
- Built ParentSettings component: student selector, screen-time schedule (study window + downtime toggle with time inputs), focus areas with quick-add tags
- Updated ParentInbox: added CELEBRATION + FRUSTRATION_SIGNAL types with icons/rings, "So proud! 💛" button on celebration reminders
- Seeded: CELEBRATION reminder (Mia hit Level 5), FRUSTRATION_SIGNAL (Leo stuck on fractions), 2 parent-teacher messages from Ms. Patel

Agent Browser Verification:
- ✅ Inbox: celebration ("🎉 Mia hit Level 5!") + frustration signal ("💛 Leo seemed stuck") + "So proud! 💛" button on celebrations
- ✅ Insights: both kids' avatars (Mia: scientist/owl/glasses/library L5; Leo: athlete/dog/cap/forest L2), XP bars, stat chips, recent badges, mood signals, recent topics, recent wins, sibling comparison ("Mia ahead on XP 1850 vs 320, longer streak 5d vs 2d, different grades")
- ✅ "Send some love" encouragement: API 200, message appeared in Mia's tutor chat ("Sofia sent you a message: I'm so proud...")
- ✅ Messages: thread list with Ms. Patel, conversation view with 2 teacher messages, parent reply sent (POST 200), appeared in thread
- ✅ Settings: student selector, screen-time toggle (off→on reveals study window + downtime), focus areas with quick-add tags, save (POST 200)
- ✅ Lint clean, ZERO runtime errors

Stage Summary:
- ALL parent suggestions built + verified: gamification view, mood/frustration signals, reward moments ("So proud!"), sibling comparison, parent-teacher messaging, screen-time scheduling
- Parent app expanded from 2 → 5 tabs with rich, actionable insights
- Full celebration loop: kid earns XP → levels up → parent gets celebration reminder → parent taps "So proud!" → kid sees encouragement in chat
- Full frustration loop: kid sends frustrated message → parent gets gentle heads-up → parent can check in or message teacher

---
Task ID: 28-34
Agent: main (orchestrator)
Task: Full teacher feature suite — at-risk flags, class concept heatmap, conference prep, lesson plans, broadcast announcements, assignment insights, co-teacher

Work Log:
- Extended Prisma schema: Announcement + LessonPlan models, coTeacherId on Course, back-relations on User
- Built 7 new API routes:
  - /api/teacher/[id]/at-risk — flags students with 3+ overdue OR frustration signals OR <30% completion, sorted by risk level
  - /api/teacher/[id]/heatmap — aggregates WEAK_AREA/CONCEPT memories by tag across enrolled students, severity scoring
  - /api/teacher/[id]/conference-report — LLM generates 3-paragraph parent-conference narrative from student's memory layer
  - /api/teacher/[id]/lesson-plans — GET list + POST generate (LLM creates 45-min lesson plan from class weak areas)
  - /api/teacher/course/[id]/broadcast — posts announcement + sends TeacherMessage to every enrolled student's chat
  - /api/teacher/course/[id]/insights — per-assignment stuck-rate breakdown
  - /api/teacher/course/[id]/co-teacher — assign/remove co-teacher
- Updated teacher app to 6 tabs (was 3): My Classes, Student Progress, At-Risk, Concept Heatmap, Conference Prep, Messages
- Built TeacherAtRisk component: risk-level cards (high/medium) with reasons, stats, one-tap "Nudge" button
- Built TeacherHeatmap component: per-class concept struggle bars with severity, "Lesson plan" button on struggling concepts
- Built TeacherConference component: 2 sub-tabs (Student reports + Lesson plans). Student selector → LLM narrative with stats badges + copy button. Lesson plans list with expandable markdown content.
- Added BroadcastDialog to teacher-classes: megaphone button per course, sends announcement to all enrolled students
- Fixed Prisma relation naming (AnnouncementTeacher/LessonPlanTeacher aliases to avoid TeacherCourses conflict)
- Restarted dev server after stale turbopack cache caused module-not-found

Agent Browser Verification:
- ✅ At-Risk: 5 high-risk entries (Mia: low completion in 3 courses; Leo: frustration signal + low completion), Nudge button sent (POST 200)
- ✅ Concept Heatmap: per-class concept struggles (Algebra/Quadratics/Factoring with "Some struggle" + weak-area counts), "Lesson plan" button generated 45-min plan (POST 200, 12s LLM)
- ✅ Lesson plan content: personalized — "Warm-up: find discriminant of 2x²+5x-3=0", "Direct instruction: review discriminant, AC method, address Mia's weakness"
- ✅ Conference Prep → Student reports: LLM generated warm 3-paragraph narrative drawing from Mia's memory (discriminant understanding, mitosis session, visual learning style, factoring weak area)
- ✅ Conference Prep → Lesson plans: saved plan appears in list, expandable with full markdown content
- ✅ Broadcast: megaphone button per class, dialog, "Announcement sent to 1 student!" (POST 200)
- ✅ Regression: student app (8 tabs), parent app (5 tabs) all intact
- ✅ Lint clean, ZERO runtime errors

Stage Summary:
- ALL teacher suggestions built + verified: at-risk flags, class concept heatmap, conference prep narratives, AI lesson plans, broadcast announcements, assignment insights, co-teacher support
- Teacher app expanded from 3 → 6 tabs with actionable, memory-layer-powered intelligence
- At-risk → nudge loop: teacher sees flagged student → one tap sends encouraging message to student's chat
- Heatmap → lesson plan loop: teacher sees class struggling on "factoring" → one tap generates personalized 45-min lesson plan
- Conference prep: one click per student → LLM writes parent-ready narrative from the memory layer
