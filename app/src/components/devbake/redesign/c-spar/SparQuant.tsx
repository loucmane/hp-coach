// Spår · Kvantfråga (6) and DTK (7) — a short problem in focus mode.
//
// The problem sits on its own card, the reading card's sibling: a band in
// the section's tint (the sitting at its right, which marks the question
// as authentic), an optional figure, then the stem with its math rendered.
// KVA's two quantities stand side by side in sunk tiles with Roman-numeral
// stops; NOG's statements are two stops on a little path, and every NOG
// option carries a glyph of the statements it uses. The tray follows a
// short problem: open from the start, sticky under the card, docking to
// the bottom edge only when the problem is taller than the room.
//
// DTK is the one wide column: the printed page on a white mat (never
// inverted or tinted, its colours are what the explanations name), fit to
// its width or to the whole page, rotatable, with a full-screen viewer
// that keeps the question at hand. Questions on the same page follow one
// another without the page moving.
//
// Answering raises Facit as on Läsfråga (DTK's at 40 %, so the page stays
// in view above it). On phone the options follow the problem in the flow
// with a sticky answer bar (a DTK page uses the edge sheet instead), and
// Facit rises as the edge sheet at half height.

import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  type DrillCoreRefs,
  type DrillCoreView,
  useDrillCore,
} from '@/components/devbake/redesign/drillCore'
import {
  type DirectionProps,
  useHideOnScroll,
  useKeyMap,
} from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  DrillFigure,
  DrillOption,
  DrillQuestion,
  DrillRequest,
  DrillSessionView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { flattenMathText, MathText } from '@/components/MathText'
import type { AnswerLetter } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import {
  type Calm,
  CORNER,
  Done,
  type DrillAct,
  FeedbackBody,
  FeedbackSheet,
  NoQuestions,
  Options,
  type OptionsLayout,
  ParaText,
  Progress,
  type RoundKind,
  roundEnd,
  SHEET_PCT,
  showsClock,
  Timer,
  TopBar,
  Verdict,
} from './SparDrill'
import {
  CalmSwitch,
  cap,
  Kbd,
  SparSegmented,
  SparStop,
  sectionMinutes,
  sectionName,
} from './sparParts'

type ImgState = 'loading' | 'ok' | 'failed'
type Fit = 'width' | 'page'
type PageView = { fit: Fit; rot: number }

const DEFAULT_PAGE: PageView = { fit: 'width', rot: 0 }
const NOG_TAIL = 'Tillräcklig information för lösningen erhålls'

/** KVA's four fixed options and the relation each one states. */
const KVA_REL: Record<string, string> = {
  'I är större än II': 'I > II',
  'II är större än I': 'II > I',
  'I är lika med II': 'I = II',
  'informationen är otillräcklig': '?',
}

/** NOG's five fixed options and the statements each one uses. */
type NogUse = 'one' | 'two' | 'together' | 'each' | 'neither'
const NOG_USE: Record<string, NogUse> = {
  'i (1) men ej i (2)': 'one',
  'i (2) men ej i (1)': 'two',
  'i (1) tillsammans med (2)': 'together',
  'i (1) och (2) var för sig': 'each',
  'ej genom de båda påståendena': 'neither',
}

/** A NOG option as plain words: a statement reference stored as math
 *  ("(₁ )") reads "(1)" again. */
function nogWords(text: string): string {
  return flattenMathText(text)
    .replace(/\(\s*([12])\s*\)?/g, '($1)')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Whether a question is read off a printed DTK page. */
function onPage(q: DrillQuestion): boolean {
  return q.section === 'DTK'
}

/** How an item's options are laid out (spec §3, screen 6). */
function optionKind(q: DrillQuestion): 'kva' | 'nog' | 'images' | 'short' | 'long' {
  const options = q.options ?? []
  if (options.some((o) => o.figure)) return 'images'
  if (q.section === 'KVA' && options.every((o) => KVA_REL[o.text])) return 'kva'
  if (q.section === 'NOG' && options.every((o) => NOG_USE[nogWords(o.text)])) return 'nog'
  return options.every((o) => flattenMathText(o.text).length <= 14) ? 'short' : 'long'
}

/** What a sitting with no questions says, and the one step that still
 *  works (spec §3 screen 6, "No questions to play"). */
function emptyCopy(
  request: DrillRequest,
  dtk: boolean,
  actions: DirectionActions,
): { text: string; action: { label: string; onClick: () => void } } {
  const toOva = { label: 'Till Öva', onClick: () => actions.go('ova') }
  switch (request.kind) {
    case 'framework':
      return {
        text: 'Inga exempelfrågor hittades för det här mönstret.',
        action: {
          label: 'Tillbaka till mönstret',
          onClick: () => actions.openLesson(request.frameworkId),
        },
      }
    case 'weak':
      return {
        text: `Inga svaga mönster i ${request.section} än — öva sektionen så hittar vi dem.`,
        action: {
          label: `Öva hela ${request.section} · ca ${sectionMinutes(request.section)} min`,
          onClick: () => actions.startDrill({ kind: 'section', section: request.section }),
        },
      }
    case 'section':
      return { text: `Inga ${request.section}-frågor klara att öva på just nu.`, action: toOva }
    default:
      return {
        text: dtk
          ? 'Inga DTK-frågor klara att öva på just nu.'
          : 'Inga frågor klara att öva på just nu.',
        action: toOva,
      }
  }
}

/** A figure's load state, reset when its source changes; a retry
 *  remounts the image (its key). */
function useImage(src: string | undefined) {
  const [rec, setRec] = useState<{ src?: string; state: ImgState; nonce: number }>({
    src,
    state: 'loading',
    nonce: 0,
  })
  const current = rec.src === src
  const state: ImgState = current ? rec.state : 'loading'
  const nonce = current ? rec.nonce : 0
  const set = useCallback(
    (next: ImgState, bump = false) =>
      setRec((r) => ({
        src,
        state: next,
        nonce: (r.src === src ? r.nonce : 0) + (bump ? 1 : 0),
      })),
    [src],
  )
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      // A cached image may be complete before its load event is heard.
      if (img?.complete && img.naturalWidth > 0) set('ok')
    },
    [set],
  )
  return {
    state,
    nonce,
    img: { ref, onLoad: () => set('ok'), onError: () => set('failed') },
    retry: () => set('loading', true),
  }
}

/** A box's inner size, kept current (0 × 0 without layout). `remount`
 *  re-attaches when the element itself is replaced. */
function useBox(ref: RefObject<HTMLElement | null>, remount?: unknown): { w: number; h: number } {
  const [box, setBox] = useState({ w: 0, h: 0 })
  // biome-ignore lint/correctness/useExhaustiveDependencies: `remount` marks a new element
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () =>
      setBox((b) =>
        b.w === el.clientWidth && b.h === el.clientHeight
          ? b
          : { w: el.clientWidth, h: el.clientHeight },
      )
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, remount])
  return box
}

// ── The screen ───────────────────────────────────────────────────────

