export function SkipLink({ question = false }: { question?: boolean }) {
  return (
    // biome-ignore lint/a11y/useValidAnchor: A real fragment link also moves keyboard focus to its destination.
    <a
      className="fa-skip"
      href="#innehall"
      onClick={() => document.getElementById('innehall')?.focus()}
    >
      {question ? 'Till frågan' : 'Hoppa till innehållet'}
    </a>
  )
}
