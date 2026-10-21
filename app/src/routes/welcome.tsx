// Day zero: personal preferences, a small ORD pattern, three real questions.
import { useUser } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useActiveSessionOfKind } from '@/api/hooks/useSessions'
import { useStats } from '@/api/hooks/useStats'
import { useUpdateUserPrefs, useUserPrefs } from '@/api/hooks/useUserPrefs'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { Btn, Eyebrow } from '@/components/primitives'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { type LexiconEntry, loadFramework } from '@/data/frameworks'
import { loadBank, type Question } from '@/data/questions'
import { daysUntil, EXAM_SITTINGS, nextSitting, resolveSitting } from '@/lib/dates'
import {
  DAILY_MINUTES,
  FIRST_SESSION_ROOT,
  firstSessionDoneLine,
  firstSessionOrigin,
  pickFirstSessionQuestions,
} from '@/lib/firstSession'
import { useFirstContentSignal } from '@/lib/motion'
import type { PaletteKey } from '@/lib/tokens'
import { WELCOMED_KEY } from '@/lib/welcome'
import { useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/welcome')({ component: WelcomeRoute })

type Step = 'theme' | 'sitting' | 'minutes' | 'pattern' | 'session' | 'done'

function markWelcomed() {
  try {
    localStorage.setItem(WELCOMED_KEY, '1')
  } catch {
    /* Storage is optional. */
  }
}

function WelcomeRoute() {
  useFirstContentSignal()
  const navigate = useNavigate()
  const mode = useUiStore((s) => s.mode)
  const palette = useUiStore((s) => s.palette)
  const { setMode, setPalette, setSitting } = useSyncedPrefs()
  const updatePrefs = useUpdateUserPrefs()
  const prefs = useUserPrefs()
  const stats = useStats()
  const active = useActiveSessionOfKind('onboarding')
  const { user } = useUser()
  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? null
  const [step, setStep] = useState<Step>('theme')
  // Saved values may arrive after mount. Derive untouched choices from them,
  // but preserve any explicit choice while a preference refetch is in flight.
  const [chosenSitting, chooseSitting] = useState<string | null>(null)
  const [chosenMinutes, chooseMinutes] = useState<number | null>(null)
  const sitting = chosenSitting ?? resolveSitting(prefs.data?.targetSittingId)?.id ?? null
  const savedMinutes = DAILY_MINUTES.find((value) => value === prefs.data?.dailyMinutes)
  const minutes = chosenMinutes ?? savedMinutes ?? 20
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [root, setRoot] = useState<LexiconEntry | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadRound, setLoadRound] = useState(0)
  const [qid, setQid] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const resumed = useRef(false)

  useEffect(() => {
    if (!active.data || resumed.current) return
    resumed.current = true
    setStep((current) => (current === 'session' || current === 'done' ? current : 'pattern'))
  }, [active.data])

  // biome-ignore lint/correctness/useExhaustiveDependencies: focus the new heading whenever the visible step changes
  useEffect(() => {
    heading.current?.focus()
  }, [step])
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadRound is the explicit retry trigger
  useEffect(() => {
    if (step !== 'pattern') return
    let alive = true
    setError(null)
    Promise.all([loadFramework('ORD'), loadBank()])
      .then(([framework, bank]) => {
        if (!alive) return
        const entry =
          framework?.family === 'ord_roots'
            ? framework.entries.find((item) => item.id === FIRST_SESSION_ROOT)
            : null
        const picked = pickFirstSessionQuestions(bank)
        if (!entry || picked.length !== 3) {
          setError('Första passet kunde inte laddas. Du kan försöka igen eller hoppa över.')
          return
        }
        setRoot(entry)
        setQuestions(picked)
      })
      .catch(() => {
        if (alive)
          setError('Första passet kunde inte laddas. Du kan försöka igen eller hoppa över.')
      })
    return () => {
      alive = false
    }
  }, [step, loadRound])

  const home = () => {
    markWelcomed()
    navigate({ to: '/' })
  }
  const afterMinutes = () => {
    setSaving(false)
    setError(null)
    // An in-flight first pass can resume even though its first answer has
    // already increased effort. An established account skips the lesson.
    setStep((stats.data?.attempts.total ?? 0) > 0 && !active.data ? 'done' : 'pattern')
  }
  const saveSitting = async () => {
    if (!prefs.data) return
    setError(null)
    if (!sitting || sitting === prefs.data.targetSittingId) {
      setStep('minutes')
      return
    }
    setSaving(true)
    try {
      await setSitting(sitting)
      setStep('minutes')
    } catch {
      setError('Det gick inte att spara provet. Försök igen eller hoppa över.')
    } finally {
      setSaving(false)
    }
  }
  const saveMinutes = () => {
    if (!prefs.data || !stats.data || active.isPending) return
    if (minutes === prefs.data.dailyMinutes) {
      afterMinutes()
      return
    }
    setSaving(true)
    setError(null)
    updatePrefs.mutate(
      { dailyMinutes: minutes },
      {
        onSuccess: afterMinutes,
        onError: () => {
          setSaving(false)
          setError('Det gick inte att spara tiden. Försök igen eller hoppa över.')
        },
      },
    )
  }

  if (step === 'session') {
    return (
      <SessionPlayer
        sessionKind="onboarding"
        sections="ORD"
        activeTab="ova"
        autoStart
        pickQuestions={() => questions}
        resolvePlan={async (ids) => {
          const bank = await loadBank()
          const resolved = ids.map((id) => bank.find((q) => q.qid === id))
          // A stale stored plan must never produce a false three-question win.
          return ids.length === 3 &&
            new Set(ids).size === 3 &&
            resolved.every((q) => q && firstSessionOrigin(q.qid) && q.options?.length)
            ? (resolved as Question[])
            : []
        }}
        urlSyncedQid={{ qid, setQid }}
        onComplete={markWelcomed}
        idleEyebrow="Första passet · ORD"
        idleHeadline="Tre ord från riktiga prov"
        idleSubcopy="Ta ett ord i taget. Du får läsa förklaringen efter varje fråga."
        emptyCopy="Frågorna kunde inte laddas. Du kan hoppa över och komma tillbaka senare."
        renderDone={({ summary }) => (
          <WelcomeDone
            line={firstSessionDoneLine(summary.questions, summary.picks)}
            questions={summary.questions}
            onHome={home}
          />
        )}
      />
    )
  }

  if (step === 'done') return <WelcomeDone line={null} onHome={home} />

  const title =
    step === 'theme'
      ? firstName
        ? `${firstName}, gör den till din.`
        : 'Gör den till din.'
      : step === 'sitting'
        ? 'Vilket prov siktar du på?'
        : step === 'minutes'
          ? 'Hur mycket tid passar dig?'
          : 'Ett litet o- vänder betydelsen'

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: 'clamp(40px, 8vh, 96px) clamp(28px, 5vw, 80px)',
      }}
    >
      <div
        style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 28 }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Eyebrow>{step === 'pattern' ? 'Första passet · cirka 2 minuter' : 'HP · Coach'}</Eyebrow>
          <h1
            ref={heading}
            tabIndex={-1}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(32px, 6vw, 56px)',
              lineHeight: 1.1,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 18, lineHeight: 1.55, margin: 0 }}>
            {step === 'theme'
              ? 'Börja med färgerna. Du kan ändra dem under Mer → Inställningar när som helst.'
              : step === 'sitting'
                ? 'Välj provet du vill öva inför. Det går att ändra senare.'
                : step === 'minutes'
                  ? 'Välj en lagom stund per dag. Du kan alltid ändra dig.'
                  : 'Leta efter början av ordet. Den kan ge dig en ledtråd till betydelsen.'}
          </p>
        </header>
        {step === 'theme' && (
          <>
            <PickerRow label="Belysning">
              <PickerOption
                label="ljust"
                sublabel="dag · papper på bord"
                active={mode === 'light'}
                onClick={() => {
                  void setMode('light').catch(() =>
                    setError('Det gick inte att spara belysningen.'),
                  )
                }}
              />
              <PickerOption
                label="mörkt"
                sublabel="kväll · bläck på pergament"
                active={mode === 'dark'}
                onClick={() => {
                  void setMode('dark').catch(() => setError('Det gick inte att spara belysningen.'))
                }}
              />
            </PickerRow>
            <PickerRow label="Palett">
              {(
                [
                  ['spalt', 'sval blågrön · standard'],
                  ['sand', 'varm tan'],
                  ['sage', 'grönaktig'],
                  ['ink', 'indigo · mörk'],
                  ['rose', 'mjuk rosa'],
                ] as const
              ).map(([p, sub]) => (
                <PaletteOption
                  key={p}
                  p={p}
                  label={p}
                  sub={sub}
                  active={palette === p}
                  onClick={() => {
                    void setPalette(p).catch(() => setError('Det gick inte att spara paletten.'))
                  }}
                />
              ))}
            </PickerRow>
          </>
        )}
        {step === 'sitting' && (
          <PickerRow label="Prov">
            {EXAM_SITTINGS.filter((s) => daysUntil(s.date) >= 0).map((s) => (
              <PickerOption
                key={s.id}
                label={s.label}
                sublabel={s.date.toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                active={sitting === s.id}
                onClick={() => chooseSitting(s.id)}
              />
            ))}
            {!nextSitting() && (
              <p>Nästa provdatum är inte publicerat här än. Du kan välja det senare.</p>
            )}
          </PickerRow>
        )}
        {step === 'minutes' && (
          <PickerRow label="Minuter per dag">
            {DAILY_MINUTES.map((m) => (
              <PickerOption
                key={m}
                label={`${m} minuter`}
                active={minutes === m}
                onClick={() => chooseMinutes(m)}
              />
            ))}
          </PickerRow>
        )}
        {step === 'pattern' && root && (
          <section
            aria-label="Ordmönster"
            style={{ display: 'grid', gap: 16, color: 'var(--ink)', lineHeight: 1.7 }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 2vw + 16px, 40px)',
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {root.root}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontStyle: 'italic',
                lineHeight: 1.4,
                color: 'var(--ink-2)',
                margin: 0,
              }}
            >
              {root.meaning}
            </p>
            <div>
              <Eyebrow>Exempel</Eyebrow>
              <ul style={{ margin: '8px 0 0', paddingLeft: 24 }}>
                {root.example_words.slice(0, 3).map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            </div>
            <p style={{ margin: 0 }}>
              Tänk på skillnaden mellan betydlig och obetydlig. Prova sedan samma ledtråd i tre ord
              från högskoleprovet.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
              Det här första passet är till för att prova. Det påverkar inte din prognos.
            </p>
          </section>
        )}
        {error && (
          <p role="alert" style={{ color: 'var(--ink-2)' }}>
            {error}
          </p>
        )}
        {step === 'pattern' && error && (
          <Btn onClick={() => setLoadRound((n) => n + 1)}>Försök igen</Btn>
        )}
        {step === 'minutes' && stats.isError && (
          <Btn
            onClick={() => {
              void stats.refetch()
            }}
          >
            Försök igen
          </Btn>
        )}
        {(step === 'sitting' || step === 'minutes') && prefs.isError && (
          <Btn
            onClick={() => {
              void prefs.refetch()
            }}
          >
            Hämta dina val igen
          </Btn>
        )}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          {step === 'pattern' ? (
            <Btn disabled={!root || questions.length !== 3} onClick={() => setStep('session')}>
              Prova tre frågor →
            </Btn>
          ) : (
            <Btn
              disabled={
                saving ||
                ((step === 'sitting' || step === 'minutes') && !prefs.data) ||
                (step === 'minutes' && (!stats.data || active.isPending))
              }
              onClick={() => {
                if (step === 'theme') {
                  setError(null)
                  setStep('sitting')
                } else if (step === 'sitting') void saveSitting()
                else saveMinutes()
              }}
            >
              {saving ? 'Sparar…' : 'Fortsätt →'}
            </Btn>
          )}
          <SkipButton onClick={home} />
        </div>
      </div>
    </div>
  )
}

