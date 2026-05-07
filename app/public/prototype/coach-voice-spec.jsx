// coach-voice-spec.jsx — side-by-side comparison of all three coach personalities
// across the same five pedagogical moments. Static reference frame on the canvas.

function CoachVoiceSpec({ activeCoach = 'taktiker', onPick }) {
  const coaches = ['kompis', 'professor', 'taktiker'];
  const moments = [
    { key: 'onboardHandoff', label: 'Onboarding · ärlig handoff', sub: 'Innan diagnostiken' },
    { key: 'sectionOnboard', label: 'Sektionsintro · KVA',         sub: 'Första gången i en ny sektion' },
    { key: 'feedbackWrong',  label: 'Drill · fel svar',            sub: 'Direkt efter ett missat svar' },
    { key: 'adaptive',       label: 'Adaptiv interrupt',           sub: '3 fel på samma mönster · 7 dagar' },
    { key: 'sessionEnd',     label: 'Pass slut',                   sub: 'Sista skärmen i ett pass' },
  ];
  const V = window.VOICE;

  const renderText = (m, c) => {
    const v = V[c][m.key];
    if (m.key === 'onboardHandoff') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 17, lineHeight: 1.25, color: 'var(--ink)', textWrap: 'pretty' }}>{v.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink2)' }}>{v.body}</div>
        </div>
      );
    }
    return (
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 17, lineHeight: 1.3, color: 'var(--ink)', textWrap: 'pretty' }}>{v}</div>
    );
  };

  return (
    <div style={{ width: 1240, height: 1180, background: 'var(--bg)', padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 28, fontFamily: 'var(--font-ui)', color: 'var(--ink)' }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Voice spec · röst, inte maskot</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 40, lineHeight: 1.05, margin: '10px 0 0', textWrap: 'balance', maxWidth: '28ch' }}>
          Tre röster. Samma fem ögonblick.
        </h2>
        <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--ink2)', maxWidth: '70ch' }}>
          Coachen är aldrig en figur på skärmen — bara attribuerad monolog. Texten i appen visas med en tunn lodrät linje och en monoetikett, som en redaktionell pull-quote. Klicka på en kolumn för att aktivera den i Tweaks.
        </p>
      </div>

      {/* Coach header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr', gap: 16 }}>
        <div />
        {coaches.map((c) => {
          const on = c === activeCoach;
          return (
            <button key={c} onClick={() => onPick && onPick(c)} style={{
              textAlign: 'left', cursor: 'pointer', background: on ? 'var(--panel)' : 'transparent',
              border: on ? '1px solid var(--ink)' : '1px solid var(--hairline)',
              borderRadius: 12, padding: '14px 16px', fontFamily: 'inherit', color: 'var(--ink)',
              transition: 'border-color 150ms cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', fontSize: 22, letterSpacing: 'var(--font-display-track)' }}>{window.COACH_LABELS[c]}</div>
                {on && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>● aktiv</div>}
                {!on && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>aktivera</div>}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink2)', marginTop: 8 }}>{window.COACH_BLURBS[c]}</div>
            </button>
          );
        })}
      </div>

      {/* Matrix */}
      <div style={{ border: '1px solid var(--hairline)', borderRadius: 14, background: 'var(--panel)', overflow: 'hidden' }}>
        {moments.map((m, i) => (
          <div key={m.key} style={{
            display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr',
            borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
          }}>
            {/* Moment label */}
            <div style={{ padding: '20px 18px', borderRight: '1px solid var(--hairline)', background: 'var(--panel2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{`0${i + 1}`}</div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: 'var(--ink)' }}>{m.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{m.sub}</div>
            </div>
            {/* Three voice cells */}
            {coaches.map((c, j) => {
              const isActive = c === activeCoach;
              return (
                <div key={c} style={{
                  padding: '20px 22px',
                  borderRight: j < coaches.length - 1 ? '1px solid var(--hairline)' : 'none',
                  background: isActive ? 'var(--panel)' : 'transparent',
                  borderLeft: isActive && j === 0 ? '0' : undefined,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    borderLeft: '1.5px solid ' + (isActive ? 'var(--accent)' : 'var(--hairline)'),
                    paddingLeft: 14,
                    width: '100%',
                  }}>
                    {renderText(m, c)}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 10 }}>
                      — {window.COACH_LABELS[c]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: '60ch', lineHeight: 1.5 }}>
          Inga utrop. Inga emoji. Inga förminskningar. Coachen pratar svenska som en kompetent jämlik — inte som en lärare som måste hålla dig glad.
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em' }}>
          Standard: Taktiker · ändra i Tweaks
        </div>
      </div>
    </div>
  );
}

window.CoachVoiceSpec = CoachVoiceSpec;
