import type { RailDestination } from '../nav'

const PATHS: Record<RailDestination, string[]> = {
  idag: [
    'M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'M12 3v2M4.9 6l1.4 1.4M19.1 6l-1.4 1.4M3 13h2M19 13h2M5 20h14',
  ],
  ova: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13.5 6.5l4 4'],
  repetera: ['M4 10a8 8 0 1 1 1 8', 'M4 4v6h6'],
  provpass: ['M19.5 13.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0', 'M12 9.5v4l2.5 2M10 2.5h4'],
  uppslag: [
    'M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z',
    'M12 6.5v13',
  ],
  framsteg: ['M4 19h16', 'M5.5 11h3v5h-3z', 'M10.5 7h3v9h-3z', 'M15.5 9.5h3V16h-3z'],
  historik: ['M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0', 'M12 7v5l3 2'],
}

export function NavIcon({ id }: { id: RailDestination }) {
  return (
    <svg
      className="fa-nav-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
