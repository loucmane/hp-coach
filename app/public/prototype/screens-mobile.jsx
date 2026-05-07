// screens-mobile.jsx — HP-Coach mobile artboards (390×844)
// All screens render inside a 390×844 phone canvas with status bar + home indicator.
// Each screen receives shared `nav` and `onL1` callbacks so chips/CTAs can wire up.

const Phone = ({ children, dark }) => (
  <div style={{ width: 390, height: 844, background: 'var(--bg)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <StatusBar dark={dark} />
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
    <HomeIndicator />
  </div>
);

// 1 — First-launch onboarding ----------------------------------------------
function ScrOnboard({ onNext, step = 0, voice, coach = 'taktiker' }) {
  voice = voice || (window.VOICE && window.VOICE.taktiker);
  const [s, setS] = React.useState(step);
  const [days, setDays] = React.useState(214);
  const [mins, setMins] = React.useState(40);
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Mono>HP-Coach</Mono>
          <Mono>{s + 1}/3</Mono>
        </div>

        {s === 0 && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Eyebrow>Fråga 1 av 3</Eyebrow>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 'var(--font-display-lead)', fontSize: 36, margin: '12px 0 8px', textWrap: 'balance' }}>Hur många dagar till provet?</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>Välj sittning eller skriv eget datum. Höstprovet 26: 25&nbsp;okt 2026. Vårprovet 27: 21&nbsp;mars 2027.</p>

              <div style={{ marginTop: 28, padding: 'var(--pad-lg)', background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 56, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{days}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>dagar kvar</span>
                </div>
                <Mono style={{ marginTop: 8 }}>25 okt 2026 · höstprov</Mono>
              </div>

              <Stack gap="8px" style={{ marginTop: 16 }}>
                {[
                  { label: 'Höstprov 26', date: '25 okt 2026', d: 214, sel: true },
                  { label: 'Vårprov 27', date: '21 mar 2027', d: 361, sel: false },
                  { label: 'Eget datum…', date: null, d: null, sel: false },
                ].map((o) => (
                  <button key={o.label} onClick={() => o.d && setDays(o.d)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', background: 'var(--panel)',
                    border: `1px solid ${days === o.d ? 'var(--ink)' : 'var(--hairline)'}`,
                    borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', textAlign: 'left',
                  }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{o.label}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{o.date}</span>
                  </button>
                ))}
              </Stack>
            </div>
            <Btn variant="primary" size="lg" full onClick={() => setS(1)} trailing={<I.arrowRight s={14}/>}>Fortsätt</Btn>
          </>
        )}

        {s === 1 && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Eyebrow>Fråga 2 av 3</Eyebrow>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 'var(--font-display-lead)', fontSize: 36, margin: '12px 0 8px', textWrap: 'balance' }}>Hur mycket tid har du per dag?</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>Realistiskt, inte ambitiöst. Du kan ändra när som helst.</p>

              <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { v: 10, sub: 'lågenergiläge' },
                  { v: 20, sub: 'kort pass' },
                  { v: 40, sub: 'rekommenderat' },
                  { v: 60, sub: 'hyperfokus' },
                ].map((o) => (
                  <button key={o.v} onClick={() => setMins(o.v)} style={{
                    padding: '20px 16px', background: 'var(--panel)',
                    border: `1px solid ${mins === o.v ? 'var(--ink)' : 'var(--hairline)'}`,
                    borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 32, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{o.v}<span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>{o.v === 60 ? 'min+' : 'min'}</span></div>
                    <Mono size={10} style={{ marginTop: 8, display: 'block' }}>{o.sub}</Mono>
                  </button>
                ))}
              </div>
            </div>
            <Btn variant="primary" size="lg" full onClick={() => setS(2)} trailing={<I.arrowRight s={14}/>}>Fortsätt</Btn>
          </>
        )}

        {s === 2 && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Eyebrow>Innan du börjar</Eyebrow>
              <window.CoachLine coach={coach} as="title" style={{ marginTop: 12, maxWidth: '32ch' }}>{voice.onboardHandoff.title}</window.CoachLine>
              <p style={{ marginTop: 12, fontSize: 17, color: 'var(--ink2)', lineHeight: 1.5 }}>
                {voice.onboardHandoff.body}
              </p>
              <div style={{ marginTop: 24, padding: 14, background: 'var(--panel2)', borderRadius: 10, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                Fullständig diagnostik tar två dagar. Verbal halva idag, kvant halva imorgon. Du kan pausa.
              </div>
            </div>
            <Btn variant="primary" size="lg" full onClick={onNext}>Börja diagnostiken</Btn>
          </>
        )}
      </div>
    </Phone>
  );
}