export function SparQuant(props: DirectionProps & Calm) {
  const { data, actions } = useDirectionData()
  const dtk = props.screen === 7
  const session = dtk ? data.drills.dtk : data.drills.quant
  if (session.questions.length === 0) {
    const empty = emptyCopy(session.request, dtk, actions)
    return (
      <NoQuestions
        width={props.width}
        text={empty.text}
        onExit={() => actions.drill.exit?.()}
        action={empty.action}
      />
    )
  }
  return <QuantSession key={session.id} {...props} session={session} />
}

function QuantSession({
  width,
  live,
  calm,
  setCalm,
  session,
}: DirectionProps & Calm & { session: DrillSessionView }) {
  const { data, actions } = useDirectionData()
  const core = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const { view, refs } = core
  const c = core.act
  const q = view.question
  const phone = width === 'phone'
  const repetition = session.request.kind === 'repetition'
  const multi = new Set(session.questions.map((x) => x.section)).size > 1
  const dtk = onPage(q)

  // DTK pages: each distinct page in order, and where this question sits.
  const pageKeys = useMemo(() => {
    const keys: string[] = []
    for (const x of session.questions) {
      if (!onPage(x)) continue
      const key = x.figure?.src ?? x.qid
      if (!keys.includes(key)) keys.push(key)
    }
    return keys
  }, [session.questions])
  const pageKey = dtk ? (q.figure?.src ?? q.qid) : null
  const pageNo = pageKey ? pageKeys.indexOf(pageKey) + 1 : 0
  const samePage = pageKey
    ? session.questions.filter((x) => onPage(x) && (x.figure?.src ?? x.qid) === pageKey)
    : []
  const posOnPage = samePage.findIndex((x) => x.qid === q.qid) + 1
  const pages = useMemo(
    () =>
      session.questions.every(onPage)
        ? session.questions.map((x) => pageKeys.indexOf(x.figure?.src ?? x.qid))
        : undefined,
    [session.questions, pageKeys],
  )

  // The page's fit and rotation are kept per page: the next question on
  // the same page finds it exactly as it was.
  const [pageViews, setPageViews] = useState<Record<string, PageView>>({})
  const pageView = (pageKey && pageViews[pageKey]) || DEFAULT_PAGE
  const setPageView = (patch: Partial<PageView>) => {
    if (!pageKey) return
    setPageViews((all) => ({ ...all, [pageKey]: { ...(all[pageKey] ?? DEFAULT_PAGE), ...patch } }))
  }
  const rotate = () => setPageView({ rot: (pageView.rot + 90) % 360 })

  const image = useImage(q.figure?.src)
  // A DTK question is read off its page: it takes an answer only once the
  // page is on screen, never while it is missing, failed or still loading.
  // A missing or failed page says why under the options; a loading one has
  // the mat's "Hämtar sidan…".
  const noPage = dtk && (!q.figure || image.state === 'failed')
  const blocked = dtk && (!q.figure || image.state !== 'ok')

  const [tray, setTray] = useState<'open' | 'folded'>('open')
  const [fsheet, setFsheet] = useState<'tall' | 'half'>(dtk ? 'half' : 'tall')
  const [psheet, setPsheet] = useState<'peek' | 'open' | 'full'>(dtk ? 'peek' : 'open')
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seat on a new question or verdict only
  useEffect(() => {
    setTray('open')
    setFsheet(dtk ? 'half' : 'tall')
    setPsheet(view.phase === 'feedback' || !dtk ? 'open' : 'peek')
  }, [view.index, view.phase])

  const [viewer, setViewer] = useState<DrillFigure | null>(null)
  const openViewer = () => {
    if (q.figure && image.state !== 'failed') setViewer(q.figure)
  }

  // The column turns to the top for a new problem or a new page; a new
  // question on the same page keeps it still. A new page is announced.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [announce, setAnnounce] = useState('')
  const seen = useRef(pageKey ?? q.qid)
  useEffect(() => {
    const key = pageKey ?? q.qid
    if (seen.current === key) return
    if (pageKey && pageKeys.length > 1) setAnnounce(`Ny sida, sida ${pageNo} av ${pageKeys.length}`)
    seen.current = key
    scrollRef.current?.scrollTo?.({ top: 0 })
  }, [pageKey, q.qid, pageNo, pageKeys.length])

  const coreSelect = c.select
  const act: DrillAct = {
    select: (letter: AnswerLetter) => {
      if (blocked) return
      coreSelect(letter)
      setTray('open')
      if (phone && dtk) setPsheet('open')
    },
    lock: () => {
      if (!blocked) c.lock()
    },
    next: () => {
      c.next()
    },
    exit: c.exit,
    toggleEliminate: c.toggleEliminate,
    setFocusPara: c.setFocusPara,
    moveFocusPara: c.moveFocusPara,
    cite: c.cite,
    toggleStep: c.toggleStep,
    goToStep: c.goToStep,
  }

  const framework = session.request.kind === 'framework' ? session.request : null
  const back = framework
    ? { label: 'Tillbaka till mönstret', onClick: () => actions.openLesson(framework.frameworkId) }
    : { label: 'Tillbaka till Öva', onClick: () => actions.go('ova') }
  // Enter at the end takes the step the end's green pill shows.
  const kind: RoundKind = repetition ? 'repetition' : 'drill'
  const { next: nextStep } = roundEnd(data.home.plan.items, kind)
  const onward = () => (nextStep ? actions.openPlanItem(nextStep.id) : back.onClick())
  const advance = () => {
    if (view.phase === 'question') act.lock()
    else if (view.phase === 'feedback') act.next()
    else onward()
  }
  const keys: Record<string, () => void> = { Enter: advance }
  if (view.phase === 'feedback' || (view.phase === 'question' && view.selected)) {
    keys[' '] = advance
  }
  if (!phone) {
    keys.t = () =>
      view.phase === 'feedback'
        ? setFsheet((s) => (s === 'tall' ? 'half' : 'tall'))
        : setTray((s) => (s === 'open' ? 'folded' : 'open'))
  }
  if (q.figure && view.phase !== 'done') keys.z = openViewer
  if (dtk && q.figure && view.phase !== 'done') keys.r = rotate
  for (const l of view.letters) {
    const key = l.toLowerCase()
    keys[key] = () => act.select(l)
    keys[`Shift+${key}`] = () => c.toggleEliminate(l)
  }
  useKeyMap(keys, live && viewer == null)

  const clock = showsClock(session)
  const chips = (
    <>
      {repetition ? (
        <span className="sp-sec-chip sp-sec-chip--rep" data-sec="REP" title="Repetition">
          <RotateCcw size={13} strokeWidth={2.75} aria-hidden />
          REP
        </span>
      ) : null}
      <span className="sp-sec-chip" data-sec={q.section} title={sectionName(q.section)}>
        {q.section}
      </span>
    </>
  )
  const done = (
    <Done
      view={view}
      questions={session.questions}
      kind={kind}
      title={session.title}
      back={back}
      pages={pages}
    />
  )
  const shared: SessionProps = {
    view,
    act,
    session,
    image,
    blocked,
    noPage,
    pageNo,
    pageCount: pageKeys.length,
    posOnPage,
    onPageCount: samePage.length,
    pageView,
    setPageView,
    rotate,
    openViewer,
    scrollRef,
    repetition,
  }
  const viewerEl =
    viewer && live ? (
      <FigureViewer
        figure={viewer}
        page={dtk}
        rot={dtk ? pageView.rot : 0}
        onRotate={dtk ? rotate : undefined}
        onClose={() => setViewer(null)}
        view={view}
        act={act}
        blocked={blocked}
      />
    ) : null
  const announcer = (
    <span className="sp-sr" aria-live="polite">
      {announce}
    </span>
  )

  if (phone) {
    return (
      <>
        <PhoneQuant
          {...shared}
          refs={refs}
          chips={chips}
          clock={clock}
          psheet={psheet}
          setPsheet={setPsheet}
          multi={multi}
          done={done}
        />
        {announcer}
        {viewerEl}
      </>
    )
  }
  return (
    <div className="sp-drill" data-mode={dtk ? 'page' : 'problem'}>
      <TopBar
        onExit={act.exit}
        mid={
          <>
            {chips}
            <Progress
              view={view}
              questions={session.questions}
              label="Frågorna i övningen"
              ring={multi}
              pages={pages}
            />
            <span className="sp-top-count">
              Fråga {Math.min(view.index + 1, view.total)} av {view.total}
            </span>
          </>
        }
        right={
          <>
            <CalmSwitch calm={calm} setCalm={setCalm} compact testid="sp-calm-drill" />
            {clock ? <Timer seconds={view.elapsed} /> : null}
          </>
        }
      />
      {view.phase === 'done' ? (
        <div className="sp-body sp-body--done">{done}</div>
      ) : (
        <DeskQuant
          {...shared}
          refs={refs}
          tray={tray}
          setTray={setTray}
          fsheet={fsheet}
          setFsheet={setFsheet}
        />
      )}
      {announcer}
      {viewerEl}
    </div>
  )
}

