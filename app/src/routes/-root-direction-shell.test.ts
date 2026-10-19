import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { DESIGN_DIRECTIONS } from '@/stores/designStore'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('direction bundle boundary', () => {
  it('keeps lightweight choice labels aligned with the lazy registry', async () => {
    const { DIRECTIONS } = await import('@/components/devbake/redesign/directions')
    expect(DESIGN_DIRECTIONS).toEqual(DIRECTIONS.map(({ key, name }) => ({ key, name })))
  })

  it.each([
    'routes/__root.tsx',
    'routes/mer.tsx',
    'components/CommandPalette.tsx',
    'stores/designStore.ts',
  ])('%s has no runtime static import of the shell or bake-off', (file) => {
    const source = ts.createSourceFile(
      file,
      readFileSync(path.join(SRC, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )
    const imports = source.statements.filter(ts.isImportDeclaration)
    expect(imports.length).toBeGreaterThan(0)
    for (const statement of imports) {
      if (statement.importClause?.isTypeOnly) continue
      expect(statement.moduleSpecifier.getText(source)).not.toMatch(/devbake|direction-shell/)
    }
  })

  it('loads the shell through import()', () => {
    const source = readFileSync(path.join(SRC, 'routes/__root.tsx'), 'utf8')
    expect(source).toContain("import('@/components/direction-shell/DirectionShell')")
  })
})
