# MemoraX — Expert Product Review

## What's genuinely strong (don't lose these)

1. **The three-sided model is rare and right.** Most EdTech serves one stakeholder. MemoraX serves student + parent + teacher with each side getting real, distinct value — not a shared dashboard. The loops between them (kid earns XP → parent gets celebration → parent sends "so proud" → kid sees it in chat) are the product's emotional core. Protect these.

2. **The memory layer is a real differentiator** — in concept. The idea that the tutor remembers prior sessions, weak areas, and learning style across time is the thing that could make MemoraX feel qualitatively different from ChatGPT-for-homework.

3. **The gamification is tasteful, not extractive.** Levels gate cosmetics (not paywalled content), achievements reward real milestones, the avatar system is charming. This is the right register for K-8.

4. **Teacher intelligence tools (at-risk, heatmap, conference reports) are genuinely useful.** A 45-min lesson plan generated from the class's actual weak areas — not generic — is the kind of thing teachers would pay for.

5. **The B&W identity + maze-brain logo now reads as a confident, premium brand.** It doesn't look like a generic EdTech template.

---

## The critical gaps (prioritized by impact × leverage)

### Gap 1 — The memory layer is the brand promise, but it's barely exploited
This is the single biggest gap, and it's on-brand to fix.

**What's there:** Every chat message triggers a background LLM extraction that stores a memory row (type, content, tags, importance 1-5). The tutor injects "top 12 by importance" into its system prompt.

