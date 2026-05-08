// Type shim for react-katex — the package ships JS only, no .d.ts.
// We use the two named exports we actually call; everything else can
// stay un-typed (the package surface is small).

declare module 'react-katex' {
  import type { ComponentType } from 'react'

  export interface MathProps {
    math: string
    errorColor?: string
    renderError?: (error: Error) => React.ReactNode
  }

  export const InlineMath: ComponentType<MathProps>
  export const BlockMath: ComponentType<MathProps>
}
