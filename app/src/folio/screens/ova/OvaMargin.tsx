import { Seg } from '@/folio/ui/Seg'

export function OvaMargin({
  smartDrill,
  setSmartDrill,
  saving,
  preferenceError,
}: {
  smartDrill: boolean
  setSmartDrill: (value: boolean) => void
  saving: boolean
  preferenceError: boolean
}) {
  return (
    <aside className="fa-ova-side" aria-label="Om övningarna">
      <section className="fa-ova-card" aria-labelledby="fa-ova-selection">
        <h2 id="fa-ova-selection">Frågeurval</h2>
        <Seg
          label="Frågeurval"
          stretch
          value={smartDrill ? 'smart' : 'random'}
          onChange={(v) => setSmartDrill(v === 'smart')}
          options={[
            { value: 'smart', label: 'Nära min nivå', disabled: saving },
            { value: 'random', label: 'Slumpat', disabled: saving },
          ]}
        />
        <p>
          Nära din nivå betyder frågor där du klarar de flesta, inte alla: ungefär tre av fyra. Där
          lär man sig mest utan att tappa modet.
        </p>
        {preferenceError ? <p role="status">Kunde inte spara valet. Försök igen.</p> : null}
      </section>
      <section className="fa-ova-card" aria-labelledby="fa-ova-how">
        <h2 id="fa-ova-how">Så funkar ett pass</h2>
        <p>
          Du svarar med hur säker du är. Efter varje fråga kommer hela facit, med alla steg och
          varför de andra alternativen lockar.
        </p>
        <p>Det du missar kommer tillbaka i Repetera, som en ny fråga med samma fälla.</p>
      </section>
      <section className="fa-ova-card" aria-labelledby="fa-ova-guess">
        <h2 id="fa-ova-guess">Gissa hellre</h2>
        <p>Provet drar inga poäng för fel svar. Ett svar är alltid bättre än inget, även här.</p>
      </section>
    </aside>
  )
}
