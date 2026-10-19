import { DESIGN_DIRECTIONS, useDesignDirection, useDesignStore } from '@/stores/designStore'

export function DirectionSwitcher({ onSelect }: { onSelect: () => void }) {
  const direction = useDesignDirection()
  const setDirection = useDesignStore((s) => s.setDirection)
  return (
    <fieldset className="direction-switcher">
      <legend>Designriktning</legend>
      {[...DESIGN_DIRECTIONS, { key: null, name: 'Vanliga appen' }].map((choice) => (
        <button
          key={choice.key ?? 'normal'}
          type="button"
          aria-pressed={direction === choice.key}
          onClick={() => {
            setDirection(choice.key)
            onSelect()
          }}
        >
          {choice.name}
        </button>
      ))}
    </fieldset>
  )
}
