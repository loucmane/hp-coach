// F · Samtal — a calm coach in dialogue. The direction's root: it injects
// Hanken Grotesk + Lora, scopes the token set (samtal.css) to its own data
// attribute and routes the bake-off screens it has built:
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
//   5 Öva         — the frame around Öva (SamtalOva): one suggestion with
//                   its reason, the eight sections as reply-shaped doors,
//                   Repetera and the recurring traps
//   6 Kvantfråga  — the quant drill (SamtalQuant): the problem as an
//                   attachment in the coach's turn, math set by KaTeX
//   7 DTK         — the same drill beside the figure page as a document
//                   that zooms, turns and pans
//   8 Repetera    — the frame around the repetition queue (SamtalRepetera):
//                   what is ready now, one round, the rest folded
//   9 Provpass    — the frame around the hub (SamtalProvpass): the coach's
//                   one offer with the pass attached and the one gate before
//                   the clock; started, the pass leaves the frame and runs
//                   in focus mode, the coach gone quiet
//  10 Resultat    — the frame around the handed-in pass: the result said
//                   plainly, its basis beside the score, then the notes
//  11 Framsteg    — the frame around Framsteg (SamtalFramsteg): one
//                   observation and one reply, the evidence as attachments,
//                   and Historik as its second view
// Every screen reads its data and asks for its moves through
// useDirectionData() (kit v2), so the same screens can run on real data.

import { type ReactNode, useCallback, useEffect, useState } from 'react'

import './samtal.css'
import { type DirectionProps, useWebFonts } from '@/components/devbake/redesign/r1Kit'
import { meta } from './meta'
import { SamtalDrill } from './SamtalDrill'
import { SamtalFrame } from './SamtalNav'
import { SamtalRoot } from './SamtalParts'
import { SamtalPass } from './SamtalProvpass'
import { SamtalQuant } from './SamtalQuant'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..800;1,300..800&family=Lora:ital,wght@0,400..700;1,400..700&display=swap'

export function Samtal(props: DirectionProps) {
  useWebFonts(meta.slug, FONTS)
  const { screen } = props
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  // A pass runs on Provpass (9) only: started from its hub, it takes the
  // whole screen until it is handed in or given up, and a move to another
  // screen ends it — the hub opens fresh on the way back. Giving it up
  // leaves a word on the hub.
  const [run, setRun] = useState<string | null>(null)
  const [notice, setNotice] = useState<'void' | null>(null)
  useEffect(() => {
    if (screen === 9) return
    setRun(null)
    setNotice(null)
  }, [screen])
  const start = useCallback((passId: string) => {
    setNotice(null)
    setRun(passId)
  }, [])
  const leave = useCallback((why: 'void' | 'back') => {
    setRun(null)
    setNotice(why === 'void' ? 'void' : null)
  }, [])

  let stage: ReactNode
  if (screen === 2 || screen === 3) stage = <SamtalDrill {...props} />
  // Kvantfråga and DTK are two sittings: each opens fresh.
  else if (screen === 6 || screen === 7) stage = <SamtalQuant key={screen} {...props} />
  else if (screen === 9 && run != null) {
    stage = (
      <SamtalPass key={run} passId={run} width={props.width} live={props.live} onLeave={leave} />
    )
  } else stage = <SamtalFrame {...props} onStartPass={start} passNotice={notice} />
  return (
    <div
      ref={setRoot}
      data-rd="samtal"
      data-theme={props.theme}
      data-width={props.width}
      data-live={String(props.live)}
      data-testid="rd-samtal"
      lang="sv"
    >
      <SamtalRoot.Provider value={root}>{stage}</SamtalRoot.Provider>
    </div>
  )
}