type SessionProps = {
  view: DrillCoreView
  act: DrillAct
  session: DrillSessionView
  image: ReturnType<typeof useImage>
  /** A DTK question whose page is not on screen (missing, failed or still
   *  loading): not answerable. */
  blocked: boolean
  /** Its page is missing or failed: the options say why. */
  noPage: boolean
  pageNo: number
  pageCount: number
  posOnPage: number
  onPageCount: number
  pageView: PageView
  setPageView: (patch: Partial<PageView>) => void
  rotate: () => void
  openViewer: () => void
  scrollRef: RefObject<HTMLDivElement | null>
  repetition: boolean
}

// ── Desktop ──────────────────────────────────────────────────────────

function DeskQuant({
  view,
  act,
  refs,
  image,
  blocked,
  noPage,
  pageNo,
  pageCount,
  posOnPage,
  onPageCount,
  pageView,
  setPageView,
  rotate,
  openViewer,
  scrollRef,
  repetition,
  tray,
  setTray,
  fsheet,
  setFsheet,
}: SessionProps & {
  refs: DrillCoreRefs
  tray: 'open' | 'folded'
  setTray: (s: 'open' | 'folded') => void
  fsheet: 'tall' | 'half'
  setFsheet: (s: 'tall' | 'half') => void
}) {
  const q = view.question
  const dtk = onPage(q)
  const last = view.index + 1 >= view.total
  const box = useBox(scrollRef)
  // The dock under the problem: stuck to the bottom edge only when the
  // problem is taller than the room (then the problem fades under it).
  const dockRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const dock = useBox(dockRef, `${view.index}-${view.phase}`)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = endRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      root: scrollRef.current,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [scrollRef])
  const bottom = view.phase === 'feedback' ? `calc(${SHEET_PCT[fsheet]}% - ${CORNER}px)` : '0px'
  const showTask = () => {
    setFsheet('half')
    scrollRef.current?.scrollTo?.({ top: 0 })
  }
  // A ¶ chip drops the sheet to below half and centres its paragraph above,
  // as on Läsfråga.
  const cite = (n: number, source?: string) => {
    setFsheet('half')
    act.cite(n, source)
  }
  return (
    <div className="sp-body" data-phase={view.phase}>
      <div className="sp-scroll sp-qscroll" ref={scrollRef} style={{ bottom }}>
        <div className="sp-qcol" data-wide={String(dtk)}>
          {dtk ? (
            <PageCard
              q={q}
              image={image}
              pageNo={pageNo}
              pageCount={pageCount}
              pageView={pageView}
              setPageView={setPageView}
              rotate={rotate}
              openViewer={openViewer}
              avail={{ w: box.w, h: box.h - dock.h }}
            />
          ) : (
            <ProblemCard view={view} refs={refs} image={image} openViewer={openViewer} />
          )}
          {view.phase === 'question' ? (
            <div className="sp-qdock" ref={dockRef} data-stuck={String(stuck)}>
              <section
                className="sp-qtray"
                data-state={tray}
                aria-label={`Fråga ${view.index + 1}`}
              >
                {dtk ? (
                  <div className="sp-qtray-head">
                    {onPageCount > 1 ? (
                      <p className="sp-qtray-pos">
                        Fråga {posOnPage} av {onPageCount} på den här sidan
                      </p>
                    ) : null}
                    <h2 className="sp-prompt" data-testid="rd-quant-prompt">
                      <MathText>{q.prompt}</MathText>
                    </h2>
                  </div>
                ) : null}
                {tray === 'open' ? null : (
                  <button
                    type="button"
                    className="sp-show"
                    aria-expanded={false}
                    aria-controls="sp-qtray-body"
                    onClick={() => setTray('open')}
                  >
                    Visa alternativen ({view.letters.length})
                    <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
                    <Kbd>T</Kbd>
                  </button>
                )}
                <div className="sp-tray-body" id="sp-qtray-body" hidden={tray !== 'open'}>
                  {noPage ? <p className="sp-qtray-why">Frågan behöver sidan.</p> : null}
                  <QuantOptions view={view} act={act} phone={false} blocked={blocked} />
                  <TacticHint view={view} />
                  <div className="sp-tray-foot">
                    <button
                      type="button"
                      className="sp-icon-btn sp-icon-btn--soft"
                      aria-expanded
                      aria-controls="sp-qtray-body"
                      aria-label="Dölj alternativen"
                      title="Dölj alternativen (T)"
                      onClick={() => setTray('folded')}
                    >
                      <ChevronDown size={22} strokeWidth={2.25} aria-hidden />
                    </button>
                    <p className="sp-keys">
                      <span>
                        <Kbd>⇧</Kbd> + bokstav stryker
                      </span>
                      <span>
                        <Kbd>T</Kbd> döljer
                      </span>
                      {q.figure ? (
                        <span>
                          <Kbd>Z</Kbd> förstorar
                        </span>
                      ) : null}
                    </p>
                    <span className="sp-echo" aria-live="polite">
                      {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
                    </span>
                    <button
                      type="button"
                      className="sp-btn sp-btn--primary"
                      data-testid="rd-lock"
                      disabled={!view.selected || blocked}
                      onClick={act.lock}
                    >
                      Svara
                      <Kbd>↵</Kbd>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div aria-hidden style={{ height: CORNER + 32 }} />
          )}
          <div ref={endRef} className="sp-qend" aria-hidden />
        </div>
      </div>
      {view.phase === 'feedback' ? (
        <FeedbackSheet
          view={view}
          act={act}
          state={fsheet}
          setState={setFsheet}
          nextLabel={last ? 'Klart med övningen' : 'Nästa fråga'}
          repetition={repetition}
          above={dtk ? 'sidan' : 'uppgiften'}
          aside={
            dtk ? (
              q.figure ? (
                <button type="button" className="sp-chip-btn" onClick={openViewer}>
                  <Maximize2 size={15} strokeWidth={2.25} aria-hidden />
                  Förstora sidan
                </button>
              ) : null
            ) : (
              <button type="button" className="sp-chip-btn" onClick={showTask}>
                <ArrowUp size={15} strokeWidth={2.25} aria-hidden />
                Visa uppgiften
              </button>
            )
          }
        >
          <FeedbackBody
            view={view}
            act={{ ...act, cite }}
            refs={refs}
            prompt={<PromptLine q={q} />}
            optionText={optionText(q)}
            repetition={repetition}
          />
        </FeedbackSheet>
      ) : null}
    </div>
  )
}

