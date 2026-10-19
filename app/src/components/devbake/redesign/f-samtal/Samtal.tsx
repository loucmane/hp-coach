// F · Samtal — a calm coach in dialogue. The direction's root: it injects
// Hanken Grotesk + Lora, scopes the token set (samtal.css) to its own data
// attribute and routes the four bake-off screens:
//   1 Idag        — the frame (the five doors as a list of conversations
//                   beside one centred conversation column) around Home:
//                   one coach turn, two replies, the rest as message cards
//   2 Läsfråga    — the drill (SamtalDrill): the passage as a calm document,
//                   the question as a coach turn, the options as replies
//   3 Facit       — the same drill, answered: a Socratic run of turns
//                   (SamtalFeedback) with one "Nästa" in the reply dock
//   4 Navigering  — the frame in its other state: the list folded to a rail
//                   of round doors and the account card open (phone: the
//                   account sheet)

import { useCallback, useState } from 'react'

import './samtal.css'
import {
  type Destination,
  type DirectionProps,
  useWebFonts,
} from '@/components/devbake/redesign/r1Kit'
import { meta } from './meta'
import { SamtalDrill } from './SamtalDrill'
import { SamtalFrame } from './SamtalNav'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..800;1,300..800&family=Lora:ital,wght@0,400..700;1,400..700&display=swap'

export function Samtal(props: DirectionProps) {
  useWebFonts(meta.slug, FONTS)
  const drill = props.screen === 2 || props.screen === 3
  // A destination asked for at the end of a unit ("Nästa: Repetition"
  // opens Öva): the frame opens there instead of on Idag.
  const [wanted, setWanted] = useState<Destination | null>(null)
  const { onScreen } = props
  const goFromDrill = useCallback(
    (d: Destination) => {
      setWanted(d)
      onScreen(1)
    },
    [onScreen],
  )
  const clearWanted = useCallback(() => setWanted(null), [])
  return (
    <div
      data-rd="samtal"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-testid="rd-samtal"
      lang="sv"
    >
      {drill ? (
        <SamtalDrill {...props} onGo={goFromDrill} />
      ) : (
        <SamtalFrame {...props} wanted={wanted} clearWanted={clearWanted} />
      )}
    </div>
  )
}
