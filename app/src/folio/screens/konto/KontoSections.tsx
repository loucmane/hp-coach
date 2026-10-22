import { type ReactNode, useId } from 'react'
import { LEGAL_LINKS } from '@/lib/legal'
import { SUPPORT_REPLY_LINE } from '@/lib/support'
import { COACH_BLURBS } from '@/lib/voice'
import {
  COACH_OPTIONS,
  COPY,
  type ExportState,
  examChoices,
  MODE_OPTIONS,
  type NavigateHref,
  type Option,
  PALETTE_OPTIONS,
  TOOLS,
} from './kontoView'
import type { KontoExtras } from './useKontoExtras'

export function KontoLink({
  href,
  navigateHref,
  children,
  testId,
  className = 'fa-kt-link',
}: {
  href: string
  navigateHref: NavigateHref
  children: ReactNode
  testId?: string
  className?: string
}) {
  return (
    <a
      className={className}
      href={href}
      data-testid={testId}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.defaultPrevented
        )
          return
        event.preventDefault()
        navigateHref(href)
      }}
    >
      {children}
    </a>
  )
}

function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="fa-kt-part" aria-labelledby={`fa-kt-${id}`}>
      <h2 className="fa-kt-h" id={`fa-kt-${id}`} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  )
}
function Value({
  label,
  children,
  testId,
}: {
  label: string
  children: ReactNode
  testId?: string
}) {
  return (
    <div className="fa-kt-row">
      <dt>{label}</dt>
      <dd data-testid={testId}>{children}</dd>
    </div>
  )
}