// ── The problem ──────────────────────────────────────────────────────

/** The problem card: a band in the section's tint (the sitting at its
 *  right), the figure, then the stem — KVA's pair, NOG's statements, an
 *  ORD headword, a MEK sentence with its gaps, or plain math. */
function ProblemCard({
  view,
  refs,
  image,
  openViewer,
}: {
  view: DrillCoreView
  refs: DrillCoreRefs
  image: ReturnType<typeof useImage>
  openViewer: () => void
}) {
  const { data } = useDirectionData()
  const q = view.question
  return (
    <article className="sp-pcard" data-sec={q.section} aria-labelledby="sp-pcard-h">
      <header className="sp-pcard-band">
        <h1 className="sp-pcard-name" id="sp-pcard-h">
          {sectionName(q.section)}
        </h1>
        {q.source.authentic ? (
          <span className="sp-pcard-src">{q.source.label}</span>
        ) : q.passage?.synthetic ? (
          <span className="sp-badge-chip sp-badge-chip--sm">{data.copy.ovningstextBadge}</span>
        ) : null}
      </header>
      <div className="sp-pcard-body">
        {q.figure ? <SparFigure figure={q.figure} image={image} openViewer={openViewer} /> : null}
        <ProblemPassage view={view} refs={refs} />
        <Stem q={q} />
      </div>
    </article>
  )
}

/** A passage that comes with the question (a LÄS or ELF miss in a round
 *  across sections). Its paragraphs are known to the drill core, as on
 *  Läsfråga, so a ¶ link in Facit turns the column to its paragraph and
 *  marks it for a moment, with the quotations of the part it came from. */
function ProblemPassage({ view, refs }: { view: DrillCoreView; refs: DrillCoreRefs }) {
  const passage = view.question.passage
  if (!passage) return null
  const graded = view.phase === 'feedback'
  const marks = view.flashSource ? view.marks.filter((m) => m.source === view.flashSource) : []
  return (
    <div className="sp-qpassage" lang={passage.lang === 'en' ? 'en' : undefined}>
      {passage.paragraphs.map((p, i) => {
        const n = i + 1
        return (
          <p
            key={n}
            ref={refs.para(n)}
            className="sp-qpara"
            data-n={n}
            data-cited={String(graded && view.cited.includes(n))}
            data-flash={String(view.flashPara === n)}
          >
            <span className="sp-qpnum" aria-hidden>
              {n}
            </span>
            <ParaText text={p} marks={marks.filter((m) => m.para === n)} />
          </p>
        )
      })}
    </div>
  )
}

function Stem({ q }: { q: DrillQuestion }) {
  if (q.prompt == null || q.options == null) {
    return (
      <div className="sp-stem" data-testid="rd-quant-prompt">
        <p className="sp-stem-missing">Frågan saknar fullständig text.</p>
      </div>
    )
  }
  if (q.section === 'KVA') {
    const split = splitKvaPrompt(q.prompt)
    if (split) {
      return (
        <div className="sp-stem" data-testid="rd-quant-prompt">
          {split.condition ? (
            <p className="sp-kva-cond">
              <MathText>{split.condition}</MathText>
            </p>
          ) : null}
          <fieldset className="sp-kva">
            <legend className="sp-sr">Jämförelsen</legend>
            <KvaQuantity n="I" body={split.kvI} />
            <KvaQuantity n="II" body={split.kvII} />
          </fieldset>
        </div>
      )
    }
  }
  if (q.section === 'NOG') {
    const parts = parseNogPrompt(q.prompt)
    if (parts) {
      return (
        <div className="sp-stem" data-testid="rd-quant-prompt">
          <p className="sp-stem-text">
            <MathText>{parts.question}</MathText>
          </p>
          <ol className="sp-nog" aria-label="Påståenden">
            <NogStatement n={1} text={parts.statement1} />
            <NogStatement n={2} text={parts.statement2} />
          </ol>
        </div>
      )
    }
  }
  if (q.section === 'ORD') {
    return (
      <div className="sp-stem" data-testid="rd-quant-prompt">
        <p className="sp-stem-word">{q.prompt}</p>
      </div>
    )
  }
  return (
    <div className="sp-stem" data-testid="rd-quant-prompt">
      <p className="sp-stem-text">
        <Gapped text={q.prompt} />
      </p>
    </div>
  )
}

/** One of NOG's statements: a stop ringed in the NOG hue on the path. */
function NogStatement({ n, text }: { n: 1 | 2; text: string }) {
  return (
    <li className="sp-nog-item">
      <SparStop state="todo" size={32} sec="NOG" label={n} />
      <span className="sp-nog-text">
        <span className="sp-sr">Påstående {n}:</span> <MathText>{text}</MathText>
      </span>
    </li>
  )
}

/** One of KVA's quantities: a sunk tile with its numeral stop. */
function KvaQuantity({ n, body }: { n: 'I' | 'II'; body: string }) {
  return (
    <section className="sp-kva-q" aria-label={`Kvantitet ${n}`}>
      <span className="sp-kva-head">
        <SparStop state="todo" size={32} sec="KVA" glyph={n} />
        <span className="sp-kva-label" aria-hidden>
          Kvantitet {n}
        </span>
      </span>
      <span className="sp-kva-val">
        <MathText>{body}</MathText>
      </span>
    </section>
  )
}

/** A stem with MEK's "_____" gaps drawn as empty slots. */
function Gapped({ text }: { text: string }) {
  const parts = text.split(/_{3,}/)
  if (parts.length === 1) return <MathText>{text}</MathText>
  return (
    <>
      {parts.map((part, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the pieces of one fixed sentence
        <span key={i}>
          <MathText>{part}</MathText>
          {i < parts.length - 1 ? (
            <span className="sp-gap">
              <span className="sp-sr">lucka {i + 1}</span>
            </span>
          ) : null}
        </span>
      ))}
    </>
  )
}

