// Shared MemoraX types

export type Role = 'STUDENT' | 'PARENT' | 'TEACHER'

export type View =
  | 'landing'
  | 'student'
  | 'parent'
  | 'teacher'

export type StudentTab = 'chat' | 'classroom' | 'homework' | 'memories' | 'review' | 'exam' | 'avatar' | 'groups'
export type ParentTab = 'inbox' | 'progress' | 'family'
export type TeacherTab = 'classes' | 'progress' | 'messages'

export type AssignmentType = 'HOMEWORK' | 'QUIZ' | 'PROJECT' | 'ESSAY' | 'READING'
export type SubmissionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED'

export type MemoryType =
  | 'NOTE'
  | 'CONCEPT'
  | 'HOMEWORK'
  | 'TUTOR_SESSION'
  | 'WEAK_AREA'
  | 'STUDY_TIP'

export type ReminderType =
  | 'DAILY_DIGEST'
  | 'DUE_TODAY'
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'PROGRESS_UPDATE'

export type ChatRole = 'user' | 'assistant'
export type TutorMode = 'socratic' | 'solution'

export interface SafeUser {
  id: string
  email: string
  name: string
  role: Role
  avatar: string | null
  grade: string | null
}

export interface CourseLite {
  id: string
  name: string
  subject: string | null
  teacherId: string
  teacherName: string
  color: string
  room: string | null
}

export interface AssignmentLite {
  id: string
  courseId: string
  courseName: string
  courseColor: string
  title: string
  description: string | null
  dueDate: string
  maxPoints: number
  type: AssignmentType
  status: SubmissionStatus
  score: number | null
  daysUntilDue: number
}

export interface MemoryLite {
  id: string
  type: MemoryType
  content: string
  tags: string | null
  importance: number
  createdAt: string
  relatedAssignmentTitle?: string | null
}

export interface ChatMsgLite {
  id: string
  role: ChatRole
  content: string
  imageUrl: string | null
  mode: TutorMode | null
  createdAt: string
}

export interface ReminderLite {
  id: string
  studentId: string
  studentName: string
  studentAvatar: string | null
  type: ReminderType
  title: string
  body: string
  scheduledFor: string
  sentAt: string | null
  readAt: string | null
  createdAt: string
}
