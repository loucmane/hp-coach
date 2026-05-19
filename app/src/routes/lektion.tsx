// /lektion — Layer 1 framework reader.
//
// `/lektion` with no section shows a picker listing every section. The
// picker mirrors the drill section copy so the language is consistent.
// `/lektion?section=NOG` jumps straight into that section's reader.
//
// Auth-gated by __root.tsx. No D1 round-trip — frameworks are static
// JSON in public/.
//
// Naming caveat: PRD § 5.16 reserves "Lektion" for LLM-curated
// pedagogy (Phase B5). What this route renders today is raw framework
// JSON via LessonReader → TrapCard (B1.0). The chrome stays when B5
// swaps the content source.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { LessonReader } from '@/components/lesson/LessonReader'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Mono } from '@/components/primitives'
import { wiredSections } from '@/data/frameworks'
import { SECTION_KEYS, type Section } from '@/data/questions'

type Search = { section?: Section }

function validateSearch(input: Record<string, unknown>): Search {
  const raw = input.section
  if (typeof raw === 'string' && (SECTION_KEYS as readonly string[]).includes(raw)) {
    return { section: raw as Section }
  }
  return {}
}

export const Route = createFileRoute('/lektion')({
  validateSearch,
  component: LektionRoute,
})

// One line per section, sold by the section's biggest leverage trap
// rather than its definition — so a student deciding "which lesson
// at 9pm?" feels "yes, that's me" rather than reading a glossary.
// By convention each line is the gist of the section framework's
// first entry (the highest-leverage one in the catalog).
const SECTION_BLURB: Record<Section, string> = {
  ORD: 'Ordförståelse — täta rotkluster (för-, be-, över-) återkommer ofta.',
  LÄS: 'Svensk läsförståelse — det texten säger, inte det texten antyder.',
  MEK: 'Meningskomplettering — verb och objekt sitter ihop. Bytt verb låter fel.',
  ELF: 'Engelsk läsförståelse — det passagen säger, inte det den antyder.',
  XYZ: 'Matematisk problemlösning — minustecken över en parentes byter ALLA termer.',
  KVA: 'Kvantitativa jämförelser — kvadrat-likhet låser inte tecken.',
  NOG: 'Datasufficiens — två radsummor räcker inte för en enskild cell.',
  DTK: 'Diagram, tabeller, kartor — pinna identifieraren först, läs av sedan.',
}

function LektionRoute() {
  const { section } = Route.useSearch()
  const navigate = useNavigate()
  // Esc-to-parent: reader → picker, picker → home. Status line shows
  // "esc tillbaka" so the gesture is discoverable; this wires it. The
  // CommandPalette also listens for Escape, but only when its overlay
  // is open, so there's no double-handle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if ((e.target as HTMLElement | null)?.closest('[data-palette-open]')) return
      e.preventDefault()
      if (section) navigate({ to: '/lektion' })
      else navigate({ to: '/' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [section, navigate])

  if (section) return <ReaderShell section={section} />
  return <PickerShell />
}

// ── Picker ─────────────────────────────────────────────────────────

function PickerShell() {
  return (
    <MobileFrame activeTab="lektion">
      <Page
        runningHead={['HP · COACH', 'Lektion']}
        status={{
          mode: 'LEKTION',
          context: 'välj sektion',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <PickerBody />
      </Page>
    </MobileFrame>
  )
}

function PickerBody() {
  const navigate = useNavigate()
  const wired = new Set(wiredSections())
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingTop: 'clamp(32px, 4vw + 16px, 64px)',
        paddingBottom: 'clamp(48px, 6vw, 96px)',
      }}
    >
      <header className="reveal" style={{ animationDelay: '0ms' }}>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginBottom: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            textDecoration: 'none',
          }}
        >
          ← Hem
        </Link>
        <Mono>LEKTION</Mono>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 6vw + 16px, 88px)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: '12px 0 0 0',
          }}
        >
          Läs först.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 0.8vw + 14px, 22px)',
            lineHeight: 1.4,
            color: 'var(--ink-2)',
            margin: '16px 0 0 0',
            maxWidth: '52ch',
          }}
        >
          Varje sektion har sitt eget mönsterbibliotek — fällor, motåtgärder och taktiker hämtade
          från 27 riktiga prov. Välj en sektion att läsa innan du övar.
        </p>
      </header>

      <ul
        className="reveal"
        style={{
          marginTop: 'clamp(32px, 4vw + 16px, 64px)',
          padding: 0,
          listStyle: 'none',
          animationDelay: '120ms',
        }}
      >
        {SECTION_KEYS.map((sec) => {
          const isWired = wired.has(sec)
          return (
            <li key={sec} style={{ borderTop: '1px solid var(--hairline)' }}>
              <button
                type="button"
                onClick={() => isWired && navigate({ to: '/lektion', search: { section: sec } })}
                disabled={!isWired}
                style={{
                  all: 'unset',
                  display: 'block',
                  width: '100%',
                  cursor: isWired ? 'pointer' : 'default',
                  paddingBlock: 'clamp(20px, 2vw + 8px, 32px)',
                  opacity: isWired ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 'clamp(16px, 2vw, 28px)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(28px, 2.5vw + 10px, 44px)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      color: 'var(--ink)',
                      minWidth: 80,
                    }}
                  >
                    {sec}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(15px, 0.6vw + 13px, 18px)',
                      lineHeight: 1.45,
                      color: 'var(--ink-2)',
                      flex: 1,
                      minWidth: '20ch',
                    }}
                  >
                    {SECTION_BLURB[sec]}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    {isWired ? 'läs →' : 'kommer snart'}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Reader ─────────────────────────────────────────────────────────

function ReaderShell({ section }: { section: Section }) {
  return (
    <MobileFrame activeTab="lektion">
      <Page
        runningHead={['HP · COACH', `Lektion · ${section}`]}
        status={{
          mode: 'LEKTION',
          context: section,
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <LessonReader section={section} />
        <BackToPicker />
      </Page>
    </MobileFrame>
  )
}

function BackToPicker() {
  return (
    <div
      style={{
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingBottom: 'clamp(32px, 4vw, 56px)',
      }}
    >
      <Link
        to="/lektion"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          textDecoration: 'none',
        }}
      >
        ← alla sektioner
      </Link>
    </div>
  )
}
