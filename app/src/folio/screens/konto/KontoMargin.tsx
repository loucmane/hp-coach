import { type KontoPlace, SECTIONS, SHORTCUTS } from './kontoView'

export function KontoIndex({ go }: { go: (place: KontoPlace) => void }) {
  return (
    <nav className="fa-kt-index" aria-label="På den här sidan">
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className="fa-kt-link"
          onClick={() => go(section.id)}
        >
          {section.title}
        </button>
      ))}
    </nav>
  )
}
export function KontoMargin({ phone, go }: { phone: boolean; go: (place: KontoPlace) => void }) {
  return (
    <aside className="fa-kt-aside" aria-label="Sidans innehåll och kortkommandon">
      {!phone ? (
        <section aria-labelledby="fa-kt-index-h">
          <h2 className="fa-kt-margin-h" id="fa-kt-index-h">
            På den här sidan
          </h2>
          <KontoIndex go={go} />
        </section>
      ) : null}
      <section aria-labelledby="fa-kt-kortkommandon">
        <h2 className="fa-kt-margin-h" id="fa-kt-kortkommandon" tabIndex={-1}>
          Kortkommandon
        </h2>
        {SHORTCUTS.map((group) => (
          <div className="fa-kt-keys" key={group.where}>
            <h3 className="fa-kt-where">{group.where}</h3>
            <dl>
              {group.keys.map(([key, what]) => (
                <div className="fa-kt-key" key={key}>
                  <dt>
                    <kbd>{key}</kbd>
                  </dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </aside>
  )
}