/** The question as Facit repeats it: KVA's quantities in a line, NOG's
 *  question without its statements. */
function PromptLine({ q }: { q: DrillQuestion }) {
  if (!q.prompt) return null
  if (q.section === 'KVA') {
    const split = splitKvaPrompt(q.prompt)
    if (split) {
      return (
        <>
          {split.condition ? (
            <>
              <MathText>{split.condition}</MathText> ·{' '}
            </>
          ) : null}
          Kvantitet I: <MathText>{split.kvI}</MathText> · Kvantitet II:{' '}
          <MathText>{split.kvII}</MathText>
        </>
      )
    }
  }
  if (q.section === 'NOG') {
    const parts = parseNogPrompt(q.prompt)
    if (parts) return <MathText>{parts.question}</MathText>
  }
  return <MathText>{q.prompt}</MathText>
}

/** An option's words on the answer cards: KVA's relation with its words,
 *  NOG's statements as plain "(1)". */
function optionText(q: DrillQuestion): ((letter: string) => ReactNode) | undefined {
  const kind = optionKind(q)
  const text = (l: string) => q.options?.find((o) => o.letter === l)?.text ?? ''
  if (kind === 'kva') return (l) => `${KVA_REL[text(l)]} · ${text(l)}`
  if (kind === 'nog') return (l) => nogWords(text(l))
  return undefined
}

// ── Options ──────────────────────────────────────────────────────────

function QuantOptions({
  view,
  act,
  phone,
  blocked,
}: {
  view: DrillCoreView
  act: DrillAct
  phone: boolean
  blocked: boolean
}) {
  const q = view.question
  const kind = optionKind(q)
  const layout: OptionsLayout =
    kind === 'images'
      ? 'images'
      : kind === 'kva'
        ? phone
          ? 'column'
          : 'grid'
        : kind === 'short' && !phone
          ? 'row'
          : 'column'
  const content =
    kind === 'kva'
      ? (o: DrillOption) => (
          <span className="sp-relrow">
            <span className="sp-rel" aria-hidden>
              {KVA_REL[o.text]}
            </span>
            <span>{o.text}</span>
          </span>
        )
      : kind === 'nog'
        ? (o: DrillOption) => {
            const words = nogWords(o.text)
            return (
              <span className="sp-relrow sp-relrow--nog">
                <NogGlyph use={NOG_USE[words]} />
                <span>{words}</span>
              </span>
            )
          }
        : kind === 'images'
          ? (o: DrillOption) => <ImageOption o={o} />
          : undefined
  const parts = q.section === 'NOG' && q.prompt ? parseNogPrompt(q.prompt) : null
  return (
    <>
      {kind === 'nog' ? <p className="sp-nog-cap">{parts?.tail ?? NOG_TAIL}</p> : null}
      <Options
        view={view}
        act={act}
        testid="rd-quant-option"
        layout={layout}
        content={content}
        disabled={blocked}
      />
    </>
  )
}

/** Which of NOG's statements an option uses: two dots, filled when used,
 *  joined by a bar when used together, a dotted divider when each is
 *  enough on its own. A reading aid only; the words stay. */
function NogGlyph({ use }: { use: NogUse }) {
  const first = use === 'one' || use === 'together' || use === 'each'
  const second = use === 'two' || use === 'together' || use === 'each'
  return (
    <span className="sp-nogg" data-use={use} aria-hidden>
      <i data-on={String(first)} />
      <b />
      <i data-on={String(second)} />
    </span>
  )
}

/** A chart as an option (the eleven DTK pie-chart questions): the image
 *  is decoration inside a named button, so the label is read once. */
function ImageOption({ o }: { o: DrillOption }) {
  const [failed, setFailed] = useState(false)
  return (
    <>
      <span className="sp-optimg">
        {o.figure && !failed ? (
          <img src={`/${o.figure.src}`} alt="" onError={() => setFailed(true)} />
        ) : (
          <span className="sp-optimg-fail">Bilden saknas</span>
        )}
      </span>
      <span className="sp-optimg-label">{o.text}</span>
    </>
  )
}

/** The explanation's strategy hint before answering, folded ("Taktik ⌄"):
 *  there when asked for, never in the way. Off in Lugnt läge. */
function TacticHint({ view }: { view: DrillCoreView }) {
  const tactic = view.explanation?.pregrade_tactic
  const [open, setOpen] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: fold again for every question
  useEffect(() => {
    setOpen(false)
  }, [view.index])
  if (!tactic || view.phase !== 'question') return null
  return (
    <div className="sp-tactic" data-open={String(open)}>
      <button
        type="button"
        className="sp-tactic-btn"
        aria-expanded={open}
        aria-controls="sp-tactic-text"
        onClick={() => setOpen(!open)}
      >
        Taktik
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          aria-hidden
          style={{ rotate: open ? '180deg' : '0deg' }}
        />
      </button>
      {open ? (
        <p className="sp-tactic-text" id="sp-tactic-text">
          <b>{tactic.handle}.</b> <MathText>{tactic.move}</MathText>
        </p>
      ) : null}
    </div>
  )
}

// ── Figures ──────────────────────────────────────────────────────────

/** A figure on the problem card: on a white mat at its own aspect (at
 *  most 280 px tall), never filtered, with "Förstora" at its corner. The
 *  question stays answerable if it fails to load. */
function SparFigure({
  figure,
  image,
  openViewer,
}: {
  figure: DrillFigure
  image: ReturnType<typeof useImage>
  openViewer: () => void
}) {
  const style = {
    '--sp-fig-ratio': String(figure.width / figure.height),
  } as CSSProperties
  return (
    <div className="sp-fig" style={style}>
      <figure
        className="sp-mat"
        data-testid="rd-figure"
        data-state={image.state}
        style={{ aspectRatio: `${figure.width} / ${figure.height}` }}
      >
        {image.state === 'failed' ? (
          <FigureFailed what="Figuren" retry={image.retry} />
        ) : (
          <>
            <span className="sp-mat-wait" aria-hidden>
              Hämtar figuren…
            </span>
            <img
              key={image.nonce}
              {...image.img}
              src={`/${figure.src}`}
              alt={figure.alt}
              width={figure.width}
              height={figure.height}
            />
          </>
        )}
      </figure>
      {image.state === 'failed' ? null : (
        <button
          type="button"
          className="sp-icon-btn sp-fig-zoom"
          aria-label="Förstora figuren"
          title="Förstora (Z)"
          onClick={openViewer}
        >
          <Maximize2 size={19} strokeWidth={2.25} aria-hidden />
        </button>
      )}
    </div>
  )
}

function FigureFailed({ what, retry }: { what: string; retry: () => void }) {
  return (
    <div className="sp-mat-fail" role="status">
      <p>{what} gick inte att hämta.</p>
      <button type="button" className="sp-btn sp-btn--quiet sp-btn--sm" onClick={retry}>
        <RefreshCw size={16} strokeWidth={2.25} aria-hidden />
        Försök igen
      </button>
    </div>
  )
}

