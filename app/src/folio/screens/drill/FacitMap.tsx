import { type RefObject, useEffect, useRef, useState } from 'react'
import { useFolioMotion } from '@/folio/lib/useFolioMotion'
import { useScopedKeys } from '@/folio/lib/useScopedKeys'

export type FacitMapEntry = { id: string; label: string }

/** Navigation only: a section remains visible regardless of map selection. */
export function FacitMap({
  entries,
  body,
}: {
  entries: readonly FacitMapEntry[]
  body: RefObject<HTMLDivElement | null>
}) {
  const region = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState(entries[0]?.id)
  const { scrollBehavior } = useFolioMotion()
  const signature = entries.map((entry) => entry.id).join('|')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sections = Array.from(body.current?.querySelectorAll('[data-facit-section]') ?? [])
    const inView = new Set<Element>()
    const observer = new IntersectionObserver(
      (changes) => {
        for (const entry of changes) {
          if (entry.isIntersecting) inView.add(entry.target)
          else inView.delete(entry.target)
        }
        const target = sections.filter((section) => inView.has(section)).at(-1)
        if (target) setCurrent(target.id)
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: 0 },
    )
    const ids = new Set(signature.split('|'))
    for (const section of sections) {
      if (ids.has(section.id)) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [body, signature])
  const active = entries.some((entry) => entry.id === current) ? current : entries[0]?.id
  const navigate = (id: string) => {
    setCurrent(id)
    document.getElementById(id)?.scrollIntoView?.({ block: 'start', behavior: scrollBehavior })
  }
  const move = (delta: number) => {
    const links = Array.from(region.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])
    const focused = links.indexOf(document.activeElement as HTMLAnchorElement)
    const at = focused < 0 ? entries.findIndex((entry) => entry.id === active) : focused
    const index = Math.max(0, Math.min(entries.length - 1, at + delta))
    if (!entries[index]) return false
    links[index]?.focus({ preventScroll: true })
    links[index]?.scrollIntoView?.({
      block: 'nearest',
      inline: 'nearest',
      behavior: scrollBehavior,
    })
    navigate(entries[index].id)
  }
  useScopedKeys(region, { j: () => move(1), k: () => move(-1) })
  return (
    <nav className="fa-facit-map" ref={region} aria-label="Allt i det här facit">
      <p className="fa-facit-map-title">Allt i det här facit · inget är dolt</p>
      <ol>
        {entries.map((entry, index) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={entry.id === active ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault()
                navigate(entry.id)
              }}
            >
              <span className="fa-map-n" aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{entry.label}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="fa-keys">
        <kbd className="fa-kbd">J</kbd> <kbd className="fa-kbd">K</kbd>
      </p>
    </nav>
  )
}