function WelcomeDone({
  line,
  questions = [],
  onHome,
}: {
  line: string | null
  questions?: readonly Question[]
  onHome: () => void
}) {
  const origins = questions.flatMap((q) => {
    const origin = firstSessionOrigin(q.qid)
    return origin ? [origin.replace('Högskoleprovet ', '')] : []
  })
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    markWelcomed()
    heading.current?.focus()
  }, [])
  return (
    <section style={{ padding: 'clamp(28px, 6vw, 64px)', maxWidth: 720, color: 'var(--ink)' }}>
      <Eyebrow>Din start</Eyebrow>
      <h1
        ref={heading}
        tabIndex={-1}
        style={{ fontFamily: 'var(--font-display)', fontWeight: 500, lineHeight: 1.2 }}
      >
        {line ?? 'Du är igång.'}
      </h1>
      {line && origins.length === 3 && (
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          Frågorna kom från högskoleprovet {origins[0]}, {origins[1]} och {origins[2]}.
        </p>
      )}
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
        {line ? 'Imorgon väntar en kort diagnos.' : 'Dina val går att ändra när som helst.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
        <Btn onClick={onHome}>Till Hem</Btn>
        <a
          href="/ova"
          style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 4 }}
        >
          Fortsätt öva nu →
        </a>
      </div>
    </section>
  )
}

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        background: 'transparent',
        color: 'var(--ink-2)',
        textDecoration: 'underline',
        cursor: 'pointer',
        padding: '12px 0',
        font: 'inherit',
      }}
    >
      Hoppa över
    </button>
  )
}

