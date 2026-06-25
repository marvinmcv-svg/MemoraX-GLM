'use client'

import * as React from 'react'
import { FileText, Loader2, Sparkles, BookOpen, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface RosterStudent {
  id: string
  name: string
  avatar: string | null
  grade: string | null
}

export function TeacherConference() {
  const { user } = useSession()
  const [tab, setTab] = React.useState<'reports' | 'lessons'>('reports')
  const [students, setStudents] = React.useState<RosterStudent[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [report, setReport] = React.useState<{ narrative: string; stats: any; student: any } | null>(null)
  const [loadingReport, setLoadingReport] = React.useState(false)
  const [lessons, setLessons] = React.useState<any[]>([])
  const [loadingLessons, setLoadingLessons] = React.useState(true)
  const [expandedLesson, setExpandedLesson] = React.useState<string | null>(null)

  // load roster (all students across teacher's courses)
  React.useEffect(() => {
    if (!user) return
    api.teacherCourses(user.id).then(async (r) => {
      const allStudents: RosterStudent[] = []
      const seen = new Set<string>()
      for (const c of r.courses) {
        const roster = await api.teacherStudents(c.id)
        for (const s of roster.students) {
          if (!seen.has(s.id)) {
            seen.add(s.id)
            allStudents.push({ id: s.id, name: s.name, avatar: s.avatar, grade: s.grade })
          }
        }
      }
      setStudents(allStudents)
      if (allStudents.length > 0) setSelectedId(allStudents[0].id)
    })
  }, [user])

  // load lesson plans
  React.useEffect(() => {
    if (!user) return
    api.lessonPlans(user.id).then((r) => setLessons(r.plans)).catch(() => {}).finally(() => setLoadingLessons(false))
  }, [user])

  // generate conference report when student selected
  React.useEffect(() => {
    if (!user || !selectedId) return
    setLoadingReport(true)
    setReport(null)
    api.conferenceReport(user.id, selectedId)
      .then((r) => setReport(r))
      .catch(() => toast.error('Could not generate report'))
      .finally(() => setLoadingReport(false))
  }, [user, selectedId])

  const copyReport = () => {
    if (!report) return
    navigator.clipboard.writeText(report.narrative)
    toast.success('Report copied to clipboard')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-[var(--mx-emerald-soft)] to-[var(--mx-warm-soft)]/40">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center shadow-sm shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Conference prep</h2>
            <p className="text-sm text-muted-foreground">
              One-click narrative summaries per student, plus AI lesson plans — all from the memory layer.
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="reports" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Student reports</TabsTrigger>
          <TabsTrigger value="lessons" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Lesson plans</TabsTrigger>
        </TabsList>

        {/* Conference reports */}
        <TabsContent value="reports" className="mt-4">
          <div className="grid md:grid-cols-[200px_1fr] gap-4">
            {/* student selector */}
            <div className="space-y-1 max-h-[60vh] overflow-y-auto scroll-thin">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                    selectedId === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  <span className="text-base">{s.avatar ?? '🎒'}</span>
                  <span className="text-sm font-medium truncate">{s.name}</span>
                </button>
              ))}
            </div>

            {/* report */}
            <Card className="p-5 min-h-[300px]">
              {loadingReport ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Drafting narrative from memory layer…</p>
                </div>
              ) : report ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[var(--mx-emerald-soft)]">{report.student.avatar ?? report.student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{report.student.name}</p>
                      <p className="text-xs text-muted-foreground">{report.student.grade}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">Lvl {report.stats.level}</Badge>
                      <Badge variant="outline" className="text-[10px]">{report.stats.completion}% done</Badge>
                      <Badge variant="outline" className="text-[10px]">{report.stats.streak}d streak</Badge>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm leading-relaxed my-2">{children}</p>,
                      }}
                    >
                      {report.narrative}
                    </ReactMarkdown>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 mt-4" onClick={copyReport}>
                    <Download className="h-3.5 w-3.5" /> Copy for conference
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a student.</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Lesson plans */}
        <TabsContent value="lessons" className="mt-4">
          {loadingLessons ? (
            <div className="h-32 rounded-xl bg-muted animate-pulse" />
          ) : lessons.length === 0 ? (
            <Card className="p-10 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No lesson plans yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Go to the <b>Concept Heatmap</b> tab and tap “Lesson plan” on any struggling concept to
                generate one. It&apos;ll save here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.map((lp) => {
                const isOpen = expandedLesson === lp.id
                return (
                  <Card key={lp.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedLesson(isOpen ? null : lp.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-[var(--mx-warm-soft)] grid place-items-center shrink-0">
                        <BookOpen className="h-5 w-5 text-[var(--mx-warm)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate capitalize">{lp.topic}</p>
                        <p className="text-xs text-muted-foreground">{lp.courseName} · {new Date(lp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                    {isOpen && (
                      <div className="border-t bg-muted/20 p-4">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h2: ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-1">{children}</h2>,
                              p: ({ children }) => <p className="text-sm leading-relaxed my-1">{children}</p>,
                              ul: ({ children }) => <ul className="text-sm my-1 ml-4 list-disc">{children}</ul>,
                              li: ({ children }) => <li className="my-0.5">{children}</li>,
                            }}
                          >
                            {lp.content}
                          </ReactMarkdown>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 mt-3"
                          onClick={() => {
                            navigator.clipboard.writeText(lp.content)
                            toast.success('Lesson plan copied')
                          }}
                        >
                          <Download className="h-3.5 w-3.5" /> Copy plan
                        </Button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
