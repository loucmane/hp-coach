// E · Svep — "Ett kort i taget". Not built yet: the stage is the bake-off's
// "Under arbete" placeholder. The direction's builder replaces this file,
// keeping the `Svep` export the registry (../directions.ts) imports.

import { DirectionStub } from '@/components/devbake/redesign/DirectionStub'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import { meta } from './meta'

export function Svep(props: DirectionProps) {
  return <DirectionStub meta={meta} {...props} />
}
