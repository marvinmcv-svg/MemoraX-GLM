'use client'

import * as React from 'react'
import { AppShell } from '@/components/app-shell'
import { CookieConsent, PrivacyPolicy } from '@/components/auth/privacy'

export function AppWrapper() {
  const [showPrivacy, setShowPrivacy] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setShowPrivacy(true)
    window.addEventListener('open-privacy', handler)
    return () => window.removeEventListener('open-privacy', handler)
  }, [])

  return (
    <>
      <AppShell />
      <CookieConsent />
      <PrivacyPolicy open={showPrivacy} onOpenChange={setShowPrivacy} />
    </>
  )
}
