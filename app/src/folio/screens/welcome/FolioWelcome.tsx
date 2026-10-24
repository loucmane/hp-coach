import { useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useActiveSessionOfKind } from '@/api/hooks/useSessions'
import { useStats } from '@/api/hooks/useStats'
import { useUpdateUserPrefs, useUserPrefs } from '@/api/hooks/useUserPrefs'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { SessionPlayer, type SessionPlayerProps } from '@/components/session/SessionPlayer'
import { type LexiconEntry, loadFramework } from '@/data/frameworks'
import { loadBank, type Question } from '@/data/questions'
import { useShellFocus } from '@/folio/useShellFocus'
import { nextSitting, resolveSitting } from '@/lib/dates'
import {
  DAILY_MINUTES,
  FIRST_SESSION_ROOT,
  firstSessionOrigin,
  pickFirstSessionQuestions,
} from '@/lib/firstSession'
import { useFirstContentSignal } from '@/lib/motion'
import type { PaletteKey, ThemeMode } from '@/lib/tokens'
import { WELCOMED_KEY } from '@/lib/welcome'
import { useExamStore } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'
import { RootCard } from './RootCard'
import { WelcomeChoice } from './WelcomeChoice'
import { WelcomeSteps } from './WelcomeSteps'
import {
  WELCOME_STEPS,
  type WelcomeSetupStep,
  welcomeJourney,
  welcomeMinutesLine,
  welcomeSittings,
} from './welcomeView'
import './welcome.css'

const LazyDone = lazy(() => import('./FolioWelcomeDone'))
type DoneSummary = Parameters<NonNullable<SessionPlayerProps['renderDone']>>[0]['summary']

// Hand the result back after commit: renderDone runs inside the player's
// classic frame, while welcome's completed view belongs on the plain page.
function CompleteWelcomeSession({
  summary,
  onDone,
}: {
  summary: DoneSummary
  onDone: (summary: DoneSummary) => void
}) {
  useEffect(() => {
    onDone(summary)
  }, [summary, onDone])
  return null
}

function markWelcomed() {
  try {
    localStorage.setItem(WELCOMED_KEY, '1')
  } catch {
    /* Storage is optional. */
  }
}