function Choice<K extends string>({
  legend,
  options,
  value,
  hint,
  error = false,
  busy = false,
  ariaPrefix,
  onPick,
}: {
  legend: string
  options: Option<K>[]
  value: K
  hint?: string
  error?: boolean
  busy?: boolean
  ariaPrefix?: string
  onPick: (key: K) => void
}) {
  const id = useId()
  return (
    <fieldset className="fa-kt-choice" aria-describedby={`${id}-hint ${id}-status`} disabled={busy}>
      <legend className="fa-kt-label">{legend}</legend>
      <div className="fa-kt-value">
        <div className="fa-kt-seg">
          {options.map((option) => (
            <button
              type="button"
              key={option.key}
              aria-pressed={option.key === value}
              aria-label={ariaPrefix ? `${ariaPrefix}: ${option.label}` : undefined}
              onClick={() => onPick(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="fa-kt-hint" id={`${id}-hint`}>
          {hint}
        </p>
        <p className="fa-kt-error fa-kt-status" id={`${id}-status`} role="status">
          {error ? COPY.saveFailed : ''}
        </p>
      </div>
    </fieldset>
  )
}

export function ExportStatus({ state, onRetry }: { state: ExportState; onRetry: () => void }) {
  return (
    <p
      className={`fa-kt-status ${state === 'failed' ? 'fa-kt-error' : 'fa-kt-hint'}`}
      role="status"
    >
      {state === 'done' ? (
        COPY.exported
      ) : state === 'pending' ? (
        'Hämtar din data…'
      ) : state === 'failed' ? (
        <>
          {COPY.exportFailed}{' '}
          <button type="button" className="fa-kt-link" onClick={onRetry}>
            Försök igen
          </button>
        </>
      ) : (
        ''
      )}
    </p>
  )
}

export function KontoSections({
  extras: k,
  navigateHref,
}: {
  extras: KontoExtras
  navigateHref: NavigateHref
}) {
  const exam = examChoices(k.sitting.id)
  return (
    <>
      <Part id="du" title="Du">
        <dl className="fa-kt-dl" data-testid="konto-identity">
          <Value label="Namn">{k.identity.name}</Value>
          <Value label="E-post" testId="konto-email">
            {k.identity.email}
          </Value>
        </dl>
        <p className="fa-kt-hint">
          Betalning kommer när HP-Coach blir en betald tjänst – inget att göra här ännu.
        </p>
        <p className="fa-kt-hint">Inloggning: lösenord och tvåfaktor</p>
      </Part>
      <Part id="provet" title="Provet">
        <Choice
          legend="Prov"
          ariaPrefix="Prov"
          options={exam.options}
          value={k.sitting.id}
          hint={exam.hint}
          error={k.failed.sitting}
          busy={k.saving}
          onPick={(id) => void k.choose('sitting', () => k.synced.setSitting(id))}
        />
      </Part>
      <Part id="ovningen" title="Övningen">
        <Choice
          legend="Frågeurval"
          options={[
            { key: 'smart', label: 'Smart' },
            { key: 'slumpat', label: 'Slumpat' },
          ]}
          value={k.smartDrill ? 'smart' : 'slumpat'}
          hint={k.smartDrill ? 'Frågor nära din nivå.' : 'Helt slumpade frågor.'}
          error={k.failed.smartDrill}
          busy={k.saving}
          onPick={(key) =>
            void k.choose('smartDrill', () => k.synced.setSmartDrill(key === 'smart'))
          }
        />
        <Choice
          legend="Coach"
          options={COACH_OPTIONS}
          value={k.coach}
          hint={COACH_BLURBS[k.coach]}
          error={k.failed.coach}
          busy={k.saving}
          onPick={(coach) => void k.choose('coach', () => k.synced.setCoach(coach))}
        />
      </Part>
      <Part id="utseende" title="Utseende">
        <Choice
          legend="Tema"
          options={MODE_OPTIONS}
          value={k.mode}
          error={k.failed.mode}
          busy={k.saving}
          onPick={(mode) => void k.choose('mode', () => k.synced.setMode(mode))}
        />
        <Choice
          legend="Färg"
          options={PALETTE_OPTIONS}
          value={k.palette}
          hint="Papperets ton, i ljust och mörkt."
          error={k.failed.palette}
          busy={k.saving}
          onPick={(palette) => void k.choose('palette', () => k.synced.setPalette(palette))}
        />
      </Part>
      <Part id="design" title="Design">
        <Choice
          legend="Utformning"
          options={[
            { key: 'classic', label: 'Klassisk' },
            { key: 'folio', label: 'Ny design (förhandsvisning)' },
          ]}
          value={k.preview ? 'folio' : 'classic'}
          hint="Valet gäller på den här enheten. Klassisk lämnar den nya designen direkt."
          onPick={(key) => k.setPreview(key === 'folio')}
        />
      </Part>
      <Part id="data" title="Din data">
        <button
          type="button"
          className="fa-kt-link"
          data-testid="konto-export"
          disabled={k.exported === 'pending'}
          onClick={() => void k.exportNow()}
        >
          Exportera min data →
        </button>
        <p className="fa-kt-hint">En fil med allt du har gjort i appen.</p>
        <ExportStatus state={k.exported} onRetry={() => void k.exportNow()} />
      </Part>
      <Part id="verktyg" title="Verktyg">
        <ul className="fa-kt-tools">
          {TOOLS.map((tool) => (
            <li key={tool.to}>
              <KontoLink
                className="fa-kt-tool"
                href={tool.to}
                testId={`mer-tool-${tool.to.slice(1)}`}
                navigateHref={navigateHref}
              >
                <span className="fa-kt-tool-title">
                  {tool.headline} <span aria-hidden>→</span>
                </span>
                <span className="fa-kt-hint">{tool.rationale}</span>
              </KontoLink>
            </li>
          ))}
        </ul>
      </Part>
      <Part id="hjalp" title="Hjälp">
        <div className="fa-kt-links">
          <KontoLink href="/hjalp" testId="mer-support" navigateHref={navigateHref}>
            Hjälp &amp; support →
          </KontoLink>
          {LEGAL_LINKS.map((link) => (
            <KontoLink
              key={link.to}
              href={link.to}
              testId={`konto-legal-${link.to.slice(1)}`}
              navigateHref={navigateHref}
            >
              {link.label} →
            </KontoLink>
          ))}
        </div>
        <p className="fa-kt-hint">{SUPPORT_REPLY_LINE}</p>
      </Part>
    </>
  )
}