// 2a — Diagnostic pre-start (real-conditions briefing) --------------------
function ScrDiagPre({ onStart }) {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 24px 24px' }}>
        <Mono>Diagnostik · innan start</Mono>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.05, fontSize: 38, margin: '14px 0 6px', textWrap: 'balance' }}>Verbal halva.</h1>
        <p style={{ fontSize: 15, color: 'var(--ink2)', lineHeight: 1.5, margin: '0 0 22px', maxWidth: '36ch' }}>
          80 frågor · 160 min · riktiga provförhållanden. Ingen återkoppling per fråga, inget formelblad, inget kladdpapper. Du kan pausa.
        </p>

        <Stack gap="10px">
          {[
            { l: 'ORD', sub: 'Synonymer', n: '40 frågor' },
            { l: 'LÄS', sub: 'Svensk läsförståelse', n: '20 frågor' },
            { l: 'MEK', sub: 'Meningskomplettering', n: '20 frågor' },
            { l: 'ELF', sub: 'English Reading', n: '20 frågor' },
          ].map((it) => (
            <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 12 }}>
              <Mono size={11} style={{ width: 32 }}>{it.l}</Mono>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{it.sub}</div>
              </div>
              <Mono size={11}>{it.n}</Mono>
            </div>
          ))}
        </Stack>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--panel2)', borderRadius: 10, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Tips: ingen poängreduktion för fel svar. Gissa hellre än att lämna tomt.
        </div>

        <div style={{ flex: 1 }} />
        <Btn variant="primary" size="lg" full onClick={onStart}>Starta tidtagningen</Btn>
      </div>
    </Phone>
  );
}

// 2c — Diagnostic completion handoff (between halvor) ----------------------
function ScrDiagDone({ onNext }) {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 24px 24px' }}>
        <Mono>Verbal halva klar</Mono>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.05, fontSize: 56, margin: '20px 0 0' }}>Halvvägs.</h1>
        <p style={{ fontSize: 16, color: 'var(--ink2)', lineHeight: 1.5, margin: '12px 0 28px', maxWidth: '32ch' }}>
          Kvant halva imorgon. 12 timmars vila är pedagogiskt motiverat — inte en mjukstart.
        </p>

        <div style={{ padding: 'var(--pad-lg)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)' }}>
          <Eyebrow>Pass 1 · sammanfattning</Eyebrow>
          <Stack gap="10px" style={{ marginTop: 10 }}>
            {[
              ['Tid använd', '2t 38min av 2t 40min'],
              ['Frågor besvarade', '78 av 80'],
              ['Markerade för översyn', '11'],
              ['Resultat', 'visas efter pass 2'],
            ].map(([l, r]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--ink2)' }}>
                <span>{l}</span>
                <Mono size={12}>{r}</Mono>
              </div>
            ))}
          </Stack>
        </div>

        <div style={{ flex: 1 }} />
        <Stack gap="8px">
          <Btn variant="primary" size="lg" full onClick={onNext}>Påminn mig kl. 18 imorgon</Btn>
          <Btn variant="ghost" size="md" full>Kör pass 2 nu (rekommenderas inte)</Btn>
        </Stack>
      </div>
    </Phone>
  );
}

