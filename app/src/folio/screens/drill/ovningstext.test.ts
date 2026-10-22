import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { OVNINGSTEXT_BADGE, OVNINGSTEXT_NOTE } from './ovningstext'

it('pins the approved disclosure to the original copy without a production devbake import', () => {
  const source = readFileSync('src/components/devbake/ovningstextFixtures.ts', 'utf8')
  expect(OVNINGSTEXT_BADGE).toBe(source.match(/OVNINGSTEXT_BADGE = '([^']+)'/)?.[1])
  expect(OVNINGSTEXT_NOTE).toBe(source.match(/OVNINGSTEXT_NOTE =\s*'([^']+)'/)?.[1])
})
