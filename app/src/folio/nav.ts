export const DESTINATIONS = [
  { id: 'idag', label: 'Idag', to: '/' },
  { id: 'ova', label: 'Öva', to: '/ova' },
  { id: 'provpass', label: 'Provpass', to: '/prov' },
  { id: 'uppslag', label: 'Uppslag', to: '/lektion' },
  { id: 'framsteg', label: 'Framsteg', to: '/progress' },
] as const

export type Destination = (typeof DESTINATIONS)[number]['id']
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
  framsteg: ['/progress'],
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

export function supportsFolio(pathname: string): boolean {
  const root = pathname.split('/')[1] ?? ''
  if (
    /-bake-?off$/.test(root) ||
    root === 'm-compare' ||
    root.startsWith('redesign-') ||
    root.startsWith('drill-style-')
  )
    return false
  return ![...PUBLIC_ROUTES, '/welcome', '/dev'].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
