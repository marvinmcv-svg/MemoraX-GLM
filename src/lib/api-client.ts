'use client'

import type { SafeUser } from './types'

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} ${txt}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  bootstrap: () => jfetch<{ seeded: boolean; users?: any }>('/api/bootstrap', { method: 'POST' }),
  listUsers: () => jfetch<{ users: SafeUser[] }>('/api/bootstrap'),

  // student
  studentAssignments: (id: string) =>
    jfetch<{ assignments: any[] }>(`/api/student/${id}/assignments`),
  studentMemories: (id: string) => jfetch<{ memories: any[] }>(`/api/student/${id}/memories`),
  studentChat: (id: string) => jfetch<{ messages: any[] }>(`/api/student/${id}/chat`),

  // parent
  parentReminders: (id: string) => jfetch<{ reminders: any[] }>(`/api/parent/${id}/reminders`),
  markReminderRead: (id: string) =>
    jfetch<{ ok: boolean }>(`/api/parent/reminders/${id}/read`, { method: 'POST' }),
  parentFamily: (id: string) => jfetch<{ family: any }>(`/api/parent/${id}/family`),

  // teacher
  teacherCourses: (id: string) => jfetch<{ courses: any[] }>(`/api/teacher/${id}/courses`),
  teacherStudents: (courseId: string) =>
    jfetch<{ students: any[] }>(`/api/teacher/course/${courseId}/students`),
  createCourse: (teacherId: string, data: any) =>
    jfetch<{ course: any }>(`/api/teacher/course`, {
      method: 'POST',
      body: JSON.stringify({ teacherId, ...data }),
    }),
  createAssignment: (courseId: string, data: any) =>
    jfetch<{ assignment: any }>(`/api/teacher/assignment`, {
      method: 'POST',
      body: JSON.stringify({ courseId, ...data }),
    }),
  teacherMessage: (data: { courseId: string; teacherId: string; studentId: string; content: string }) =>
    jfetch<{ ok: boolean }>(`/api/teacher/message`, { method: 'POST', body: JSON.stringify(data) }),
  teacherMessages: (id: string) =>
    jfetch<{ messages: any[] }>(`/api/teacher/${id}/messages`),

  // gamification
  studentProfile: (id: string) => jfetch<any>(`/api/student/${id}/profile`),
  buyCosmetic: (studentId: string, cosmeticId: string) =>
    jfetch<any>(`/api/student/${studentId}/cosmetics/buy`, {
      method: 'POST',
      body: JSON.stringify({ cosmeticId }),
    }),
  equipAvatar: (studentId: string, data: any) =>
    jfetch<any>(`/api/student/${studentId}/avatar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviewDue: (studentId: string) => jfetch<any>(`/api/student/${studentId}/review`),
  generateReview: (studentId: string) =>
    jfetch<any>(`/api/student/${studentId}/review/generate`, { method: 'POST' }),
  answerReview: (studentId: string, cardId: string, quality: number) =>
    jfetch<any>(`/api/student/${studentId}/review/answer`, {
      method: 'POST',
      body: JSON.stringify({ cardId, quality }),
    }),
  examPlans: (studentId: string) => jfetch<any>(`/api/student/${studentId}/exam-plans`),
  createExamPlan: (studentId: string, data: any) =>
    jfetch<any>(`/api/student/${studentId}/exam-plans`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  groups: (studentId: string) => jfetch<any>(`/api/student/${studentId}/groups`),
  createGroup: (studentId: string, data: any) =>
    jfetch<any>(`/api/student/${studentId}/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  joinGroup: (studentId: string, groupId: string) =>
    jfetch<any>(`/api/student/${studentId}/groups/join`, {
      method: 'POST',
      body: JSON.stringify({ groupId }),
    }),
  explain3: (studentId: string, content: string) =>
    jfetch<any>(`/api/student/${studentId}/explain-3-ways`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // parent insights + messaging + settings
  parentInsights: (parentId: string) => jfetch<any>(`/api/parent/${parentId}/insights`),
  parentMessages: (parentId: string, teacherId?: string) =>
    jfetch<any>(`/api/parent/${parentId}/messages${teacherId ? `?teacherId=${teacherId}` : ''}`),
  sendParentMessage: (parentId: string, data: any) =>
    jfetch<any>(`/api/parent/${parentId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  parentSettings: (parentId: string, studentId: string) =>
    jfetch<any>(`/api/parent/${parentId}/settings?studentId=${studentId}`),
  updateParentSettings: (parentId: string, data: any) =>
    jfetch<any>(`/api/parent/${parentId}/settings`, { method: 'POST', body: JSON.stringify(data) }),
  parentEncourage: (parentId: string, studentId: string, message?: string) =>
    jfetch<any>(`/api/parent/${parentId}/encourage`, {
      method: 'POST',
      body: JSON.stringify({ studentId, message }),
    }),

  // teacher advanced features
  atRiskStudents: (teacherId: string) => jfetch<any>(`/api/teacher/${teacherId}/at-risk`),
  classHeatmap: (teacherId: string, courseId?: string) =>
    jfetch<any>(`/api/teacher/${teacherId}/heatmap${courseId ? `?courseId=${courseId}` : ''}`),
  conferenceReport: (teacherId: string, studentId: string) =>
    jfetch<any>(`/api/teacher/${teacherId}/conference-report?studentId=${studentId}`),
  lessonPlans: (teacherId: string, courseId?: string) =>
    jfetch<any>(`/api/teacher/${teacherId}/lesson-plans${courseId ? `?courseId=${courseId}` : ''}`),
  generateLessonPlan: (teacherId: string, courseId: string, topic?: string) =>
    jfetch<any>(`/api/teacher/${teacherId}/lesson-plans`, {
      method: 'POST',
      body: JSON.stringify({ courseId, topic }),
    }),
  broadcastAnnouncement: (courseId: string, content: string) =>
    jfetch<any>(`/api/teacher/course/${courseId}/broadcast`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  assignmentInsights: (courseId: string) =>
    jfetch<any>(`/api/teacher/course/${courseId}/insights`),
  setCoTeacher: (courseId: string, coTeacherId: string) =>
    jfetch<any>(`/api/teacher/course/${courseId}/co-teacher`, {
      method: 'POST',
      body: JSON.stringify({ coTeacherId }),
    }),
  removeCoTeacher: (courseId: string) =>
    jfetch<any>(`/api/teacher/course/${courseId}/co-teacher`, { method: 'DELETE' }),
}

/** Stream a tutor chat response. Calls onDelta for each chunk. Returns full text. */
export async function streamTutorChat(
  body: { studentId: string; message: string; mode: 'socratic' | 'solution'; imageUrl?: string | null },
  onDelta: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) {
    throw new Error(`chat failed: ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    // SSE-style: lines starting with "data: "
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return full
      try {
        const parsed = JSON.parse(data)
        if (parsed.delta) {
          full += parsed.delta
          onDelta(parsed.delta)
        }
        if (parsed.error) throw new Error(parsed.error)
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }
  return full
}
