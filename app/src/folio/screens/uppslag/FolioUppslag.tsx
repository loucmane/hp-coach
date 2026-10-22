import { useEffect, useRef, useState } from 'react'
import type { Section } from '@/data/questions'
import { currentDevice } from '@/lib/device'
import {
  CatalogNotice,
  ChapterOpener,
  type NavigateHref,
  UppslagContents,
  UppslagLink,
} from './UppslagContents'
import { UppslagChapters, UppslagDirect, UppslagIndex } from './UppslagIndex'
import { ChapterEnd, ReadToggle, UppslagLesson } from './UppslagLesson'
import { buildUppslagView, decodeHash } from './uppslagView'
import { useUppslagExtras } from './useUppslagExtras'
import './uppslag.css'

export default function FolioUppslag({
  section,
  navigateHref,
}: {
  section?: Section
  navigateHref: NavigateHref
}) {
  const extras = useUppslagExtras()
  // Freeze the resolved entry for this location. Read changes and bookmark
  // responses must never turn the page under the reader.
  const [selection, setSelection] = useState<{ section: Section; hash: string; id: string } | null>(
    null,
  )
  const hash =
    selection?.section === section && selection?.hash === extras.hash ? selection.id : extras.hash
  const view = buildUppslagView({ ...extras, section, hash, bookmark: extras.bookmark.data })
  const { chapter, open } = view
  const hasRequestedEntry = chapter?.entries.some((e) => e.id === decodeHash(hash))
  // The shared query keeps retrying for other readers; this page can use its
  // fallback after the first failed attempt without waiting through that delay.
  const waitingBookmark = extras.bookmark.isPending && extras.bookmark.failureCount === 0
  const waitingEntry = !!open && (!extras.readsReady || (!hasRequestedEntry && waitingBookmark))
  const id = waitingEntry ? undefined : open?.id
  const [endFor, setEndFor] = useState<string | null>(null)
  const ending = !!chapter?.allRead && endFor === `${section}:${id}`
  const phone = extras.viewport === 'phone'
  const lessonRef = useRef<HTMLElement>(null)
  const tocRef = useRef<HTMLElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const practiceRef = useRef<HTMLAnchorElement>(null)
  const focusNext = useRef(false)
  const putRef = useRef(extras.putProgress)
  putRef.current = extras.putProgress
  const navigateRef = useRef(navigateHref)
  navigateRef.current = navigateHref
  const arrivalRef = useRef<Section | null>(null)

  useEffect(() => {
    if (!section || !id) {
      arrivalRef.current = null
      return
    }
    setSelection({ section, hash: extras.hash, id })
    // Canonicalize a hashless arrival once, through the router. Direct browser
    // writes here can overwrite the previous entry before a queued push lands.
    if (extras.hash) arrivalRef.current = null
    else if (arrivalRef.current !== section) {
      arrivalRef.current = section
      navigateRef.current(
        `/lektion?section=${encodeURIComponent(section)}#${encodeURIComponent(id)}`,
        {
          replace: true,
        },
      )
    }
    const timer = setTimeout(
      () => putRef.current({ section, frameworkId: id, device: currentDevice() }),
      400,
    )
    return () => clearTimeout(timer)
  }, [section, id, extras.hash])

  useEffect(() => {
    if (!focusNext.current || !id) return
    focusNext.current = false
    lessonRef.current?.focus({ preventScroll: true })
    lessonRef.current?.scrollIntoView?.({ block: 'start' })
  })

  const navigate: NavigateHref = (href) => {
    const url = new URL(href, window.location.origin)
    const to = decodeHash(url.hash)
    if (
      section &&
      url.pathname === '/lektion' &&
      url.searchParams.get('section') === section &&
      chapter?.entries.some((e) => e.id === to)
    ) {
      setSelection({ section, hash: extras.hash, id: to })
      setEndFor(null)
      focusNext.current = true
    }
    navigateHref(href)
  }
  const primary = () => {
    if (!open || !id) return
    if (!open.read) extras.toggleRead(open.id)
    if (view.next) navigate(view.next.href)
    else {
      focusNext.current = true
      setEndFor(`${section}:${id}`)
    }
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !id ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        !['Enter', 'j', 'k'].includes(event.key)
      )
        return
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'a, button, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [inert]',
        )
      )
        return
      if (
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [role="menu"], dialog[open]',
        ) ||
        lessonRef.current?.closest('[inert]') ||
        practiceRef.current?.closest('[inert]')
      )
        return
      if (event.key === 'Enter') {
        const control = ending ? practiceRef.current : primaryRef.current
        if (!control) return
        event.preventDefault()
        control.click()
      } else if (chapter) {
        const at = chapter.entries.findIndex((e) => e.id === id)
        const to = chapter.entries[at + (event.key === 'j' ? 1 : -1)]
        if (to) {
          event.preventDefault()
          navigate(to.href)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const rootClass = `fa-uppslag ${phone ? 'fa-phome' : 'fa-home'}`
  if (!chapter)
    return (
      <div className={rootClass} data-testid="folio-uppslag">
        <UppslagIndex view={view} navigateHref={navigate} />
      </div>
    )
  const back = (
    <>
      <ChapterOpener chapter={chapter} phone={phone} />
      {id ? (
        <UppslagContents chapter={chapter} openId={id} navigateHref={navigate} navRef={tocRef} />
      ) : null}
      <UppslagChapters view={view} navigateHref={navigate} />
      <UppslagDirect view={view} navigateHref={navigate} />
    </>
  )
  const lesson = (
    <>
      <header className="fa-runhead fa-runhead--recto">
        <span className="fa-up-pos">{id ? view.position : chapter.section}</span>
        {!ending && id && open ? (
          <ReadToggle open={open} toggleRead={() => extras.toggleRead(open.id)} />
        ) : null}
      </header>
      <div className="fa-up-body">
        {waitingEntry ? <CatalogNotice state="loading" /> : <CatalogNotice state={chapter.state} />}
        {id && open ? (
          ending ? (
            <ChapterEnd
              chapter={chapter}
              phone={phone}
              onBack={() => {
                focusNext.current = true
                setEndFor(null)
              }}
              navigateHref={navigate}
              practiceRef={practiceRef}
              lessonRef={lessonRef}
            />
          ) : (
            <UppslagLesson
              open={open}
              phone={phone}
              primaryLabel={view.primaryLabel}
              onPrimary={primary}
              navigateHref={navigate}
              lessonRef={lessonRef}
              primaryRef={primaryRef}
            />
          )
        ) : null}
      </div>
    </>
  )
  const whole = !ending ? (
    <UppslagLink
      className="fa-link"
      href={chapter.practiceHref}
      navigateHref={navigate}
      data-testid="section-practice-all"
    >
      Öva hela {chapter.section}
    </UppslagLink>
  ) : null
  if (phone)
    return (
      <div className={rootClass} data-testid="folio-uppslag">
        <div className="fa-masthead">
          <UppslagLink className="fa-link" href="/lektion" navigateHref={navigate}>
            Uppslag · {section}
          </UppslagLink>
          {id ? (
            <button
              className="fa-link fa-up-jump"
              type="button"
              onClick={() => {
                const link =
                  tocRef.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]')
                link?.focus({ preventScroll: true })
                tocRef.current?.scrollIntoView?.({ block: 'start' })
              }}
            >
              Innehåll <span aria-hidden>↓</span>
            </button>
          ) : null}
        </div>
        {lesson}
        <div className="fa-up-back">
          {whole}
          {back}
        </div>
      </div>
    )
  return (
    <div className={`${rootClass} fa-up-spread`} data-testid="folio-uppslag">
      <div className="fa-verso">
        <header className="fa-runhead">
          <UppslagLink className="fa-link" href="/lektion" navigateHref={navigate}>
            Uppslag · {section}
          </UppslagLink>
          {whole}
        </header>
        <div className="fa-up-verso">{back}</div>
      </div>
      <div className="fa-recto">{lesson}</div>
    </div>
  )
}
