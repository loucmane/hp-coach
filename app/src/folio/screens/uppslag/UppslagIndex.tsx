import { CatalogNotice, type NavigateHref, UppslagLink } from './UppslagContents'
import { slug, type UppslagView } from './uppslagView'

export function UppslagChapters({
  view,
  navigateHref,
}: {
  view: UppslagView
  navigateHref: NavigateHref
}) {
  return (
    <section className="fa-up-chapters" aria-labelledby="fa-up-chapters-h">
      <h2 className="fa-h2 fa-up-toc-h" id="fa-up-chapters-h">
        Kapitlen
      </h2>
      <UppslagLink
        className="fa-plan-row fa-up-provteknik"
        href={view.provteknikHref}
        navigateHref={navigateHref}
      >
        <span className="fa-plan-title">Provteknik</span>
        <span className="fa-leader" />
        <span aria-hidden>→</span>
      </UppslagLink>
      {(['verbal', 'kvant'] as const).map((half) => (
        <div key={half} className="fa-part-block">
          <h3 className="fa-part-head" id={`fa-up-${half}`}>
            <span>{half === 'verbal' ? 'Verbal del' : 'Kvantitativ del'}</span>
            <span className="fa-rule" aria-hidden />
          </h3>
          <ul aria-labelledby={`fa-up-${half}`}>
            {view.chapters
              .filter((c) => c.half === half)
              .map((c) => {
                const count =
                  c.state === 'ready' || c.state === 'empty'
                    ? `${c.readCount} av ${c.entries.length} lästa`
                    : c.state === 'loading'
                      ? 'Laddar …'
                      : 'Kunde inte hämtas'
                return (
                  <li key={c.section}>
                    <UppslagLink
                      className="fa-plan-row fa-up-ch"
                      href={c.href}
                      navigateHref={navigateHref}
                      data-testid={`fa-uppslag-section-${slug(c.section)}`}
                      aria-current={view.chapter?.section === c.section ? 'true' : undefined}
                      aria-label={`Kapitel ${c.number}, ${c.section}, ${c.name}, ${count}${view.suggested === c.section ? ', Förslag' : ''}`}
                    >
                      <span className="fa-entry-code" aria-hidden>
                        {c.section}
                      </span>
                      <span className="fa-plan-body" aria-hidden>
                        <span className="fa-label">Kapitel {c.number}</span>
                        <span className="fa-plan-line">
                          <span className="fa-plan-title">{c.name}</span>
                          <span className="fa-leader" />
                          <span className="fa-plan-min">{count}</span>
                        </span>
                        <span className="fa-plan-why">
                          {c.description}
                          {view.suggested === c.section ? (
                            <em className="fa-up-suggestion"> · Förslag</em>
                          ) : null}
                        </span>
                      </span>
                    </UppslagLink>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </section>
  )
}

export function UppslagDirect({
  view,
  navigateHref,
}: {
  view: UppslagView
  navigateHref: NavigateHref
}) {
  return (
    <section className="fa-up-direct" aria-labelledby="fa-up-direct-h">
      <h2 className="fa-h3" id="fa-up-direct-h">
        Öva direkt
      </h2>
      <p className="fa-margin-note">Läs ett mönster, öva sedan på det.</p>
      <div className="fa-up-links">
        <UppslagLink
          className="fa-link"
          href={view.mixedHref}
          navigateHref={navigateHref}
          data-testid="lektion-mixed"
        >
          Blandad övning <span aria-hidden>→</span>
        </UppslagLink>
        {view.repetitionHref ? (
          <UppslagLink
            className="fa-link"
            href={view.repetitionHref}
            navigateHref={navigateHref}
            data-testid="lektion-repetition"
          >
            Repetera dina missar <span aria-hidden>→</span>
          </UppslagLink>
        ) : null}
      </div>
    </section>
  )
}

export function UppslagIndex({
  view,
  navigateHref,
}: {
  view: UppslagView
  navigateHref: NavigateHref
}) {
  const state = view.chapters.some((c) => c.state === 'error')
    ? 'error'
    : view.chapters.every((c) => c.state === 'loading')
      ? 'loading'
      : view.chapters.every((c) => c.state === 'empty')
        ? 'empty'
        : 'ready'
  return (
    <div className="fa-up-index">
      <div className="fa-masthead">
        <span className="fa-label">Uppslag</span>
      </div>
      <h1 className="fa-greet">Läs först.</h1>
      <p className="fa-day">
        Åtta kapitel med mönster, frågetyper och ord. Slå upp det du vill öva på.
      </p>
      <CatalogNotice state={state} />
      <UppslagChapters view={view} navigateHref={navigateHref} />
      <UppslagDirect view={view} navigateHref={navigateHref} />
    </div>
  )
}
