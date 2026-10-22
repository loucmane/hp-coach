import type { Destination } from '../nav'

const PATHS: Record<Destination, string[]> = {
  idag: ['M4 6.5h16v13H4z', 'M4 10.5h16', 'M8.5 4v4', 'M15.5 4v4', 'M11 15h2'],
  ova: ['M5 19l1-4L16 5l3 3L9 18z', 'M14 7l3 3', 'M5 19l4-1'],
  provpass: ['M12 20.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M12 13.5V10', 'M10 3.5h4', 'M12 3.5v3'],
  uppslag: [
    'M12 7c-2.5-1.8-5.5-2.2-8.5-1.5v13c3-.7 6-.3 8.5 1.5',
    'M12 7c2.5-1.8 5.5-2.2 8.5-1.5v13c-3-.7-6-.3-8.5 1.5',
    'M12 7v13',
  ],
  framsteg: ['M4 19.5h16', 'M5 15.5l4.5-4.5 3.5 3 6-6.5', 'M15 7.5h4v4'],
}

export function NavIcon({ id }: { id: Destination }) {
  return (
    <svg
      className="fa-nav-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[id].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
