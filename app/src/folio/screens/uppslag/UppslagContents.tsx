import type { ComponentProps, RefObject } from 'react'
import { flattenMathText, MathText } from '@/components/MathText'
import { RETRY_LINE, type UppslagChapter } from './uppslagView'

export type NavigateHref = (href: string) => void

/** Real anchors preserve open-in-new-tab and native activation. */
export function UppslagLink({
  navigateHref,
  href,
  onClick,
  target,
  ...props
}: ComponentProps<'a'> & { href: string; navigateHref: NavigateHref }) {
  return (
    <a
      {...props}
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (target && target !== '_self') ||
          props.download != null
        )
          return
        event.preventDefault()
        navigateHref(href)
      }}
    />
  )
}

export function CatalogNotice({ state }: { state: UppslagChapter['state'] }) {
  if (state === 'ready') return null
  return (
    <p className="fa-empty" role="status">
      {state === 'loading'
        ? 'Laddar …'
        : state === 'error'
          ? RETRY_LINE
          : 'Inget innehåll här ännu.'}
    </p>
  )
}

export function ChapterOpener({ chapter, phone }: { chapter: UppslagChapter; phone: boolean }) {
  const H = phone ? 'h2' : 'h1'
  return (
    <header className="fa-up-chapter">
      <p className="fa-label">Kapitel {chapter.number}</p>
      <H className="fa-up-chapter-title">{chapter.name}</H>
      {chapter.description ? <p className="fa-up-chapter-sub">{chapter.description}</p> : null}
      {chapter.state === 'ready' ? (
        <p className="fa-up-count">
          {chapter.readCount} av {chapter.entries.length} lästa
        </p>
      ) : null}
    </header>
  )
}

export function UppslagContents({
  chapter,
  openId,
  navigateHref,
  navRef,
}: {
  chapter: UppslagChapter
  openId: string
  navigateHref: NavigateHref
  navRef: RefObject<HTMLElement | null>
}) {
  return (
    <nav className="fa-up-toc" aria-label={`Innehåll: ${chapter.name}`} ref={navRef}>
      <h2 className="fa-h2 fa-up-toc-h">Innehåll</h2>
      <ol>
        {chapter.entries.map((entry, i) => {
          const here = entry.id === openId
          const page = entry.read ? 'läst' : here ? `${entry.minutes} min` : null
          const title = entry.summary ?? entry.title
          return (
            <li key={entry.id}>
              <UppslagLink
                className="fa-up-entry"
                data-testid={`fa-uppslag-entry-${entry.id}`}
                aria-current={here ? 'page' : undefined}
                aria-label={`${flattenMathText(title)}${page ? `, ${page}` : ''}`}
                href={entry.href}
                navigateHref={navigateHref}
              >
                {here ? <span className="fa-ribbon fa-ribbon--toc" aria-hidden /> : null}
                <span className="fa-plan-n" aria-hidden>
                  {i + 1}
                </span>
                <span className="fa-up-entry-line" aria-hidden>
                  <span className="fa-up-entry-title">
                    <MathText>{title}</MathText>
                  </span>
                  {page ? (
                    <>
                      <span className="fa-leader" />
                      <span className="fa-plan-min" data-word={entry.read ? 'read' : undefined}>
                        {page}
                      </span>
                    </>
                  ) : null}
                </span>
              </UppslagLink>
            </li>
          )
        })}
      </ol>
      {chapter.allRead ? (
        <p className="fa-up-ended">
          <span aria-hidden>⁂ </span>Kapitlet är läst.
        </p>
      ) : null}
    </nav>
  )
}
