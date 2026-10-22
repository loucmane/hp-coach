import { Wordmark } from './Wordmark'

export function FocusBar({ onExit }: { onExit: () => void }) {
  return (
    <header className="fa-focus-bar">
      <Wordmark />
      <button type="button" className="fa-exit" data-testid="fa-exit" onClick={onExit}>
        Avsluta
      </button>
    </header>
  )
}
