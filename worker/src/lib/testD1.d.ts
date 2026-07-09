// Ambient declaration for `node:sqlite`, used ONLY by the in-memory D1
// test shim (lib/testD1.ts). `node:sqlite` is experimental and ships no
// types even under @types/node, so its shape is declared here. (fs/path/url
// come from @types/node, added as a worker devDependency for the test
// harness only — production worker code targets the Workers runtime.)

declare module 'node:sqlite' {
  export interface StatementSync {
    all(...params: unknown[]): unknown[]
    get(...params: unknown[]): unknown
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
    columns(): Array<{ name: string }>
  }
  export class DatabaseSync {
    constructor(path: string)
    exec(sql: string): void
    prepare(sql: string): StatementSync
  }
}