export default function FolioWelcome() {
  useFirstContentSignal()
  const navigate = useNavigate()
  const prefs = useUserPrefs()
  const stats = useStats()
  const active = useActiveSessionOfKind('onboarding')
  const update = useUpdateUserPrefs()
  const synced = useSyncedPrefs()
  const mode = useUiStore((s) => s.mode)
  const palette = useUiStore((s) => s.palette)
  const [steps, setSteps] = useState<WelcomeSetupStep[] | null>(null)
  const [step, setStep] = useState<WelcomeSetupStep | 'session' | 'done'>('sitting')
  const [doneSummary, setDoneSummary] = useState<DoneSummary | null>(null)
  const finishSession = useCallback((summary: DoneSummary) => {
    setDoneSummary(summary)
    setStep('done')
  }, [])
  const [completed, setCompleted] = useState<WelcomeSetupStep[]>([])
  const [chosenSitting, chooseSitting] = useState<string | null | undefined>(undefined)
  const [chosenMinutes, chooseMinutes] = useState<number | null>(null)
  const sitting =
    chosenSitting === undefined
      ? (resolveSitting(prefs.data?.targetSittingId)?.id ?? null)
      : chosenSitting
  const minutes = chosenMinutes ?? DAILY_MINUTES.find((n) => n === prefs.data?.dailyMinutes) ?? 20
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const [saveError, setSaveError] = useState(false)
  const retrySave = useRef<(() => Promise<void>) | null>(null)
  const [root, setRoot] = useState<LexiconEntry | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loadRound, setLoadRound] = useState(0)
  const [qid, setQid] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const home = () => {
    markWelcomed()
    void navigate({ to: '/' })
  }
  // Release setup's skip action for the player. The shell's welcome default
  // covers idle and lazy-result gaps without replacing the player's request.
  useShellFocus({
    active: step !== 'session' && step !== 'done',
    onExit: home,
    exitLabel: 'Hoppa över välkomsten',
  })

  useEffect(() => {
    if (steps !== null || !prefs.data || !stats.data || active.isPending || active.isError) return
    const journey = welcomeJourney(stats.data.attempts.total, !!active.data)
    setSteps(journey)
    setStep(journey[0] ?? 'done')
  }, [steps, prefs.data, stats.data, active.data, active.isPending, active.isError])
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus each newly rendered step, including after initial data loading
  useEffect(() => {
    heading.current?.focus()
  }, [step, steps])
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadRound is the explicit retry trigger
  useEffect(() => {
    if (step !== 'pattern') return
    let alive = true
    setLoadError(false)
    Promise.all([loadFramework('ORD'), loadBank()])
      .then(([framework, bank]) => {
        if (!alive) return
        const entry =
          framework?.family === 'ord_roots'
            ? framework.entries.find((item) => item.id === FIRST_SESSION_ROOT)
            : null
        const picked = pickFirstSessionQuestions(bank)
        if (!entry || picked.length !== 3) {
          setLoadError(true)
          return
        }
        setRoot(entry)
        setQuestions(picked)
      })
      .catch(() => {
        if (alive) setLoadError(true)
      })
    return () => {
      alive = false
    }
  }, [step, loadRound])

  const save = async (action: () => Promise<void>) => {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setSaveError(false)
    retrySave.current = action
    try {
      await action()
      retrySave.current = null
    } catch {
      setSaveError(true)
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  const selectSitting = (value: string) =>
    void save(async () => {
      if (value) await synced.setSitting(value)
      else {
        // The synced setter only accepts known IDs. Clear local state after
        // the nullable API write so hydration cannot backfill the old target.
        await update.mutateAsync({ targetSittingId: null })
        useExamStore.setState({ sittingId: null })
      }
      chooseSitting(value || null)
    })
  const selectMinutes = (value: string) =>
    void save(async () => {
      const next = Number(value)
      await update.mutateAsync({ dailyMinutes: next })
      chooseMinutes(next)
    })
  const goStep = (next: WelcomeSetupStep) => {
    if (busy.current || !steps?.includes(next)) return
    setSaveError(false)
    retrySave.current = null
    setStep(next)
  }
  const forward = () => {
    if (busy.current || !steps || step === 'session' || step === 'done') return
    const advance = () => {
      setSaveError(false)
      retrySave.current = null
      setCompleted((items) => (items.includes(step) ? items : [...items, step]))
      setStep(step === 'pattern' ? 'session' : steps[steps.indexOf(step) + 1])
    }
    // Selections save immediately; an untouched default needs the same write
    // on continue. Remember it locally so revisiting Prov cannot save twice.
    if (
      step === 'sitting' &&
      chosenSitting === undefined &&
      sitting &&
      sitting !== prefs.data?.targetSittingId
    ) {
      void save(async () => {
        await synced.setSitting(sitting)
        chooseSitting(sitting)
        advance()
      })
    } else advance()
  }

  if (step === 'session')
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
        idleSecondaryCta={
          <button type="button" className="fa-exit" onClick={home}>
            Hoppa över välkomsten
          </button>
        }
        renderDone={({ summary }) => (
          <CompleteWelcomeSession summary={summary} onDone={finishSession} />
        )}
      />
    )
  if (step === 'done')
    return (
      <Suspense fallback={null}>
        <LazyDone questions={doneSummary?.questions} picks={doneSummary?.picks} />
      </Suspense>
    )
  if (!steps)
    return (
      <section className="fa-welcome" lang="sv">
        <div className="fa-welcome-body">
          <h1 ref={heading} tabIndex={-1}>
            Välkommen
          </h1>
          {prefs.isError || stats.isError || active.isError ? (
            <>
              <p role="alert">Dina val kunde inte hämtas.</p>
              <button
                className="fa-welcome-link"
                type="button"
                onClick={() => {
                  void prefs.refetch()
                  void stats.refetch()
                  void active.refetch()
                }}
              >
                Försök igen
              </button>
            </>
          ) : (
            <p role="status">Hämtar dina val…</p>
          )}
        </div>
      </section>
    )

  const copy = WELCOME_STEPS[step]
  return (
    <section className="fa-welcome" lang="sv">
      <WelcomeSteps
        steps={steps}
        current={step}
        completed={completed}
        disabled={saving}
        onStep={goStep}
      />
      <div className="fa-welcome-body">
        <header>
          <p className="fa-welcome-eyebrow">
            {step === 'pattern' ? 'Första passet · cirka 2 minuter' : 'Din start'}
          </p>
          <h1 ref={heading} tabIndex={-1}>
            {copy.title}
          </h1>
          <p className="fa-welcome-intro">{copy.intro}</p>
        </header>
        {step === 'sitting' && (
          <>
            {!nextSitting() && (
              <p className="fa-welcome-note">
                Nästa provdatum är inte publicerat här än. Du kan välja det senare.
              </p>
            )}
            <WelcomeChoice
              label="Prov"
              options={welcomeSittings(sitting)}
              value={sitting ?? ''}
              onChange={selectSitting}
              disabled={saving}
              stacked
            />
          </>
        )}
        {step === 'minutes' && (
          <>
            <WelcomeChoice
              label="Minuter per dag"
              options={DAILY_MINUTES.map((n) => ({ value: String(n), label: `${n} minuter` }))}
              value={String(minutes)}
              onChange={selectMinutes}
              disabled={saving}
            />
            <p className="fa-welcome-note">{welcomeMinutesLine(minutes, sitting)}</p>
          </>
        )}
        {step === 'theme' && (
          <>
            <WelcomeChoice
              label="Tema"
              options={[
                { value: 'light', label: 'Ljust' },
                { value: 'dark', label: 'Mörkt' },
              ]}
              value={mode}
              disabled={saving}
              onChange={(value) => void save(() => synced.setMode(value as ThemeMode))}
            />
            <WelcomeChoice
              label="Färg"
              options={[
                { value: 'spalt', label: 'Spalt' },
                { value: 'sand', label: 'Sand' },
                { value: 'sage', label: 'Salvia' },
                { value: 'ink', label: 'Bläck' },
                { value: 'rose', label: 'Ros' },
              ]}
              value={palette}
              disabled={saving}
              onChange={(value) => void save(() => synced.setPalette(value as PaletteKey))}
            />
          </>
        )}
        {step === 'pattern' && root && <RootCard root={root} />}
        {step === 'pattern' && !root && !loadError && <p role="status">Hämtar ordmönstret…</p>}
        {loadError && step === 'pattern' && (
          <div>
            <p role="alert">Första passet kunde inte laddas.</p>
            <button
              type="button"
              className="fa-welcome-link"
              onClick={() => setLoadRound((n) => n + 1)}
            >
              Försök igen
            </button>
          </div>
        )}
        {saveError && (
          <div>
            <p role="alert">Det gick inte att spara ditt val. Försök igen.</p>
            <button
              type="button"
              className="fa-welcome-link"
              onClick={() => {
                if (retrySave.current) void save(retrySave.current)
              }}
            >
              Försök igen
            </button>
          </div>
        )}
        <div className="fa-welcome-actions">
          <button
            type="button"
            className="fa-welcome-primary"
            disabled={
              saving || (step === 'pattern' && (!root || questions.length !== 3 || loadError))
            }
            onClick={forward}
          >
            {saving ? 'Sparar…' : step === 'pattern' ? 'Prova tre frågor' : 'Fortsätt'}
          </button>
          {step === 'theme' && (
            <button type="button" className="fa-welcome-link" disabled={saving} onClick={forward}>
              Behåll så här
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