// ── Pickers ───────────────────────────────────────────────────────

function PickerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  )
}

type OptionProps = {
  label: string
  sublabel?: string
  active: boolean
  onClick: () => void
  accent?: string
}

function PickerOption({ label, sublabel, active, onClick, accent }: OptionProps) {
  const ring = active ? (accent ?? 'var(--ink)') : 'var(--hairline)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: 'transparent',
        border: `1px solid ${ring}`,
        borderRadius: 0 /* editorial — no rounded corners */,
        padding: '16px 18px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: 'pointer',
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        // 1px border swap is the active affordance; no fill, no
        // shadow. Same convention as the option rows in StyleA.
        transition: 'border-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = 'var(--muted)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = 'var(--hairline)'
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: active ? 600 : 500,
          letterSpacing: '-0.01em',
          color: accent ?? 'var(--ink)',
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 'var(--font-mono-track)',
            color: 'var(--muted)',
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  )
}

// Per-palette accent so the picker SHOWS the palette via its own
// typography (matches EditionStrip's convention).
const PALETTE_ACCENTS: Record<PaletteKey, string> = {
  sand: 'oklch(0.61 0.13 42)',
  sage: 'oklch(0.52 0.13 195)',
  ink: 'oklch(0.36 0.13 265)',
  rose: 'oklch(0.58 0.14 15)',
  spalt: 'oklch(0.49 0.21 265)',
}

function PaletteOption({
  p,
  label,
  sub,
  active,
  onClick,
}: {
  p: PaletteKey
  label: string
  sub: string
  active: boolean
  onClick: () => void
}) {
  return (
    <PickerOption
      label={label}
      sublabel={sub}
      active={active}
      onClick={onClick}
      accent={PALETTE_ACCENTS[p]}
    />
  )
}
