import { GapText } from './GapText'
import { type NavigateHref, RepeteraLink } from './RepeteraQueue'
import type { RepeteraItem } from './repeteraView'

export function MissRow({
  item,
  navigateHref,
}: {
  item: RepeteraItem
  navigateHref: NavigateHref
}) {
  return (
    <li>
      <RepeteraLink className="fa-miss" href={item.href} navigateHref={navigateHref}>
        <span className="fa-entry-code">{item.section ?? 'Fråga'}</span>
        <span className="fa-miss-body">
          {item.stem ? (
            <span
              className="fa-miss-stem"
              data-word={item.section === 'ORD' ? 'true' : undefined}
              lang={item.section === 'ELF' ? 'en' : undefined}
            >
              <GapText text={item.stem} />
            </span>
          ) : null}
        </span>
        <span className="fa-miss-when">{item.dueLabel}</span>
      </RepeteraLink>
    </li>
  )
}
