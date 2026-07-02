'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================
// MemoraX i18n — Spanish (default, Bolivia launch) + English.
// A lightweight dictionary-based system. Components call useT()
// to get a translation function:  const t = useT(); t('nav.pricing')
//
// Strings are namespaced by surface (nav.*, landing.*, common.*, etc.).
// Missing keys fall back to English, then to the key itself.
// ============================================================

export type Lang = 'es' | 'en'

type Dict = Record<string, string>

const es: Dict = {
  // ---- common ----
  'common.back': 'Volver',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.loading': 'Cargando…',
  'common.signOut': 'Cerrar sesión',
  'common.theme.toggle': 'Cambiar tema',
  'lang.toggle': 'Idioma',

  // ---- nav ----
  'nav.how': 'Cómo funciona',
  'nav.families': 'Para familias',
  'nav.pricing': 'Precios',
  'nav.why': 'Por qué MemoraX',
  'nav.getStarted': 'Empezar',
  'nav.tryDemo': 'Probar el demo',

  // ---- landing hero ----
  'landing.badge': 'Una capa de memoria para la escuela — inspirado en memorae.ai',
  'landing.hero.title1': 'El compañero de estudio con IA',
  'landing.hero.title2': 'que <accent>recuerda</accent> cómo aprende',
  'landing.hero.title3': 'tu hijo.',
  'landing.hero.desc': 'MemoraX está donde los estudiantes ya están — un asistente de chat que se sincroniza con Google Classroom, guía la tarea paso a paso (socrático, nunca solo respuestas) y mantiene a padres y profesores al tanto.',
  'landing.hero.cta': 'Probar el demo',
  'landing.hero.how': 'Ver cómo funciona',
  'landing.hero.trust.privacy': 'Privacidad primero',
  'landing.hero.trust.socratic': 'Tutor socrático',
  'landing.hero.trust.classroom': 'Sincronización con Google Classroom',

  // ---- landing sections ----
  'landing.how.title': 'Cómo funciona MemoraX',
  'landing.how.subtitle': 'Una memoria persistente que conecta a estudiantes, padres y profesores — sin esfuerzo extra para ninguno.',
  'landing.how.step1.t': 'El estudiante chatea con el tutor',
  'landing.how.step1.d': 'Pregunta, sube una foto de la tarea, o pide un plan de estudio. El tutor guía con preguntas socráticas — y recuerda cada sesión.',
  'landing.how.step2.t': 'La capa de memoria aprende',
  'landing.how.step2.d': 'Cada conversación alimenta una memoria persistente: áreas débiles, estilo de aprendizaje, lo que funciona. El tutor mejora con cada sesión.',
  'landing.how.step3.t': 'Padres y profesores se conectan',
  'landing.how.step3.d': 'Los padres reciben resúmenes y alertas. Los profesores ven áreas difíciles de toda la clase y generan planes de lección.',
  'landing.oneMemory.title': 'Una memoria. Tres formas de usarla.',
  'landing.roles.title': 'Entra como cualquier rol',
  'landing.roles.subtitle': 'Explora MemoraX desde cualquier perspectiva. Todo funciona en este demo.',
  'landing.why.title': 'Por qué las familias eligen MemoraX',
  'landing.pricing.badge': 'Precios en bolivianos',
  'landing.pricing.title': 'Planes simples que crecen contigo',
  'landing.pricing.subtitle': 'Empieza gratis, mejora cuando estés listo. Las familias ahorran más, los profesores aprenden gratis.',
  'landing.pricing.monthly': 'Mensual',
  'landing.pricing.annual': 'Anual',
  'landing.pricing.save': 'Ahorra ~30%',
  'landing.pricing.mo': '/mes',
  'landing.pricing.billedMonthly': 'facturado mensual',
  'landing.pricing.billedAnnual': 'facturado anual',
  'landing.pricing.cta.free': 'Empezar gratis',
  'landing.pricing.cta': 'Suscribir',
  'landing.pricing.mostPopular': 'MÁS POPULAR',
  'landing.faq.q1': '¿Hay opción gratis para profesores?',
  'landing.faq.a1': 'Sí — los profesores verificados con email escolar tienen Educator gratis para siempre.',
  'landing.faq.q2': '¿Puedo cambiar de plan después?',
  'landing.faq.a2': 'Cuando quieras. Mejoras inmediatas; bajadas de plan al final del ciclo.',
  'landing.faq.q3': '¿Qué pagos aceptan en Bolivia?',
  'landing.faq.a3': 'Tarjeta internacional (Stripe), QR bancario interbancario y Tigo Money. Todo en bolivianos.',
  'landing.footer.tagline': 'MemoraX — un compañero de estudio inspirado en la memoria. Demo para exploración.',
  'landing.footer.admin': 'Admin',

  // ---- student tabs ----
  'student.tab.chat': 'Tutor',
  'student.tab.classroom': 'Clases',
  'student.tab.homework': 'Tarea',
  'student.tab.review': 'Repaso',
  'student.tab.exam': 'Exámenes',
  'student.tab.avatar': 'Avatar',
  'student.tab.groups': 'Grupos',
  'student.tab.memories': 'Memorias',

  // ---- parent tabs ----
  'parent.tab.inbox': 'Bandeja',
  'parent.tab.insights': 'Progreso',
  'parent.tab.family': 'Familia',
  'parent.tab.messages': 'Mensajes',
  'parent.tab.settings': 'Ajustes',
  'parent.tab.billing': 'Plan & Facturación',

  // ---- teacher tabs ----
  'teacher.tab.classes': 'Mis Clases',
  'teacher.tab.progress': 'Estudiantes',
  'teacher.tab.atRisk': 'En riesgo',
  'teacher.tab.heatmap': 'Mapa de conceptos',
  'teacher.tab.conference': 'Conferencias',
  'teacher.tab.messages': 'Mensajes',

  // ---- admin ----
  'admin.title': 'MemoraX Admin',
  'admin.signedInAs': 'Sesión iniciada como',
  'admin.backToLanding': 'Volver al inicio',
  'admin.exitAdmin': 'Salir del admin',
  'admin.overview': 'Resumen',
  'admin.refresh': 'Actualizar',
  'admin.userMgmt': 'Gestión de usuarios',
  'admin.newUser': 'Nuevo usuario',
  'admin.recentActivity': 'Actividad reciente',
  'admin.dangerZone': 'Zona de peligro',
  'admin.resetData': 'Reiniciar datos demo',
}

