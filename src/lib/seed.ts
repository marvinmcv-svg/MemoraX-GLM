import { db } from '@/lib/db'

/**
 * Seed MemoraX with a realistic demo dataset.
 * Idempotent: safe to run multiple times (wipes existing data first).
 *
 * Cast:
 *  - Ms. Patel (teacher) — teaches Algebra II, Biology, World History
 *  - Mia Garcia (student, 8th grade) — enrolled in all three
 *  - Leo Garcia (student, 6th grade) — enrolled in Math 6, Earth Science
 *  - Sofia Garcia (parent) + Carlos Garcia (parent) — both linked to Mia & Leo
 */
export async function seedDatabase() {
  // wipe
  await db.teacherMessage.deleteMany()
  await db.reminder.deleteMany()
  await db.chatMessage.deleteMany()
  await db.memory.deleteMany()
  await db.submission.deleteMany()
  await db.assignment.deleteMany()
  await db.enrollment.deleteMany()
  await db.course.deleteMany()
  await db.familyMember.deleteMany()
  await db.family.deleteMany()
  await db.user.deleteMany()

  // ---------- Users ----------
  const [teacher, mia, leo, sofia, carlos] = await Promise.all([
    db.user.create({
      data: {
        email: 'mspatel@memorax.school',
        name: 'Ms. Ananya Patel',
        role: 'TEACHER',
        avatar: '👩🏽‍🏫',
      },
    }),
    db.user.create({
      data: {
        email: 'mia@memorax.family',
        name: 'Mia Garcia',
        role: 'STUDENT',
        avatar: '👧🏽',
        grade: '8th Grade',
      },
    }),
    db.user.create({
      data: {
        email: 'leo@memorax.family',
        name: 'Leo Garcia',
        role: 'STUDENT',
        avatar: '👦🏽',
        grade: '6th Grade',
      },
    }),
    db.user.create({
      data: {
        email: 'sofia@memorax.family',
        name: 'Sofia Garcia',
        role: 'PARENT',
        avatar: '👩🏻',
      },
    }),
    db.user.create({
      data: {
        email: 'carlos@memorax.family',
        name: 'Carlos Garcia',
        role: 'PARENT',
        avatar: '👨🏻',
      },
    }),
  ])

  // ---------- Family ----------
  const family = await db.family.create({
    data: { name: 'The Garcia Family' },
  })
  await db.familyMember.createMany({
    data: [
      { familyId: family.id, userId: mia.id, role: 'STUDENT' },
      { familyId: family.id, userId: leo.id, role: 'STUDENT' },
      { familyId: family.id, userId: sofia.id, role: 'PARENT' },
      { familyId: family.id, userId: carlos.id, role: 'PARENT' },
    ],
  })

  // ---------- Courses ----------
  const now = new Date()
  const days = (n: number) => new Date(now.getTime() + n * 86400000)

  const algebra = await db.course.create({
    data: {
      name: 'Algebra II',
      subject: 'Math',
      teacherId: teacher.id,
      color: 'emerald',
      room: 'Room 204',
    },
  })
  const biology = await db.course.create({
    data: {
      name: 'Biology',
      subject: 'Science',
      teacherId: teacher.id,
      color: 'teal',
      room: 'Lab 3',
    },
  })
  const history = await db.course.create({
    data: {
      name: 'World History',
      subject: 'History',
      teacherId: teacher.id,
      color: 'amber',
      room: 'Room 112',
    },
  })
  const math6 = await db.course.create({
    data: {
      name: 'Math 6',
      subject: 'Math',
      teacherId: teacher.id,
      color: 'emerald',
      room: 'Room 110',
    },
  })
  const earthSci = await db.course.create({
    data: {
      name: 'Earth Science',
      subject: 'Science',
      teacherId: teacher.id,
      color: 'teal',
      room: 'Lab 1',
    },
  })

  // enrollments
  await db.enrollment.createMany({
    data: [
      { courseId: algebra.id, studentId: mia.id },
      { courseId: biology.id, studentId: mia.id },
      { courseId: history.id, studentId: mia.id },
      { courseId: math6.id, studentId: leo.id },
      { courseId: earthSci.id, studentId: leo.id },
    ],
  })

  // ---------- Assignments ----------
  const a1 = await db.assignment.create({
    data: {
      courseId: algebra.id,
      title: 'Quadratic Equations — Problem Set 4',
      description:
        'Solve problems 1–12 using the quadratic formula. Show all work. Pay special attention to problems with negative discriminants.',
      dueDate: days(2),
      maxPoints: 100,
      type: 'HOMEWORK',
    },
  })
  const a2 = await db.assignment.create({
    data: {
      courseId: biology.id,
      title: 'Cell Mitosis Lab Report',
      description:
        'Write up your observations from Tuesday\'s onion root tip lab. Include diagrams of each phase and a one-paragraph conclusion.',
      dueDate: days(5),
      maxPoints: 50,
      type: 'PROJECT',
    },
  })
  const a3 = await db.assignment.create({
    data: {
      courseId: history.id,
      title: 'Essay — Causes of the French Revolution',
      description:
        '800-word essay analyzing the political, economic, and social causes. Use at least three sources from the reading list.',
      dueDate: days(9),
      maxPoints: 100,
      type: 'ESSAY',
    },
  })
  const a4 = await db.assignment.create({
    data: {
      courseId: algebra.id,
      title: 'Chapter 5 Quiz — Factoring',
      description: 'In-class quiz covering factoring trinomials and difference of squares.',
      dueDate: days(7),
      maxPoints: 40,
      type: 'QUIZ',
    },
  })
  const a5 = await db.assignment.create({
    data: {
      courseId: history.id,
      title: 'Reading: Chapter 12 Sections 1–2',
      description: 'Read pages 240–258. Be ready to discuss the Enlightenment thinkers.',
      dueDate: days(-1), // overdue
      maxPoints: 20,
      type: 'READING',
    },
  })
  const a6 = await db.assignment.create({
    data: {
      courseId: math6.id,
      title: 'Fractions Worksheet — Adding & Subtracting',
      description: 'Complete the double-sided worksheet. Remember to find common denominators!',
      dueDate: days(1),
      maxPoints: 30,
      type: 'HOMEWORK',
    },
  })
  const a7 = await db.assignment.create({
    data: {
      courseId: earthSci.id,
      title: 'Rock Cycle Diagram + Paragraph',
      description: 'Draw and label the rock cycle, then write a paragraph explaining how igneous rock becomes sedimentary.',
      dueDate: days(4),
      maxPoints: 40,
      type: 'HOMEWORK',
    },
  })

  // ---------- Submissions (Mia) ----------
  await db.submission.createMany({
    data: [
      { assignmentId: a1.id, studentId: mia.id, status: 'IN_PROGRESS' },
      { assignmentId: a2.id, studentId: mia.id, status: 'NOT_STARTED' },
      { assignmentId: a3.id, studentId: mia.id, status: 'NOT_STARTED' },
      { assignmentId: a4.id, studentId: mia.id, status: 'NOT_STARTED' },
      {
        assignmentId: a5.id,
        studentId: mia.id,
        status: 'GRADED',
        score: 16,
        submittedAt: days(-2),
      },
    ],
  })
  // Leo's submissions
  await db.submission.createMany({
    data: [
      { assignmentId: a6.id, studentId: leo.id, status: 'IN_PROGRESS' },
      { assignmentId: a7.id, studentId: leo.id, status: 'NOT_STARTED' },
    ],
  })

  // ---------- Memories (the memorae DNA) ----------
  await db.memory.createMany({
    data: [
      {
        studentId: mia.id,
        type: 'CONCEPT',
        content:
          'Mia understands the quadratic formula well but sometimes forgets the sign of the discriminant affects the number of real roots.',
        tags: 'algebra,quadratics,discriminant',
        importance: 4,
        relatedAssignmentId: a1.id,
      },
      {
        studentId: mia.id,
        type: 'WEAK_AREA',
        content:
          'Factoring trinomials with leading coefficient > 1 is a struggle area. Needs more practice on AC method.',
        tags: 'algebra,factoring',
        importance: 5,
        relatedAssignmentId: a4.id,
      },
      {
        studentId: mia.id,
        type: 'TUTOR_SESSION',
        content:
          'Worked through mitosis phases together. Mia drew each phase confidently. Anaphase vs. metaphase confusion cleared up.',
        tags: 'biology,mitosis',
        importance: 3,
        relatedAssignmentId: a2.id,
      },
      {
        studentId: mia.id,
        type: 'STUDY_TIP',
        content:
          'Mia learns best with visual diagrams. Encourage drawing before solving when possible.',
        tags: 'learning-style',
        importance: 4,
      },
      {
        studentId: mia.id,
        type: 'HOMEWORK',
        content:
          'Completed reading on Enlightenment thinkers. Strong recall on Voltaire and Rousseau, weaker on Montesquieu.',
        tags: 'history,enlightenment',
        importance: 3,
        relatedAssignmentId: a5.id,
      },
      {
        studentId: leo.id,
        type: 'WEAK_AREA',
        content:
          'Leo finds common denominators confusing. Prefers working with visual fraction models over abstract numbers.',
        tags: 'math,fractions',
        importance: 5,
        relatedAssignmentId: a6.id,
      },
      {
        studentId: leo.id,
        type: 'CONCEPT',
        content:
          'Leo understands igneous/sedimentary/metamorphic basics but gets the transformation arrows mixed up.',
        tags: 'science,rock-cycle',
        importance: 3,
        relatedAssignmentId: a7.id,
      },
    ],
  })

  // ---------- Chat history (Mia) ----------
  await db.chatMessage.createMany({
    data: [
      {
        studentId: mia.id,
        role: 'assistant',
        content:
          "Hi Mia! 👋 I'm your MemoraX tutor. I remember we worked on mitosis last week — you nailed anaphase! What are you working on today?",
        mode: 'socratic',
      },
      {
        studentId: mia.id,
        role: 'user',
        content: 'I am stuck on quadratic equations problem set 4',
      },
      {
        studentId: mia.id,
        role: 'assistant',
        content:
          "Nice — quadratics! Before we dive in, let's see where you are. Take a look at problem 1: what do you notice about the equation? Is it in the form ax² + bx + c = 0?",
        mode: 'socratic',
      },
    ],
  })

  // ---------- Gamification: starter profiles + cosmetics ----------
  // Mia: level ~4 (1600 XP), owns some cosmetics, 5-day streak
  await db.studentProfile.upsert({
    where: { studentId: mia.id },
    update: {},
    create: {
      studentId: mia.id,
      xp: 1850, // level 5 (1600) + a bit
      coins: 120,
      streakDays: 5,
      lastActiveDate: new Date(),
      totalChats: 14,
      totalHomework: 2,
      totalReviews: 3,
      scene: 'library',
      character: 'scientist',
      pet: 'owl',
      accessory: 'glasses',
    },
  })
  const miaCosmetics = ['library', 'forest', 'scientist', 'artist', 'owl', 'fox', 'glasses', 'headphones', 'gradcap']
  await db.studentCosmetic.createMany({
    data: miaCosmetics.map((cid) => ({ studentId: mia.id, cosmeticId: cid })),
  })
  // Mia achievements
  const miaAch = ['first_chat', 'chat_10', 'homework_1', 'review_1', 'streak_3', 'level_5', 'fresh_fit', 'collector']
  await db.achievement.createMany({
    data: miaAch.map((key) => ({ studentId: mia.id, key })),
  })

  // Leo: level ~2 (300 XP), owns a couple cosmetics, 2-day streak
  await db.studentProfile.upsert({
    where: { studentId: leo.id },
    update: {},
    create: {
      studentId: leo.id,
      xp: 320, // level 2
      coins: 45,
      streakDays: 2,
      lastActiveDate: new Date(),
      totalChats: 6,
      totalHomework: 0,
      totalReviews: 1,
      scene: 'forest',
      character: 'athlete',
      pet: 'dog',
      accessory: 'cap',
    },
  })
  const leoCosmetics = ['forest', 'athlete', 'dog', 'cap', 'bow']
  await db.studentCosmetic.createMany({
    data: leoCosmetics.map((cid) => ({ studentId: leo.id, cosmeticId: cid })),
  })
  const leoAch = ['first_chat', 'streak_3', 'fresh_fit']
  await db.achievement.createMany({
    data: leoAch.map((key) => ({ studentId: leo.id, key })),
  })

  // Mia: a couple review cards from her memories
  const miaMemories = await db.memory.findMany({ where: { studentId: mia.id }, take: 3 })
  if (miaMemories.length > 0) {
    await db.reviewCard.createMany({
      data: [
        {
          studentId: mia.id,
          memoryId: miaMemories[0].id,
          front: 'What does the discriminant (b² - 4ac) tell you about a quadratic equation?',
          back: 'Positive = two real roots, zero = one repeated root, negative = no real roots (two complex roots).',
          dueDate: new Date(),
        },
        {
          studentId: mia.id,
          memoryId: miaMemories[1]?.id ?? null,
          front: 'What is the AC method used for?',
          back: 'Factoring trinomials with a leading coefficient > 1. Split the middle term using two numbers that multiply to a·c and add to b.',
          dueDate: new Date(),
          repetitions: 1,
          interval: 3,
        },
      ],
    })
  }

  // ---------- Parent reminders (WhatsApp-style inbox) ----------
  await db.reminder.createMany({
    data: [
      {
        studentId: mia.id,
        familyId: family.id,
        type: 'DAILY_DIGEST',
        title: `📚 ${'Mia'}'s homework digest`,
        body:
          "Today (7:00 PM): Mia has 4 upcoming assignments.\n\n• Algebra II — Quadratic PS4 (due in 2 days, IN PROGRESS)\n• Biology — Mitosis Lab Report (due in 5 days)\n• History — French Revolution essay (due in 9 days)\n• Algebra II — Factoring Quiz (due in 7 days)\n\n1 overdue: History Reading Ch.12 (graded 16/20).",
        scheduledFor: days(0),
        sentAt: days(0),
      },
      {
        studentId: mia.id,
        familyId: family.id,
        type: 'DUE_SOON',
        title: '⏰ Algebra II — due in 2 days',
        body:
          "Mia's Quadratic Equations Problem Set 4 is due Thursday. She's marked it IN PROGRESS. Want me to nudge her?",
        scheduledFor: days(0),
        sentAt: days(0),
      },
      {
        studentId: leo.id,
        familyId: family.id,
        type: 'DUE_TODAY',
        title: '🔔 Leo — due TODAY',
        body:
          "Leo's Fractions Worksheet (Adding & Subtracting) is due today. He's IN PROGRESS on it.",
        scheduledFor: days(0),
        sentAt: days(0),
      },
      {
        studentId: mia.id,
        familyId: family.id,
        type: 'PROGRESS_UPDATE',
        title: '🌱 Progress update',
        body:
          "Mia improved her factoring accuracy this week (was 60%, now 78% on practice sets). The AC method is clicking!",
        scheduledFor: days(-1),
        sentAt: days(-1),
        readAt: days(-1),
      },
    ],
  })

  // ---------- Teacher messages ----------
  await db.teacherMessage.createMany({
    data: [
      {
        courseId: algebra.id,
        teacherId: teacher.id,
        studentId: mia.id,
        content:
          'Great improvement on the factoring warm-up today, Mia! Keep practicing the AC method.',
      },
      {
        courseId: math6.id,
        teacherId: teacher.id,
        studentId: leo.id,
        content:
          "Leo, remember to find a common denominator before adding fractions. Let's review together at lunch if you'd like.",
      },
    ],
  })

  return { teacher, mia, leo, sofia, carlos, family }
}