**What's missing (verified in code):**
- **No semantic retrieval.** A student asking about "fractions" gets the 12 most *important* memories, not the 12 most *relevant*. If the most important memory is about photosynthesis, it's injected anyway. → The tutor doesn't actually *use* its memory well.
- **No memory decay.** Memories never weaken, never expire, never get reinforced by successful review. Ironic for a product whose name implies memory science.
- **Memories are read-only for students.** If the tutor misunderstands ("Mia struggles with factoring" when she doesn't), the misconception persists forever and keeps mis-informing the tutor and the parent. There's no `PATCH /api/student/.../memories/[id]`.
- **No memory graph.** A WEAK_AREA in factoring isn't linked to the CONCEPT of quadratics, the assignment that revealed it, or the review card it generated. Everything is flat rows.

**Highest-leverage fix:** Add semantic retrieval (embed memories, retrieve by cosine similarity to the current question) + let students edit/delete their own memories. These two changes make the tutor feel like it *actually remembers* — which is the entire pitch.

---

### Gap 2 — The tutor is reactive Q&A, not a learning path
The tutor waits for the student to ask. Real tutoring is proactive: the tutor knows what you're weak on and drives the session.

**What's missing:**
- No per-concept mastery state (introduced → practiced → mastered). Importance 1-5 is a loose proxy, not a model.
- No "what should I work on tonight?" — the tutor never proposes the next thing based on weak areas.
- No deliberate-practice loop: tutor generates a calibrated problem → student attempts → feedback → next problem adjusted to the gap.
- The exam plan generates a 7-day schedule, but nothing sequences a *single session*.

**Why this matters:** A student who doesn't know what to ask gets no value from a reactive tutor. The memory layer already knows their weak areas — the tutor should *start* the conversation with "Last time you were stuck on factoring. Want to try one together?" That's the difference between "AI homework helper" and "AI tutor."

---

### Gap 3 — The parent experience is surveillance, not partnership
Currently parents *observe* (digests, frustration signals, sibling comparison, celebrations) and can only *react* ("So proud!"). That's a one-way mirror.

**Verified gap:** The `focusAreas` parent setting is stored in the DB but **not wired to the tutor prompt** at all. A parent setting "focus on fractions" changes nothing about what the tutor does. That's a broken promise.

**What's missing:**
- Focus areas should shape the tutor's behavior (the tutor proactively raises fractions, generates fraction problems, checks in on fraction mastery).
- Parents need *actionable* next steps, not just observations: "Ask Mia to teach you the AC method tonight — teaching reinforces learning" is worth 10× a "frustration signal."
- The frustration signal is a **care/privacy landmine**. Automatically alerting a parent that their child "seemed frustrated" based on keyword detection ("I hate this," "ugh") will misfire constantly — every kid says that about hard problems. It risks making students feel monitored. Needs: (a) explicit student consent to share emotional signals, (b) much higher-confidence detection or human-in-the-loop, (c) the student should be able to see exactly what gets shared with their parent.

---

### Gap 4 — No real classroom workflow for teachers
The teacher intelligence tools are excellent. The teacher *day-to-day* is thin.

**Verified gaps:**
- **No grading UI.** Submissions have a `score` field that's `null` until... nothing. There's no grade-entry, no rubric, no feedback flow. The "GRADED" status exists in the schema but nothing produces it.
- **VLM homework analysis goes to the student's memory only.** The teacher never sees what the VLM found — they can't review the AI's read of a student's homework before it shapes the memory layer. That's an accountability gap.
- **Co-teacher is in the schema but barely in the UI.**
- **"Google Classroom" styling implies an integration that doesn't exist.** Fine for a demo; a real product needs Google Classroom/Clever sync or this tab misleads.

---

### Gap 5 — Gamification rewards activity, not mastery
**Verified:** 13 of 16 achievements reward *volume* (sent 50 chats, 10 homework photos, 25 reviews, 30-day streak). Only "Polymath" (5 mastered concepts) rewards understanding. A student can hit Level 10 by asking trivial questions for an hour.

**Why this matters:** This is the "engagement theater" trap. Students will optimize for XP, and the system will reward them for behavior that doesn't produce learning. The gamification should reward *demonstrated mastery* — and the memory layer already has the signal (WEAK_AREA → CONCEPT mastered) to do this.

---

### Gap 6 — No onboarding, no path to "real" usage
The demo flow (pick a role card → you're in) is great for a demo. There's no real onboarding:
- Students: no grade/subject setup, no initial diagnostic.
- Parents: no invite/link-their-actual-child flow.
- Teachers: no class import/roster setup.

The mock session is fine for demos but there's no seam between "demo" and "real." A teacher who wants to actually use this has no way in.

---

### Gap 7 — EdTech-specific AI safety is absent
The tutor has a Socratic system prompt and that's it. For a product used by minors:
- No content filtering (the tutor will explain anything).
- No age-appropriate language calibration (the same answer goes to a 6th grader and a graduate student).
- No "I'm not the right helper" routing for non-academic distress (a student typing "I want to give up on everything" gets a study tip, not a crisis resource).
- No audit log of what the AI said to a minor.

This isn't optional for a real EdTech product — it's table stakes for trust and legal exposure.

---

### Gap 8 — Data privacy & compliance isn't on the radar
- FERPA (US student records) and COPPA (under-13 data) compliance: no consent flows, no data retention policy, no parent-managed minor accounts.
- No data export or deletion (GDPR right to be forgotten).
- Auth is email/password; real schools need SSO (Google for Education, Clever, ClassLink).

---

## If you do three things, do these

1. **Make the memory layer real.** Semantic retrieval (so the tutor actually uses relevant memories) + student-editable memories (so misconceptions get corrected). This is the brand promise. One week of work, transforms the product.

2. **Make the tutor proactive.** When a student opens the chat with no question, the tutor should start: "You were stuck on factoring last time — want to try one?" Drive sessions from the memory layer's weak areas. This is the difference between a helper and a tutor.

3. **Wire focus areas to the tutor + make parents actionable.** A parent who sets "focus on fractions" should see the tutor actually focus on fractions, and should get specific nightly suggestions ("ask Mia to teach you X") instead of generic digests. This converts the parent experience from surveillance to partnership.

## After those, the path to "most of its potential"

- **Mastery-based gamification** — re-architect achievements around demonstrated understanding, not volume.
- **Teacher grading workflow** + a "review the AI's homework read before it becomes a memory" step.
- **Memory decay + reinforcement loop** — reviews should strengthen the memories they're built from; unreviewed memories decay. This closes the loop between the spaced-repetition system and the memory layer (currently they're parallel, not connected).
- **EdTech guardrails** — content filtering, age calibration, crisis routing, audit logs.
- **Real onboarding + SSO** — the seam between demo and real product.
- **FERPA/COPPA basics** — consent, retention, parent-managed minors.

## One honest framing

MemoraX is currently a **really impressive demo of a product**. The feature surface (47 API routes, 21 models, 4 roles, 7 AI touchpoints, streaming chat, VLM homework, spaced repetition, gamification, parent-teacher messaging, admin) is genuinely substantial and well-built. The audits confirmed the *plumbing* works.

But the *product thesis* — "memory-powered AI tutor" — is only 30% realized. The memory layer exists but doesn't drive retrieval, doesn't decay, isn't editable, isn't connected to the review system, and doesn't shape the tutor's proactivity. Fixing that is the difference between "a polished EdTech demo" and "a product that actually moves learning outcomes." Everything else (onboarding, compliance, teacher workflow) is necessary table stakes, but the memory layer is the thesis. Start there.
