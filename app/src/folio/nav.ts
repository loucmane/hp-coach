export const DESTINATIONS = [
  { id: 'idag', label: 'Idag', to: '/' },
  { id: 'ova', label: 'Öva', to: '/ova' },
  { id: 'provpass', label: 'Provpass', to: '/prov' },
  { id: 'uppslag', label: 'Uppslag', to: '/lektion' },
  { id: 'framsteg', label: 'Framsteg', to: '/progress' },
] as const

export type Destination = (typeof DESTINATIONS)[number]['id']
export const ACCOUNT_ROUTES = { konto: '/konto', settings: '/mer' } as const

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
  return ![
    '/welcome',
    '/hjalp',
    '/integritet',
    '/villkor',
    '/sign-in',
    '/sign-up',
    '/dev-login',
    '/dev',
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