const en: Dict = {
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.loading': 'Loading…',
  'common.signOut': 'Sign out',
  'common.theme.toggle': 'Toggle theme',
  'lang.toggle': 'Language',

  'nav.how': 'How it works',
  'nav.families': 'For families',
  'nav.pricing': 'Pricing',
  'nav.why': 'Why MemoraX',
  'nav.getStarted': 'Get started',
  'nav.tryDemo': 'Try the demo',

  'landing.badge': 'A memory layer built for school — inspired by memorae.ai',
  'landing.hero.title1': 'The AI study companion',
  'landing.hero.title2': 'that <accent>remembers</accent> how your',
  'landing.hero.title3': 'child learns.',
  'landing.hero.desc': 'MemoraX lives where students already are — a chat assistant that syncs with Google Classroom, guides homework step-by-step (Socratic, never just answers), and keeps parents and teachers in the loop.',
  'landing.hero.cta': 'Try the demo',
  'landing.hero.how': 'See how it works',
  'landing.hero.trust.privacy': 'Privacy-first',
  'landing.hero.trust.socratic': 'Socratic tutor',
  'landing.hero.trust.classroom': 'Google Classroom sync',

  'landing.how.title': 'How MemoraX works',
  'landing.how.subtitle': 'A persistent memory that connects students, parents, and teachers — with no extra effort from anyone.',
  'landing.how.step1.t': 'The student chats with the tutor',
  'landing.how.step1.d': 'Ask a question, upload a homework photo, or request a study plan. The tutor guides with Socratic questions — and remembers every session.',
  'landing.how.step2.t': 'The memory layer learns',
  'landing.how.step2.d': 'Every conversation feeds a persistent memory: weak areas, learning style, what works. The tutor gets better every session.',
  'landing.how.step3.t': 'Parents and teachers connect',
  'landing.how.step3.d': 'Parents get digests and alerts. Teachers see class-wide weak spots and generate lesson plans.',
  'landing.oneMemory.title': 'One memory. Three ways to use it.',
  'landing.roles.title': 'Jump in as anyone',
  'landing.roles.subtitle': 'Explore MemoraX from any perspective. Everything works in this demo.',
  'landing.why.title': 'Why families choose MemoraX',
  'landing.pricing.badge': 'Pricing in bolivianos',
  'landing.pricing.title': 'Simple plans that grow with you',
  'landing.pricing.subtitle': 'Start free, upgrade when you\'re ready. Families save more, teachers learn free.',
  'landing.pricing.monthly': 'Monthly',
  'landing.pricing.annual': 'Annual',
  'landing.pricing.save': 'Save ~30%',
  'landing.pricing.mo': '/mo',
  'landing.pricing.billedMonthly': 'billed monthly',
  'landing.pricing.billedAnnual': 'billed annual',
  'landing.pricing.cta.free': 'Start free',
  'landing.pricing.cta': 'Subscribe',
  'landing.pricing.mostPopular': 'MOST POPULAR',
  'landing.faq.q1': 'Is there a free option for teachers?',
  'landing.faq.a1': 'Yes — verified school teachers get Educator free forever. Just sign up with your school email.',
  'landing.faq.q2': 'Can I switch plans later?',
  'landing.faq.a2': 'Anytime. Upgrades take effect immediately; downgrades at the end of your billing cycle.',
  'landing.faq.q3': 'What payments do you accept in Bolivia?',
  'landing.faq.a3': 'International card (Stripe), bank QR interbancario, and Tigo Money. All in bolivianos.',
  'landing.footer.tagline': 'MemoraX — a memory-inspired study companion. Demo build for exploration.',
  'landing.footer.admin': 'Admin',

  'student.tab.chat': 'Tutor Chat',
  'student.tab.classroom': 'Classroom',
  'student.tab.homework': 'Homework',
  'student.tab.review': 'Review',
  'student.tab.exam': 'Exam Prep',
  'student.tab.avatar': 'Avatar & Shop',
  'student.tab.groups': 'Study Groups',
  'student.tab.memories': 'Memories',

  'parent.tab.inbox': 'Inbox',
  'parent.tab.insights': 'Insights',
  'parent.tab.family': 'Family',
  'parent.tab.messages': 'Messages',
  'parent.tab.settings': 'Settings',
  'parent.tab.billing': 'Plan & Billing',

  'teacher.tab.classes': 'My Classes',
  'teacher.tab.progress': 'Students',
  'teacher.tab.atRisk': 'At-Risk',
  'teacher.tab.heatmap': 'Concept Map',
  'teacher.tab.conference': 'Conference',
  'teacher.tab.messages': 'Messages',

  'admin.title': 'MemoraX Admin',
  'admin.signedInAs': 'Signed in as',
  'admin.backToLanding': 'Back to landing',
  'admin.exitAdmin': 'Exit admin',
  'admin.overview': 'Overview',
  'admin.refresh': 'Refresh',
  'admin.userMgmt': 'User management',
  'admin.newUser': 'New user',
  'admin.recentActivity': 'Recent activity',
  'admin.dangerZone': 'Danger zone',
  'admin.resetData': 'Reset demo data',
}

const DICTS: Record<Lang, Dict> = { es, en }

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLang = create<LangState>()(
  persist(
    (set) => ({
      lang: 'es', // Spanish default — Bolivia launch
      setLang: (l) => set({ lang: l }),
    }),
    { name: 'memorax-lang' }
  )
)

/** Translation hook. Returns a function t(key) → string. */
export function useT() {
  const lang = useLang((s) => s.lang)
  return (key: string): string => {
    return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key
  }
}

/** Translate a key that contains an <accent>...</accent> tag → returns parts. */
export function useTParts() {
  const lang = useLang((s) => s.lang)
  return (key: string): { before: string; accent: string | null; after: string } => {
    const raw = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key
    const m = raw.match(/^([\s\S]*?)<accent>([\s\S]*?)<\/accent>([\s\S]*)$/)
    if (m) return { before: m[1], accent: m[2], after: m[3] }
    return { before: raw, accent: null, after: '' }
  }
}
