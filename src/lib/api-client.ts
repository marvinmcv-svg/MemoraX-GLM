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
