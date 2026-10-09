// /dev/ovningstext-bakeoff — how should a P5 reading unit say it is
// HP-Coach practice, not a past högskoleprov? (P5 infold PR4a, bead
// hpf-8s3r.1; docs/p5-infold-design.md §3 B + Amendment 1 row B.)
//
// The approved copy is fixed — the »ÖVNINGSTEXT« badge, the authorship
// note at a unit's first display, the estimate caveat and the retired-
// unit notice. What is open is the system around it. Three candidates:
//   A "Marginalen" — typographic: an eyebrow line above the passage,
//                    rail labels beside the question and the outcome, a
//                    one-time colophon note, footnoted estimates.
//   B "Etiketten"  — one object everywhere: a bordered tag that also
//                    opens/folds the note, follows the question once the
//                    passage scrolls away, and heads a caveat box.
//   C "Bandet"     — a running head: one sticky ruled band per unit, the
//                    note under it once, the caveat as an italic line.
// Shared laws: no modal, nothing inside the passage text, no extra step to
// read or answer, and it all stays in the drill's focus mode.
//
// Seven scenes (LÄS, ELF cloze, phone with the passage off screen,
// feedback, replay, estimates, retired unit) in the live M3 chassis with
// real P5 content from a static fixture — see
// components/devbake/ovningstextFixtures.ts. `?v=a|b|c&s=1…7` selects;
// `&frame=1` renders the bare stage (the scene-3 phone preview).
//
// Dev-gated. Kept forever per the keep-bake-offs rule.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  type BakeoffSelection,
  OvningstextBakeoff,
  SCENES,
  type SceneKey,
} from '@/components/devbake/OvningstextBakeoff'
import { VARIANTS, type VariantKey } from '@/components/devbake/OvningstextKit'
import { isDevSurface } from '@/lib/devSurface'

// The scene travels as a number (`s=3`): a numeric-looking string would be
// JSON-quoted into the URL by the router's search serialiser.
type BakeoffSearch = { v?: VariantKey; s?: number; frame?: true }

function validateSearch(input: Record<string, unknown>): BakeoffSearch {
  const out: BakeoffSearch = {}
  const v = String(input.v ?? '')
  if (VARIANTS.some((x) => x.key === v)) out.v = v as VariantKey
  const s = String(input.s ?? '')
  if (SCENES.some((x) => x.key === s)) out.s = Number(s)
  if (input.frame === '1' || input.frame === 1 || input.frame === true) out.frame = true
  return out
}

export const Route = createFileRoute('/dev_/ovningstext-bakeoff')({
  validateSearch,
  component: OvningstextBakeoffPage,
})

function OvningstextBakeoffPage() {
  const { v, s, frame } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        dev-yta — lägg till ?dev=1
      </div>
    )
  }

  return (
    <OvningstextBakeoff
      variant={v ?? 'a'}
      scene={(s != null ? String(s) : '1') as SceneKey}
      frame={frame === true}
      onSelect={(next: BakeoffSelection) =>
        navigate({
          search: (prev) => ({
            ...prev,
            ...(next.v ? { v: next.v } : {}),
            ...(next.s ? { s: Number(next.s) } : {}),
          }),
          replace: true,
        })
      }
    />
  )
}