// 7b — DTK drill (Diagram, tabeller, kartor) — SVG bar chart -------------
function ScrDrillDTK({ onAnswer, selected, onSelect, onCmdK, onFormulaSheet, onScratchpad }) {
  // Mock dataset: monthly precipitation, two cities
  const data = [
    { m: 'Jan', a: 42, b: 38 }, { m: 'Feb', a: 35, b: 30 }, { m: 'Mar', a: 28, b: 25 },
    { m: 'Apr', a: 38, b: 42 }, { m: 'Maj', a: 52, b: 48 }, { m: 'Jun', a: 64, b: 58 },
    { m: 'Jul', a: 71, b: 66 }, { m: 'Aug', a: 78, b: 70 },
  ];
  const W = 340, H = 160, max = 80;
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 14px' }}>
          <div>
            <Mono size={10}>DTK · Övning</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Fråga 4 · pass 2/3</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Mono size={10}>Tid</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>01:18</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Mono size={10}>Diagram 1 · Nederbörd per månad (mm)</Mono>
          <div style={{ marginTop: 8, padding: 10, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
              {[20, 40, 60, 80].map((g) => (
                <g key={g}>
                  <line x1="28" x2={W - 6} y1={H - 18 - (g / max) * (H - 30)} y2={H - 18 - (g / max) * (H - 30)} stroke="var(--hairline)" strokeDasharray="2 3" />
                  <text x="0" y={H - 14 - (g / max) * (H - 30)} fontSize="8" fill="var(--muted)" fontFamily="var(--font-mono)">{g}</text>
                </g>
              ))}
              {data.map((d, i) => {
                const bw = ((W - 36) / data.length) * 0.36;
                const x = 30 + (i + 0.5) * ((W - 36) / data.length) - bw;
                const ha = (d.a / max) * (H - 30);
                const hb = (d.b / max) * (H - 30);
                return (
                  <g key={d.m}>
                    <rect x={x} y={H - 18 - ha} width={bw} height={ha} fill="var(--ink)" />
                    <rect x={x + bw + 1} y={H - 18 - hb} width={bw} height={hb} fill="var(--accent)" />
                    <text x={x + bw + 1} y={H - 6} fontSize="8" fill="var(--muted)" fontFamily="var(--font-mono)" textAnchor="middle">{d.m}</text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink2)' }}><span style={{ width: 8, height: 8, background: 'var(--ink)' }} />Göteborg</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink2)' }}><span style={{ width: 8, height: 8, background: 'var(--accent)' }} />Malmö</span>
            </div>
          </div>

          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 17, lineHeight: 1.35, margin: '18px 0 10px', textWrap: 'pretty' }}>
            Hur många månader hade Malmö högre nederbörd än Göteborg?
          </p>
          <Stack gap="6px">
            {[
              { k: 'A', l: '0' },
              { k: 'B', l: '1' },
              { k: 'C', l: '2' },
              { k: 'D', l: '3' },
            ].map((o) => {
              const on = selected === o.k;
              return (
                <button key={o.k} onClick={() => onSelect && onSelect(o.k)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: on ? 'var(--panel2)' : 'var(--panel)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  color: 'var(--ink)', fontSize: 14,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: on ? 'var(--ink)' : 'var(--muted)', width: 14 }}>{o.k}</span>
                  {o.l}
                </button>
              );
            })}
          </Stack>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', borderTop: '1px solid var(--hairline)', marginTop: 10 }}>
          <button onClick={onFormulaSheet} title="Formelblad" style={{ background: 'var(--panel2)', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><I.fn s={16}/></button>
          <button onClick={onScratchpad} title="Kladdpapper" style={{ background: 'var(--panel2)', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><I.pencil s={16}/></button>
          <button onClick={onCmdK} title="Cmd+K" style={{ background: 'var(--panel2)', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><I.search s={16}/></button>
          <div style={{ flex: 1 }} />
          <Btn variant="primary" size="md" disabled={!selected} onClick={() => onAnswer && onAnswer(selected)} trailing={<I.arrowRight s={13}/>}>Svara</Btn>
        </div>
      </div>
    </Phone>
  );
}

// 2 — Diagnostic in-exam (Q1 of 80, big timer, no chrome) ------------------
function ScrDiagnostic() {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 16px' }}>
          <div>
            <Mono size={10}>Verbal halva · ORD</Mono>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>1 / 80</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Mono size={10}>Kvar</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>2:38:14</div>
          </div>
        </div>
        <div style={{ height: 2, background: 'var(--hairline)', borderRadius: 1, marginBottom: 28 }}>
          <div style={{ width: '1.25%', height: '100%', background: 'var(--ink)' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Mono size={10}>Synonym</Mono>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 44, lineHeight: 1.05, margin: '14px 0 32px' }}>perdurabel</div>

          <Stack gap="8px">
            {['evig', 'oviktig', 'genomtänkt', 'oklar', 'flyktig'].map((o, i) => (
              <button key={o} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 12,
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', textAlign: 'left', fontSize: 15,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', width: 14 }}>{String.fromCharCode(65 + i)}</span>
                {o}
              </button>
            ))}
          </Stack>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--hairline)', marginTop: 14 }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Markera</button>
          <Btn variant="primary" size="md" trailing={<I.arrowRight s={13}/>}>Nästa</Btn>
        </div>
      </div>
    </Phone>
  );
}

// 3 — Diagnostic results ---------------------------------------------------
function ScrDiagResults({ onNext }) {
  const sections = [
    { code: 'ORD', label: 'Synonymer', score: 12, max: 40 },
    { code: 'LÄS', label: 'Svensk läsförståelse', score: 8, max: 20 },
    { code: 'MEK', label: 'Meningskomplettering', score: 5, max: 20 },
    { code: 'ELF', label: 'English Reading', score: 6, max: 20 },
    { code: 'XYZ', label: 'Algebra', score: 4, max: 12 },
    { code: 'KVA', label: 'Kvant. jämförelser', score: 3, max: 12 },
    { code: 'NOG', label: 'Datatillräcklighet', score: 2, max: 12 },
    { code: 'DTK', label: 'Diagram & tabeller', score: 5, max: 12 },
  ];
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 22px', overflow: 'auto' }}>
        <Eyebrow>Diagnostik klar</Eyebrow>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.05, fontSize: 38, margin: '8px 0 4px', textWrap: 'balance' }}>0,4</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px' }}>uppskattat normerat resultat (0,0–2,0)</p>

        <div style={{ padding: 'var(--pad-lg)', background: 'var(--panel2)', borderRadius: 'var(--radius)', marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink2)' }}>
            Du börjar nära golvet, vilket är förväntat. Vi prioriterar ORD och KVA först — där finns mest att hämta. Plan klar för 30 dagar.
          </p>
        </div>

        <Eyebrow style={{ marginBottom: 10 }}>Per sektion</Eyebrow>
        <Stack gap="10px" style={{ marginBottom: 24 }}>
          {sections.map((s) => {
            const pct = s.score / s.max;
            return (
              <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, width: 36, color: 'var(--ink2)' }}>{s.code}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--hairline2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct * 100}%`, height: '100%', background: pct < 0.4 ? 'var(--bad)' : pct < 0.7 ? 'var(--warn)' : 'var(--ok)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)', width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.score}/{s.max}</span>
              </div>
            );
          })}
        </Stack>

        <Btn variant="primary" size="lg" full onClick={onNext}>Visa min plan</Btn>
      </div>
    </Phone>
  );
}

// 4 — Daily home (LAYOUT VARIANTS) -----------------------------------------
function ScrHomeMobile({ onContinue, layout = 'editorial', streak = false, voice, coach = 'taktiker' }) {
  voice = voice || (window.VOICE && window.VOICE.taktiker);
  const todayLine = voice.homeLine;
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 88 }}>
        <div style={{ padding: '20px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Mono>Onsdag · 6 maj</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>172 dagar kvar · höstprov 26</div>
          </div>
          {streak && (
            <div style={{ padding: '4px 8px', border: '1px solid var(--hairline)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink2)' }}>14 dagar</div>
          )}
        </div>

        {layout === 'editorial' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px' }}>
            <window.CoachLine coach={coach} as="headline" style={{ marginBottom: 20 }}>{todayLine}</window.CoachLine>
            <Btn variant="primary" size="xl" full onClick={onContinue} style={{ height: 72, fontSize: 19 }}>{voice.cta}</Btn>
            <button style={{ alignSelf: 'flex-end', marginTop: 14, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Avancerat</button>
          </div>
        )}

        {layout === 'minimal' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 22px', textAlign: 'center' }}>
            <Mono>Idag · 45 min totalt</Mono>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 84, lineHeight: 1, margin: '16px 0 6px', fontVariantNumeric: 'tabular-nums' }}>10·30·5</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32, maxWidth: '28ch', lineHeight: 1.45 }}>ORD repetition · KVA grunder · repetera gårdagens fel</div>
            <Btn variant="primary" size="xl" full onClick={onContinue} style={{ height: 64 }}>Fortsätt</Btn>
            <button style={{ marginTop: 14, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Avancerat</button>
          </div>
        )}

        {layout === 'agenda' && (
          <div style={{ flex: 1, padding: '20px 22px 0', display: 'flex', flexDirection: 'column' }}>
            <Eyebrow>Idag</Eyebrow>
            <Stack gap="10px" style={{ marginTop: 12 }}>
              {[
                { t: '10 min', l: 'ORD repetition', sub: '12 kort', done: false },
                { t: '30 min', l: 'KVA grunder', sub: 'Lektion 3 av 8', done: false },
                { t: '5 min', l: 'Repetera gårdagens fel', sub: '3 frågor', done: false },
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, border: '1.5px solid var(--hairline)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{it.l}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.sub}</div>
                  </div>
                  <Mono size={11}>{it.t}</Mono>
                </div>
              ))}
            </Stack>
            <div style={{ flex: 1 }} />
            <Btn variant="primary" size="lg" full onClick={onContinue}>Fortsätt</Btn>
          </div>
        )}
      </div>
      <BottomTabs active="home" />
    </Phone>
  );
}

// 5 — Section onboarding (one-time per section) ----------------------------
function ScrSectionOnboard({ onStart, onL1, voice, coach = 'taktiker' }) {
  voice = voice || (window.VOICE && window.VOICE.taktiker);
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 24px 24px', overflow: 'auto' }}>
        <Mono>Ny sektion · KVA</Mono>
        <window.CoachLine coach={coach} as="headline" style={{ margin: '10px 0 14px' }}>{voice.sectionOnboard}</window.CoachLine>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink2)', margin: '0 0 18px' }}>
          12 frågor på provet. Du jämför två storheter A och B. Svar är alltid ett av fyra: <strong>A&nbsp;&gt;&nbsp;B · B&nbsp;&gt;&nbsp;A · A&nbsp;=&nbsp;B · går ej att avgöra</strong>.
        </p>

        <div style={{ padding: 'var(--pad-lg)', background: 'var(--panel2)', borderRadius: 'var(--radius)', marginBottom: 14 }}>
          <Eyebrow>Unik logik</Eyebrow>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink2)' }}>
            "Går ej att avgöra" är ett riktigt svar, inte en utväg. Använd det när minst ett scenario ger A&nbsp;&gt;&nbsp;B och ett annat ger B&nbsp;&gt;&nbsp;A.
          </p>
        </div>

        <div style={{ padding: 'var(--pad-lg)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Eyebrow>Vanligaste fällan</Eyebrow>
            <L1Chip id="KVA-NEG-001" onClick={onL1} />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink2)' }}>
            Negativa tal i kvadrat. Antagandet att x² alltid är större än x bryter samman när -1&nbsp;&lt;&nbsp;x&nbsp;&lt;&nbsp;0.
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />
        <Btn variant="primary" size="lg" full onClick={onStart}>Okej, börja.</Btn>
      </div>
    </Phone>
  );
}

// 6 — Lesson card ----------------------------------------------------------
function ScrLesson({ onNext }) {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Mono>ORD · Lektion 4/12</Mono>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,1,1,1,0,0,0,0,0,0,0,0].map((x, i) => (
              <span key={i} style={{ width: 14, height: 2, background: x ? 'var(--ink)' : 'var(--hairline)' }} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '38ch' }}>
          <Eyebrow>Latinsk rot</Eyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.1, fontSize: 56, margin: '8px 0 0' }}>cur-</h1>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', fontStyle: 'italic', fontSize: 22, color: 'var(--muted)', margin: '4px 0 28px' }}>att löpa, att flöda</p>

          <Stack gap="14px">
            {[
              { w: 'kurir', def: 'budbärare som löper med post' },
              { w: 'rekursion', def: 'att löpa tillbaka — ett mönster som upprepar sig' },
              { w: 'kursiv', def: 'löpande skrift, lutande och flödande' },
            ].map((e) => (
              <div key={e.w} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 19, minWidth: 92 }}>{e.w}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.45 }}>{e.def}</div>
              </div>
            ))}
          </Stack>
        </div>

        <Btn variant="primary" size="lg" full onClick={onNext} trailing={<I.arrowRight s={14}/>}>Förstått?</Btn>
      </div>
    </Phone>
  );
}

// 7 — Drill question -------------------------------------------------------
function ScrDrill({ onAnswer, selected, onSelect, onCmdK, onFormulaSheet, onScratchpad }) {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 14px' }}>
          <div>
            <Mono size={10}>KVA · Övning</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Fråga 7 · pass 1/3</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Mono size={10}>Tid</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>00:48</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 21, lineHeight: 1.3, margin: '0 0 14px', textWrap: 'pretty' }}>
            Låt x vara ett tal sådant att −1 &lt; x &lt; 0. Jämför.
          </p>
          <div style={{ padding: 14, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 12, marginBottom: 22, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Mono size={10}>Storhet A</Mono>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, marginTop: 4 }}>x²</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--hairline)' }} />
            <div style={{ textAlign: 'center' }}>
              <Mono size={10}>Storhet B</Mono>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, marginTop: 4 }}>x</div>
            </div>
          </div>

          <Stack gap="6px">
            {[
              { k: 'A', l: 'A är större än B' },
              { k: 'B', l: 'B är större än A' },
              { k: 'C', l: 'A är lika med B' },
              { k: 'D', l: 'Går ej att avgöra' },
            ].map((o) => {
              const on = selected === o.k;
              return (
                <button key={o.k} onClick={() => onSelect && onSelect(o.k)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  background: on ? 'var(--panel2)' : 'var(--panel)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                  borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  color: 'var(--ink)', fontSize: 14.5,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: on ? 'var(--ink)' : 'var(--muted)', width: 14 }}>{o.k}</span>
                  {o.l}
                </button>
              );
            })}
          </Stack>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', borderTop: '1px solid var(--hairline)', marginTop: 14 }}>
          <button onClick={onFormulaSheet} title="Formelblad" style={{ background: 'var(--panel2)', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><I.fn s={16}/></button>
          <button onClick={onScratchpad} title="Kladdpapper" style={{ background: 'var(--panel2)', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><I.pencil s={16}/></button>
          <button onClick={onCmdK} title="Cmd+K" style={{ background: 'var(--panel2)', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><I.search s={16}/></button>
          <div style={{ flex: 1 }} />
          <Btn variant="primary" size="md" disabled={!selected} onClick={() => onAnswer && onAnswer(selected)} trailing={<I.arrowRight s={13}/>}>Svara</Btn>
        </div>
      </div>
    </Phone>
  );
}

// 8 — Post-answer feedback -------------------------------------------------
function ScrFeedback({ onNext, onL1, correct = false }) {
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 14px' }}>
          <Mono size={10}>KVA · Fråga 7</Mono>
          <Mono size={10}>00:48 · använd</Mono>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: correct ? 'var(--okSoft)' : 'var(--badSoft)',
            color: correct ? 'var(--ok)' : 'var(--bad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {correct ? <I.check s={26}/> : <I.x s={26}/>}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', fontSize: 28, lineHeight: 1, letterSpacing: 'var(--font-display-track)' }}>{correct ? 'Rätt' : 'Fel'}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Rätt svar: <strong style={{ color: 'var(--ink)' }}>D · Går ej att avgöra</strong></div>
          </div>
        </div>

        <div style={{ padding: 'var(--pad-lg)', background: 'var(--panel2)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink2)' }}>
            Detta är en KVA-fälla av typen <L1Chip id="KVA-NEG-001" onClick={onL1} /> — när x kan vara negativt eller mellan 0 och 1, ändrar kvadrering rangordningen.
          </p>
          <Stack gap="4px" style={{ marginTop: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)' }}>x = -0.5 → x² = 0.25 &gt; x</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)' }}>x = -2 → x² = 4 &gt; x</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)' }}>x = 0.5 → x² = 0.25 &lt; x</div>
          </Stack>
        </div>

        <details style={{ padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 12 }}>
          <summary style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <I.chevR s={12}/> Varför inte de andra?
          </summary>
          <Stack gap="8px" style={{ marginTop: 10 }}>
            {[
              { k: 'A', why: 'Sant för x = -0.5, men ej när x ∈ (0, 1).' },
              { k: 'B', why: 'Sant när x ∈ (0, 1) — men inte annars.' },
              { k: 'C', why: 'Endast för x = 0 och x = 1, inte i hela intervallet.' },
            ].map((d) => (
              <div key={d.k} style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.45 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginRight: 6 }}>{d.k}</span>{d.why}
              </div>
            ))}
          </Stack>
        </details>

        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
          <Btn variant="primary" size="lg" full onClick={onNext} trailing={<I.arrowRight s={14}/>}>Nästa fråga</Btn>
        </div>
      </div>
    </Phone>
  );
}

// 9 — Adaptive review interrupt (bottom sheet) -----------------------------
function ScrAdaptive({ onAccept, onSkip, onL1, voice, coach = 'taktiker' }) {
  voice = voice || (window.VOICE && window.VOICE.taktiker);
  return (
    <Phone>
      {/* dimmed background */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,10,0.42)' }} />
      {/* faint silhouette of drill */}
      <div style={{ position: 'absolute', inset: 0, padding: 22, opacity: 0.18 }}>
        <div style={{ height: 14, width: 90, background: 'var(--ink)', borderRadius: 4 }} />
        <div style={{ height: 28, width: 200, background: 'var(--ink)', borderRadius: 4, marginTop: 12 }} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--panel)', borderRadius: '20px 20px 0 0', padding: 'var(--pad-lg) 22px 22px', boxShadow: '0 -10px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 36, height: 4, background: 'var(--hairline)', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <I.alert s={14} />
          <Mono size={10}>Adaptiv repetition</Mono>
        </div>
        <window.CoachLine coach={coach} as="title" style={{ margin: '4px 0 10px' }}>
          {voice.adaptive.split('KVA-NEG-001').map((part, i) => i === 0 ? part : <React.Fragment key={i}><L1Chip id="KVA-NEG-001" onClick={onL1} />{part}</React.Fragment>)}
        </window.CoachLine>
        <Stack gap="8px" style={{ marginBottom: 16 }}>
          {[
            ['Mini-lektion', '90 sek'],
            ['5 riktade frågor', '~3 min'],
            ['Tillbaka till pass', 'automatiskt'],
          ].map(([l, r]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink2)' }}>
              <span>{l}</span>
              <Mono size={11}>{r}</Mono>
            </div>
          ))}
        </Stack>
        <Stack gap="8px">
          <Btn variant="primary" size="lg" full onClick={onAccept}>Kör nu</Btn>
          <Btn variant="ghost" size="md" full onClick={onSkip}>Påminn mig efter passet</Btn>
        </Stack>
      </div>
    </Phone>
  );
}

// 10 — Session end ---------------------------------------------------------
function ScrSessionEnd({ onHome, voice, coach = 'taktiker' }) {
  voice = voice || (window.VOICE && window.VOICE.taktiker);
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 24px 24px' }}>
        <Mono>Pass slut · 28 min</Mono>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.05, fontSize: 64, margin: '20px 0 0' }}>Klart.</h1>
        <window.CoachLine coach={coach} as="body" style={{ margin: '14px 0 32px', maxWidth: '32ch' }}>{voice.sessionEnd}</window.CoachLine>

        <div style={{ padding: 'var(--pad-lg)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)' }}>
          <Eyebrow>Detaljer</Eyebrow>
          <Stack gap="10px" style={{ marginTop: 10 }}>
            {[
              ['KVA · grunder', '12/15'],
              ['ORD · repetition', '5/8'],
              ['Tid på fel svar', '2:14 medel'],
              ['Nya fällor markerade', '1'],
            ].map(([l, r]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--ink2)' }}>
                <span>{l}</span>
                <Mono size={12}>{r}</Mono>
              </div>
            ))}
          </Stack>
        </div>

        <div style={{ flex: 1 }} />
        <Btn variant="primary" size="lg" full onClick={onHome}>Stäng</Btn>
      </div>
    </Phone>
  );
}

// Edge state — empty mistake queue, no-cards-due, mock-aborted, offline ----
function ScrEdge({ kind = 'empty' }) {
  const states = {
    empty: { title: 'Inga fel att repetera.', body: 'Ren vecka. Du har antingen pluggat bra — eller inte tagit några pass. Kör nästa lektion när du är redo.', cta: 'Nästa lektion', mono: 'Felkö · 0' },
    nocards: { title: 'Inget ORD att repetera idag.', body: 'Repetitionsalgoritmen säger att du är à jour. Kör nästa pass direkt — eller pausa.', cta: 'Kör nästa pass', mono: 'SRS · 0 kort' },
    aborted: { title: 'Mocken avbröts.', body: 'Du gjorde 34 av 80 frågor på 71 min. Rätta det du hann eller släng — ingen poäng räknas på halva mockar.', cta: 'Rätta det du hann', mono: 'Mock · 34 / 80' },
    offline: { title: 'Du är offline.', body: 'Du kan plugga som vanligt. Resultaten synkar när du är online igen — vi tappar inget.', cta: 'Fortsätt', mono: 'PWA · ej synkad' },
  };
  const s = states[kind];
  const Icon = kind === 'offline' ? I.wifi : kind === 'aborted' ? I.alert : kind === 'nocards' ? I.book : I.check;
  return (
    <Phone>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 24px 24px' }}>
        <Mono>Tom-tillstånd</Mono>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--panel2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)', marginBottom: 18 }}>
            <Icon s={22} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.1, fontSize: 30, margin: 0, textWrap: 'balance' }}>{s.title}</h1>
          <p style={{ fontSize: 14.5, color: 'var(--ink2)', lineHeight: 1.5, margin: '12px 0 0', maxWidth: '34ch' }}>{s.body}</p>
          <Mono style={{ marginTop: 24 }}>{s.mono}</Mono>
        </div>
        <Btn variant="primary" size="lg" full>{s.cta}</Btn>
      </div>
      <BottomTabs active="home" />
    </Phone>
  );
}

Object.assign(window, {
  Phone, ScrOnboard, ScrDiagnostic, ScrDiagResults, ScrHomeMobile,
  ScrSectionOnboard, ScrLesson, ScrDrill, ScrFeedback, ScrAdaptive,
  ScrSessionEnd, ScrEdge, ScrDiagPre, ScrDiagDone, ScrDrillDTK,
});