/**
 * A DTK page card: the band names the page and carries its tools (fit to
 * the width or the whole page, Förstora, Rotera); the printed page sits on
 * a white mat in both themes. `avail` is the room the column gives it.
 */
function PageCard({
  q,
  image,
  pageNo,
  pageCount,
  pageView,
  setPageView,
  rotate,
  openViewer,
  avail,
  phone = false,
}: {
  q: DrillQuestion
  image: ReturnType<typeof useImage>
  pageNo: number
  pageCount: number
  pageView: PageView
  setPageView: (patch: Partial<PageView>) => void
  rotate: () => void
  openViewer: () => void
  avail: { w: number; h: number }
  phone?: boolean
}) {
  const figure = q.figure
  const turned = pageView.rot % 180 !== 0
  const size = figure ? matSize(figure, pageView, avail, phone) : null
  const label = `sida ${pageNo} av ${pageCount}`
  return (
    <article className="sp-pcard sp-pagecard" data-sec="DTK" aria-labelledby="sp-pcard-h">
      <header className="sp-pcard-band">
        <h1 className="sp-pcard-name" id="sp-pcard-h">
          {phone ? (
            <span>{cap(label)}</span>
          ) : (
            <>
              {sectionName('DTK')}
              <span className="sp-pcard-page"> · {label}</span>
            </>
          )}
        </h1>
        {figure && image.state !== 'failed' ? (
          <div className="sp-pcard-tools">
            {phone ? null : (
              <SparSegmented
                label="Visa sidan"
                options={[
                  { key: 'width', label: 'Bredd' },
                  { key: 'page', label: 'Hela sidan' },
                ]}
                value={pageView.fit}
                onChange={(fit) => setPageView({ fit })}
              />
            )}
            <button
              type="button"
              className="sp-btn sp-btn--quiet sp-btn--sm"
              title="Förstora (Z)"
              onClick={openViewer}
            >
              <Maximize2 size={17} strokeWidth={2.25} aria-hidden />
              Förstora
            </button>
            {phone ? null : (
              <button
                type="button"
                className="sp-icon-btn"
                aria-label="Rotera sidan"
                title="Rotera (R)"
                onClick={rotate}
              >
                <RotateCw size={19} strokeWidth={2.25} aria-hidden />
              </button>
            )}
          </div>
        ) : null}
      </header>
      <div className="sp-pcard-body">
        {figure ? (
          <figure
            className="sp-mat sp-mat--page"
            data-testid="rd-figure"
            data-state={image.state}
            data-turned={String(turned)}
            style={
              size
                ? { width: size.w, height: size.h }
                : {
                    aspectRatio: turned
                      ? `${figure.height} / ${figure.width}`
                      : `${figure.width} / ${figure.height}`,
                  }
            }
            onDoubleClick={phone ? openViewer : undefined}
          >
            {image.state === 'failed' ? (
              <FigureFailed what="Sidan" retry={image.retry} />
            ) : (
              <>
                <span className="sp-mat-wait" aria-hidden>
                  Hämtar sidan…
                </span>
                <img
                  key={image.nonce}
                  {...image.img}
                  src={`/${figure.src}`}
                  alt={figure.alt}
                  aria-describedby="sp-pcard-h"
                  width={figure.width}
                  height={figure.height}
                  style={turnedStyle(pageView.rot, size)}
                />
              </>
            )}
          </figure>
        ) : (
          <div className="sp-mat sp-mat--page" data-state="failed">
            <div className="sp-mat-fail" role="status">
              <p>Sidan saknas.</p>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

/** The mat's size for a fit: the column's width, or the whole page in the
 *  room above the tray. Null without layout (CSS keeps the aspect). */
function matSize(
  figure: DrillFigure,
  view: PageView,
  avail: { w: number; h: number },
  phone: boolean,
): { w: number; h: number } | null {
  // The column (the wide one is at most 1000 px), the card's padding on
  // each side, and its band.
  const pad = phone ? 12 : 20
  const band = phone ? 52 : 64
  const col = phone ? avail.w - 24 : Math.min(1000, avail.w - 48)
  const w = col - 2 * pad
  if (w <= 0) return null
  const turned = view.rot % 180 !== 0
  const visW = turned ? figure.height : figure.width
  const visH = turned ? figure.width : figure.height
  if (view.fit === 'width' || phone) return { w, h: Math.round((w * visH) / visW) }
  const h = Math.max(240, avail.h - band - 2 * pad - 40)
  const fitW = Math.min(w, (h * visW) / visH)
  return { w: Math.round(fitW), h: Math.round((fitW * visH) / visW) }
}

/** A turned page: the image keeps its own proportions and turns about
 *  the mat's centre. */
function turnedStyle(rot: number, size: { w: number; h: number } | null): CSSProperties {
  if (rot === 0) return {}
  if (rot === 180) return { transform: 'rotate(180deg)' }
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: size ? size.h : '100%',
    height: size ? size.w : '100%',
    maxWidth: 'none',
    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
  }
}

// ── The viewer ───────────────────────────────────────────────────────

const ZOOMS = [1, 1.5, 2, 3, 4, 6]

/**
 * "Förstora": a full-screen modal over the drill — the figure at fit, then
 * 100–600 %, rotation, drag (or pinch) to pan, ⌘/Ctrl + wheel to zoom.
 * A strip at its foot repeats the question and its options, so answering
 * never means closing it. Esc closes it and nothing else; focus is kept
 * inside while open and goes back to its button after.
 */
function FigureViewer({
  figure,
  page,
  rot,
  onRotate,
  onClose,
  view,
  act,
  blocked,
}: {
  figure: DrillFigure
  page: boolean
  rot: number
  onRotate?: () => void
  onClose: () => void
  view: DrillCoreView
  act: DrillAct
  /** The question takes no answer yet (its page is not on screen). */
  blocked: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const portRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const port = useBox(portRef)
  const [zoom, setZoom] = useState(1)
  const center = useRef<{ x: number; y: number } | null>(null)

  // Focus in on open, back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => opener?.focus?.()
  }, [])

  const turned = rot % 180 !== 0
  const visW = turned ? figure.height : figure.width
  const visH = turned ? figure.width : figure.height
  const base = port.w > 0 && port.h > 0 ? Math.min(port.w / visW, port.h / visH) : 0
  const cw = Math.round(visW * base * zoom)
  const ch = Math.round(visH * base * zoom)

  const zoomTo = useCallback((z: number) => {
    const el = portRef.current
    if (el && el.scrollWidth > 0) {
      center.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      }
    }
    setZoom(Math.min(6, Math.max(1, Math.round(z * 100) / 100)))
  }, [])
  // Keep the point in the middle in the middle as the zoom changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: after a zoom only
  useLayoutEffect(() => {
    const el = portRef.current
    const c = center.current
    if (!el || !c) return
    el.scrollLeft = c.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = c.y * el.scrollHeight - el.clientHeight / 2
    center.current = null
  }, [zoom])
  const zoomIn = () => zoomTo(ZOOMS.find((z) => z > zoom + 0.01) ?? 6)
  const zoomOut = () => zoomTo([...ZOOMS].reverse().find((z) => z < zoom - 0.01) ?? 1)
  const pan = (dx: number, dy: number) => portRef.current?.scrollBy?.({ left: dx, top: dy })

  const keys: Record<string, () => void> = {
    Escape: onClose,
    '+': zoomIn,
    'Shift++': zoomIn,
    '=': zoomIn,
    '-': zoomOut,
    ArrowLeft: () => pan(-80, 0),
    ArrowRight: () => pan(80, 0),
    ArrowUp: () => pan(0, -80),
    ArrowDown: () => pan(0, 80),
  }
  if (onRotate) keys.r = onRotate
  if (view.phase === 'question') {
    for (const l of view.letters) {
      const key = l.toLowerCase()
      keys[key] = () => act.select(l)
      keys[`Shift+${key}`] = () => act.toggleEliminate(l)
    }
    keys.Enter = () => {
      if (!view.selected || blocked) return
      act.lock()
      onClose()
    }
  }
  useKeyMap(keys, true)

  // ⌘/Ctrl + wheel zooms (a native listener: React's wheel is passive).
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  useEffect(() => {
    const el = portRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      zoomTo(zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomTo])

  // A mouse drags the page; two fingers pinch it.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; z: number } | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const dist = () => {
    const [a, b] = [...pointers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const onPointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (e.pointerType === 'mouse' && e.button === 0) drag.current = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 2) pinch.current = { d: dist(), z: zoomRef.current }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current && pointers.current.size === 2 && pinch.current.d > 0) {
      zoomTo((pinch.current.z * dist()) / pinch.current.d)
    } else if (drag.current) {
      pan(drag.current.x - e.clientX, drag.current.y - e.clientY)
      drag.current = { x: e.clientX, y: e.clientY }
    }
  }
  const onPointerEnd = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    drag.current = null
  }

  // Tab stays inside while it is open.
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab') return
    const els = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (!els || els.length === 0) return
    const first = els[0]
    const last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const pct = Math.round(zoom * 100)
  const canvas: CSSProperties | undefined = base > 0 ? { width: cw, height: ch } : undefined
  const img: CSSProperties =
    rot === 0
      ? {}
      : rot === 180
        ? { transform: 'rotate(180deg)' }
        : {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: base > 0 ? ch : '100%',
            height: base > 0 ? cw : '100%',
            maxWidth: 'none',
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
          }
  const q = view.question
  return (
    <div
      className="sp-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={page ? 'Förstorad sida' : 'Förstorad figur'}
      ref={dialogRef}
      onKeyDown={onKeyDown}
    >
      <div className="sp-viewer-bar">
        <div className="sp-viewer-tools" role="toolbar" aria-label="Zoom och rotation">
          <button
            type="button"
            className="sp-icon-btn"
            aria-label="Zooma ut"
            title="Zooma ut (−)"
            disabled={zoom <= 1}
            onClick={zoomOut}
          >
            <Minus size={19} strokeWidth={2.25} aria-hidden />
          </button>
          <span className="sp-viewer-pct" aria-hidden>
            {pct} %
          </span>
          <button
            type="button"
            className="sp-icon-btn"
            aria-label="Zooma in"
            title="Zooma in (+)"
            disabled={zoom >= 6}
            onClick={zoomIn}
          >
            <Plus size={19} strokeWidth={2.25} aria-hidden />
          </button>
          {onRotate ? (
            <button
              type="button"
              className="sp-icon-btn"
              aria-label="Rotera"
              title="Rotera (R)"
              onClick={onRotate}
            >
              <RotateCw size={19} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className="sp-btn sp-btn--quiet sp-btn--sm"
            disabled={zoom === 1}
            onClick={() => zoomTo(1)}
          >
            {page ? 'Hela sidan' : 'Hela figuren'}
          </button>
        </div>
        <span className="sp-sr" aria-live="polite">
          {pct} procent
        </span>
        <button
          type="button"
          className="sp-btn sp-btn--quiet sp-viewer-close"
          ref={closeRef}
          onClick={onClose}
          aria-label="Stäng"
        >
          <X size={18} strokeWidth={2.25} aria-hidden />
          <span className="sp-viewer-close-label" aria-hidden>
            Stäng
          </span>
        </button>
      </div>
      <div
        className="sp-viewer-port"
        ref={portRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="sp-viewer-canvas" style={canvas} data-zoomed={String(zoom > 1)}>
          <img
            src={`/${figure.src}`}
            alt={figure.alt}
            draggable={false}
            style={img}
            width={figure.width}
            height={figure.height}
          />
        </div>
      </div>
      <div className="sp-viewer-strip">
        {view.phase === 'question' ? (
          <>
            <p className="sp-viewer-q">
              <MathText>{q.prompt}</MathText>
            </p>
            <fieldset className="sp-viewer-opts">
              <legend className="sp-sr">Svarsalternativ</legend>
              {(q.options ?? []).map((o) => (
                <button
                  key={o.letter}
                  type="button"
                  className="sp-viewer-opt"
                  aria-pressed={view.selected === o.letter}
                  disabled={blocked}
                  onClick={() => act.select(o.letter)}
                >
                  <span className="sp-blob sp-blob--sm" aria-hidden>
                    {o.letter}
                  </span>
                  <span className="sp-sr">Alternativ {o.letter}:</span>{' '}
                  <MathText>{o.text}</MathText>
                </button>
              ))}
            </fieldset>
            <button
              type="button"
              className="sp-btn sp-btn--primary"
              disabled={!view.selected || blocked}
              onClick={() => {
                act.lock()
                onClose()
              }}
            >
              Svara
              <Kbd>↵</Kbd>
            </button>
          </>
        ) : (
          <p className="sp-viewer-q">
            <b>{view.correct ? 'Rätt!' : 'Fel.'}</b>{' '}
            {view.correct
              ? `Svaret är ${q.answer}.`
              : `Rätt svar är ${q.answer}. Facit ligger kvar bakom.`}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Phone ────────────────────────────────────────────────────────────

function PhoneQuant({
  view,
  act,
  refs,
  session,
  image,
  blocked,
  noPage,
  pageNo,
  pageCount,
  posOnPage,
  onPageCount,
  pageView,
  setPageView,
  rotate,
  openViewer,
  scrollRef,
  repetition,
  chips,
  clock,
  psheet,
  setPsheet,
  multi,
  done,
}: SessionProps & {
  refs: DrillCoreRefs
  chips: ReactNode
  clock: boolean
  psheet: 'peek' | 'open' | 'full'
  setPsheet: (s: 'peek' | 'open' | 'full') => void
  multi: boolean
  done: ReactNode
}) {
  const q = view.question
  const dtk = onPage(q)
  const feedback = view.phase === 'feedback'
  const { hidden, onScroll } = useHideOnScroll()
  const box = useBox(scrollRef)
  // The page's sheet (DTK) and Facit end the column where they begin.
  const sheetRef = useRef<HTMLElement>(null)
  const [peekH, setPeekH] = useState(0)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the sheet changes shape
  useLayoutEffect(() => {
    const el = sheetRef.current
    if (!el || psheet !== 'peek') return
    const measure = () => setPeekH(el.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [psheet, view.phase, view.index])
  const bodyRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: a verdict or a new question starts at the top
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [view.phase, view.index])

  if (view.phase === 'done') {
    return (
      <div className="sp-pdrill">
        <div className="sp-pdrill-scroll sp-pdrill-scroll--done">{done}</div>
      </div>
    )
  }

  const sheet = feedback || dtk
  const scrollStyle: CSSProperties | undefined =
    sheet && psheet === 'peek' ? { bottom: Math.max(0, peekH - 24) } : undefined
  const progress = ((view.index + (feedback ? 1 : 0)) / view.total) * 100
  const last = view.index + 1 >= view.total
  const showTask = () => {
    setPsheet('peek')
    scrollRef.current?.scrollTo?.({ top: 0 })
  }
  // A ¶ chip keeps Facit at half, with its paragraph centred above.
  const cite = (n: number, source?: string) => {
    setPsheet('open')
    act.cite(n, source)
  }
  return (
    <div
      className="sp-pdrill"
      data-phase={view.phase}
      data-sheet={sheet ? psheet : undefined}
      data-mode={dtk ? 'page' : 'problem'}
    >
      <div className="sp-thin" data-shown={String(hidden)} aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </div>
      <header className="sp-ptop" data-hidden={String(hidden)}>
        <button
          type="button"
          className="sp-btn sp-btn--quiet sp-btn--sm"
          data-testid="rd-exit"
          onClick={act.exit}
        >
          <X size={17} strokeWidth={2.25} aria-hidden />
          Avsluta
        </button>
        <span className="sp-ptop-mid">
          {chips}
          <Progress
            view={view}
            questions={session.questions}
            label="Frågorna i övningen"
            compact
            ring={multi}
          />
        </span>
        {clock ? <Timer seconds={view.elapsed} compact /> : <span aria-hidden />}
      </header>
      {hidden ? (
        <button type="button" className="sp-pin-exit" aria-label="Avsluta" onClick={act.exit}>
          <X size={20} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      <div
        className="sp-pdrill-scroll sp-qpscroll"
        ref={scrollRef}
        onScroll={onScroll}
        style={scrollStyle}
        data-bar={String(!sheet)}
      >
        {dtk ? (
          <PageCard
            q={q}
            image={image}
            pageNo={pageNo}
            pageCount={pageCount}
            pageView={pageView}
            setPageView={setPageView}
            rotate={rotate}
            openViewer={openViewer}
            avail={{ w: box.w, h: box.h }}
            phone
          />
        ) : (
          <ProblemCard view={view} refs={refs} image={image} openViewer={openViewer} />
        )}
        {!sheet ? (
          <div className="sp-qpopts">
            <QuantOptions view={view} act={act} phone blocked={blocked} />
            <TacticHint view={view} />
          </div>
        ) : null}
      </div>
      {!sheet ? (
        <div className="sp-answerbar">
          <span className="sp-echo" aria-live="polite">
            {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
          </span>
          <button
            type="button"
            className="sp-btn sp-btn--primary sp-btn--lg"
            data-testid="rd-lock"
            disabled={!view.selected || blocked}
            onClick={act.lock}
          >
            Svara
          </button>
        </div>
      ) : (
        <section
          className="sp-psheet"
          ref={sheetRef}
          data-testid="rd-sheet"
          data-state={psheet}
          data-phase={view.phase}
          data-mode={dtk ? 'page' : 'problem'}
          aria-label={feedback ? 'Facit' : `Fråga ${view.index + 1}`}
        >
          <div className="sp-psheet-grabrow">
            <button
              type="button"
              className="sp-grab"
              aria-label={
                psheet === 'peek'
                  ? feedback
                    ? 'Visa facit'
                    : 'Visa frågan'
                  : feedback
                    ? 'Fäll ner facit'
                    : 'Fäll ner frågan'
              }
              aria-expanded={psheet !== 'peek'}
              onClick={() => setPsheet(psheet === 'peek' ? 'open' : 'peek')}
            />
          </div>
          {feedback ? (
            <div className="sp-psheet-head sp-psheet-head--row">
              <Verdict view={view} compact repetition={repetition} />
              {dtk ? (
                q.figure ? (
                  <button type="button" className="sp-chip-btn" onClick={openViewer}>
                    <Maximize2 size={15} strokeWidth={2.25} aria-hidden />
                    Visa figuren
                  </button>
                ) : null
              ) : (
                <button type="button" className="sp-chip-btn" onClick={showTask}>
                  <ArrowUp size={15} strokeWidth={2.25} aria-hidden />
                  Visa uppgiften
                </button>
              )}
            </div>
          ) : null}
          <div className="sp-psheet-body" ref={bodyRef}>
            {feedback ? (
              psheet === 'peek' ? (
                <button type="button" className="sp-show" onClick={() => setPsheet('open')}>
                  Tillbaka till facit
                  <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
                </button>
              ) : (
                <FeedbackBody
                  view={view}
                  act={{ ...act, cite }}
                  refs={refs}
                  chip
                  prompt={<PromptLine q={q} />}
                  optionText={optionText(q)}
                  repetition={repetition}
                />
              )
            ) : (
              <>
                {onPageCount > 1 ? (
                  <p className="sp-qtray-pos">
                    Fråga {posOnPage} av {onPageCount} på den här sidan
                  </p>
                ) : null}
                <h2 className="sp-prompt" data-testid="rd-quant-prompt">
                  <MathText>{q.prompt}</MathText>
                </h2>
                {noPage ? <p className="sp-qtray-why">Frågan behöver sidan.</p> : null}
                {psheet === 'peek' ? (
                  <button
                    type="button"
                    className="sp-show"
                    aria-expanded={false}
                    onClick={() => setPsheet('open')}
                  >
                    Visa alternativen ({view.letters.length})
                    <ChevronUp size={18} strokeWidth={2.25} aria-hidden />
                  </button>
                ) : null}
                <div hidden={psheet === 'peek'}>
                  <QuantOptions view={view} act={act} phone blocked={blocked} />
                  <TacticHint view={view} />
                </div>
              </>
            )}
          </div>
          {psheet === 'peek' ? null : (
            <div className="sp-psheet-foot">
              {feedback ? (
                <button
                  type="button"
                  className="sp-btn sp-btn--primary sp-btn--lg sp-btn--grow"
                  data-testid="rd-next"
                  onClick={act.next}
                >
                  {last ? 'Klart med övningen' : 'Nästa fråga'}
                </button>
              ) : (
                <>
                  <span className="sp-echo" aria-live="polite">
                    {view.selected ? `Ditt val: ${view.selected}` : 'Välj ett alternativ'}
                  </span>
                  <button
                    type="button"
                    className="sp-btn sp-btn--primary sp-btn--lg"
                    data-testid="rd-lock"
                    disabled={!view.selected || blocked}
                    onClick={act.lock}
                  >
                    Svara
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
