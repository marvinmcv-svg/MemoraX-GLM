'use client'

import * as React from 'react'
import { Shield, FileText, Cookie, Trash2, Download, X, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PrivacyPolicy({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> MemoraX Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h3 className="font-semibold text-foreground mb-1">1. What we collect</h3>
            <p>MemoraX collects: your name, email, grade level, chat messages with the AI tutor, homework photos, learning progress (XP, streaks, achievements), and subscription tier. We do NOT collect: location data, browsing history, or contact lists.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">2. How we use your data</h3>
            <p>Your data is used to: provide AI tutoring personalized to your learning, track your progress, send homework reminders to parents, and improve our educational content. We never sell your data to third parties.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Children's privacy (COPPA)</h3>
            <p>MemoraX is designed for students. For users under 13, a parent or guardian must create the account and provide consent. Parents can: access their child's data, delete their child's account and all data, and opt out of data collection at any time.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Data retention</h3>
            <p>We retain your data while your account is active. Accounts inactive for 12 months are automatically deleted with all associated data. You can request immediate deletion at any time from your settings.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">5. AI interactions</h3>
            <p>Your chat messages are processed by our AI provider to generate tutor responses. These interactions are stored in your memory layer to personalize future sessions. Flagged interactions (inappropriate content) are logged for admin review.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">6. Your rights (GDPR/CCPA)</h3>
            <p>You have the right to: access your data, export your data, delete your account and all data, and object to processing. To exercise these rights, use the data controls in your settings or contact privacy@memorax.app.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">7. Security</h3>
            <p>All data is encrypted in transit (TLS) and at rest. Passwords are hashed with bcrypt. Access to student data is restricted to the student, their parents, and their teachers. Admin access is logged.</p>
          </section>
          <section>
            <h3 className="font-semibold text-foreground mb-1">8. Contact</h3>
            <p>Questions about privacy? Email privacy@memorax.app. We respond within 30 days.</p>
          </section>
          <p className="text-xs italic">Last updated: {new Date().toLocaleDateString()}. This policy may be updated; we'll notify you of significant changes.</p>
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">Got it</Button>
      </DialogContent>
    </Dialog>
  )
}

export function CookieConsent() {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    const consent = localStorage.getItem('memorax-cookie-consent')
    if (!consent) setShow(true)
  }, [])

  const accept = () => {
    localStorage.setItem('memorax-cookie-consent', 'accepted')
    setShow(false)
  }

  const decline = () => {
    localStorage.setItem('memorax-cookie-consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg">
      <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center gap-4">
        <Cookie className="h-6 w-6 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies for authentication and preferences. By clicking "Accept", you agree to our use of cookies. See our <button className="underline text-primary" onClick={() => window.dispatchEvent(new CustomEvent('open-privacy'))}>Privacy Policy</button>.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={decline}>Decline</Button>
          <Button size="sm" className="gap-1.5" onClick={accept}><Check className="h-3.5 w-3.5" /> Accept</Button>
        </div>
      </div>
    </div>
  )
}

export function DataControls({ userId }: { userId: string }) {
  const [exporting, setExporting] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const exportData = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/user/data-export?userId=${userId}`)
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memorax-data-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This will permanently delete your account and ALL your data (chats, memories, progress, achievements). This cannot be undone.')) return
    if (!confirm('Last warning: this is irreversible. Type DELETE to confirm (or click OK to proceed).')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/user/data-export?userId=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        localStorage.removeItem('memorax-session')
        window.location.href = '/'
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Your Data Rights</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Export your data</p>
              <p className="text-xs text-muted-foreground">Download all your MemoraX data as JSON</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportData} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-[var(--mx-clay)]/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-[var(--mx-clay)]" />
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently erase all your data</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-[var(--mx-clay)] hover:bg-[var(--mx-clay)]/10" onClick={deleteAccount} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
