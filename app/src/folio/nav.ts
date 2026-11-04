export const DESTINATIONS = [
  { id: 'idag', label: 'Idag', tabLabel: 'Idag', to: '/' },
  { id: 'ova', label: 'Öva', tabLabel: 'Öva', to: '/ova' },
  { id: 'provpass', label: 'Provpass', tabLabel: 'Prov', to: '/prov' },
  { id: 'uppslag', label: 'Uppslag', tabLabel: 'Uppslag', to: '/lektion' },
  { id: 'framsteg', label: 'Framsteg', tabLabel: 'Framsteg', to: '/progress' },
] as const

export type Destination = (typeof DESTINATIONS)[number]['id']
export const RAIL_DESTINATIONS = [
  { ...DESTINATIONS[0], sub: false },
  { ...DESTINATIONS[1], sub: false },
  { id: 'repetera', label: 'Repetera', to: '/repetition', sub: true },
  { ...DESTINATIONS[2], sub: false },
  { ...DESTINATIONS[3], sub: false },
  { ...DESTINATIONS[4], sub: false },
  { id: 'historik', label: 'Historik', to: '/historik', sub: true },
] as const
export type RailDestination = (typeof RAIL_DESTINATIONS)[number]['id']
export const ACCOUNT_ROUTES = { konto: '/konto', settings: '/mer' } as const

// Shared with the root auth gate. Clerk's verification steps live below the
// sign-in/up paths; dev-login must also be reachable without a session.
export const PUBLIC_ROUTES = new Set<string>([
  '/sign-in',
  '/sign-up',
  '/dev-login',
  '/integritet',
  '/villkor',
  '/hjalp',
])

const FAMILIES: Record<Destination, readonly string[]> = {
  idag: ['/'],
  ova: ['/ova', '/drill', '/repetition', '/diagnostik'],
  provpass: ['/prov'],
  uppslag: ['/lektion'],
  framsteg: ['/progress', '/historik'],
}

export function currentDestination(pathname: string): Destination | null {
  return (
    DESTINATIONS.find(({ id }) =>
      FAMILIES[id].some(
        (path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)),
      ),
    )?.id ?? null
  )
}

/** Subentries own their desktop selection; phone tabs keep the parent family. */
export function currentRailDestination(pathname: string): RailDestination | null {
  return (
    RAIL_DESTINATIONS.find((d) => d.sub && (pathname === d.to || pathname.startsWith(`${d.to}/`)))
      ?.id ?? currentDestination(pathname)
  )
}

export function supportsFolio(pathname: string): boolean {
  const root = pathname.split('/')[1] ?? ''
  if (
    /-bake-?off$/.test(root) ||
    root.endsWith('-verify') ||
    root === 'dtk-browser' ||
    root === 'm-compare' ||
    root.startsWith('redesign-') ||
    root.startsWith('drill-style-')
  )
    return false
  return ![...PUBLIC_ROUTES, '/dev'].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
