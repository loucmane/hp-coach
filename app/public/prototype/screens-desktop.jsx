// screens-desktop.jsx — HP-Coach desktop artboards (1280×820)
// Each screen wrapped in <Desk> = sidebar + main canvas.

const Desk = ({ active = 'home', onCmdK, children, noChrome = false, dark = false }) => (
  <div style={{ width: 1280, height: 820, background: 'var(--bg)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
    {!noChrome && <Sidebar active={active} onOpenCmdK={onCmdK} />}
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
  </div>
);

// Daily home — desktop
function DskHome({ onContinue, onCmdK, streak = false, voice, coach = 'taktiker' }) {
  voice = voice || (window.VOICE && window.VOICE.taktiker);
  return (
    <Desk active="home" onCmdK={onCmdK}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '60px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Mono>Onsdag · 6 maj 2026</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>172 dagar kvar · höstprov 26 · uppskattat resultat 1,3</div>
          </div>
          {streak && <div style={{ padding: '4px 10px', border: '1px solid var(--hairline)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>14 dagar i rad</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 760 }}>
          <Eyebrow>Idag</Eyebrow>
          <window.CoachLine coach={coach} as="headline" style={{ margin: '12px 0 28px' }}>{voice.homeLine}</window.CoachLine>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Btn variant="primary" size="xl" onClick={onContinue} style={{ minWidth: 240 }}>{voice.cta}</Btn>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>~45 min totalt · pausa när du vill</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
          <Mono>förra passet · igår 18:42 · 23 frågor · 17 rätt</Mono>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Avancerat</button>
        </div>
      </div>
    </Desk>
  );
}

// Drill — desktop (with side rails for scratchpad/formulas)
function DskDrill({ onAnswer, selected, onSelect, onCmdK, onL1 }) {
  return (
    <Desk active="drill" onCmdK={onCmdK}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)' }}>
          <div>
            <Mono>KVA · Pass 1 av 3 · Fråga 7</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Mono size={11}>Tid {' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>00:48</span></Mono>
            <button style={{ background: 'var(--panel2)', border: 'none', padding: '6px 10px', borderRadius: 6, fontFamily: 'inherit', fontSize: 12, color: 'var(--ink2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><I.focus s={13}/> Fokusläge ⌘.</button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1, padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 760 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 26, lineHeight: 1.3, margin: '0 0 22px', textWrap: 'pretty' }}>
              Låt x vara ett tal sådant att −1 &lt; x &lt; 0. Jämför.
            </p>
            <div style={{ padding: 18, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 12, marginBottom: 28, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <Mono size={10}>Storhet A</Mono>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, marginTop: 6 }}>x²</div>
              </div>
              <div style={{ width: 1, height: 40, background: 'var(--hairline)' }} />
              <div style={{ textAlign: 'center' }}>
                <Mono size={10}>Storhet B</Mono>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, marginTop: 6 }}>x</div>
              </div>
            </div>
            <Stack gap="6px">
              {[
                { k: '1', l: 'A är större än B' },
                { k: '2', l: 'B är större än A' },
                { k: '3', l: 'A är lika med B' },
                { k: '4', l: 'Går ej att avgöra' },
              ].map((o) => {
                const on = selected === o.k;
                return (
                  <button key={o.k} onClick={() => onSelect && onSelect(o.k)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: on ? 'var(--panel2)' : 'var(--panel)',
                    border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    color: 'var(--ink)', fontSize: 14.5,
                  }}>
                    <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', background: 'var(--bg)', border: '1px solid var(--hairline)', borderRadius: 4, color: 'var(--muted)' }}>{o.k}</kbd>
                    {o.l}
                  </button>
                );
              })}
            </Stack>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 14 }}>
                <span><Mono size={10}>1–4</Mono> välj</span>
                <span><Mono size={10}>↵</Mono> svara</span>
                <span><Mono size={10}>?</Mono> formelblad</span>
                <span><Mono size={10}>esc</Mono> ⌘K</span>
              </div>
              <Btn variant="primary" size="md" disabled={!selected} onClick={() => onAnswer && onAnswer(selected)} trailing={<I.enter s={12}/>}>Svara</Btn>
            </div>
          </div>
          <div style={{ width: 320, borderLeft: '1px solid var(--hairline)', padding: 24, display: 'flex', flexDirection: 'column', gap: 22, background: 'var(--panel)' }}>
            <div>
              <Eyebrow>Kladdpapper</Eyebrow>
              <div style={{ marginTop: 10, minHeight: 160, padding: 12, border: '1px dashed var(--hairline)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink2)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
{`x = -0.5
x² = 0.25
0.25 > -0.5 ✓

x = -2
x² = 4
4 > -2 ✓`}
                <div style={{ marginTop: 8, color: 'var(--muted)' }}>men x ∈ (-1, 0)…</div>
              </div>
            </div>
            <div>
              <Eyebrow>Formelblad ?</Eyebrow>
              <Stack gap="6px" style={{ marginTop: 10 }}>
                {['Kvadrering: a² ≥ 0 alltid', 'Bråkregler: a/b · c/d = ac/bd', 'Pythagoras: a² + b² = c²'].map((f, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '7px 10px', color: 'var(--ink2)', borderRadius: 6, background: 'var(--panel2)', lineHeight: 1.4 }}>{f}</div>
                ))}
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </Desk>
  );
}

// Lesson — desktop (full reading column)
function DskLesson({ onNext, onCmdK }) {
  return (
    <Desk active="drill" onCmdK={onCmdK}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 0', overflow: 'auto' }}>
        <div style={{ padding: '0 80px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mono>ORD · Lektion 4 av 12 · Latinska rötter</Mono>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,1,1,1,0,0,0,0,0,0,0,0].map((x, i) => (
              <span key={i} style={{ width: 24, height: 2, background: x ? 'var(--ink)' : 'var(--hairline)' }} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: '20px 80px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
          <Eyebrow>Latinsk rot</Eyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', lineHeight: 1.05, fontSize: 96, margin: '6px 0 0' }}>cur-</h1>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, color: 'var(--muted)', margin: '6px 0 36px' }}>att löpa, att flöda</p>

          <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink2)', margin: '0 0 24px', maxWidth: '60ch' }}>
            Roten finns i en lång rad svenska och engelska låneord. Tre ankarord — kurir, rekursion, kursiv — täcker mönstret. När du ser cur-/curr-, fråga: handlar det om att löpa eller flöda?
          </p>

          <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 20 }}>
            <Stack gap="18px">
              {[
                { w: 'kurir', def: 'budbärare som löper med post', ety: 'fr. courrier · 1500-tal' },
                { w: 'rekursion', def: 'att löpa tillbaka — ett mönster som upprepar sig', ety: 'lat. recurrere · matematik/lingvistik' },
                { w: 'kursiv', def: 'löpande skrift, lutande och flödande', ety: 'lat. cursivus · typografi' },
                { w: 'exkursion', def: 'utflykt — att löpa ut från en plats', ety: 'lat. excurrere' },
              ].map((e) => (
                <div key={e.w} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px', gap: 18, alignItems: 'baseline' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22 }}>{e.w}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.5 }}>{e.def}</div>
                  <Mono size={11}>{e.ety}</Mono>
                </div>
              ))}
            </Stack>
          </div>

          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="primary" size="lg" onClick={onNext} trailing={<I.arrowRight s={14}/>}>Förstått?</Btn>
          </div>
        </div>
      </div>
    </Desk>
  );
}

// Weekly progress — full dashboard
function DskProgress({ onCmdK, onL1 }) {
  const W = 580, H = 200;
  const trend = [0.4, 0.5, 0.55, 0.7, 0.8, 0.95, 1.05, 1.1, 1.2, 1.25, 1.3, 1.32, 1.4, 1.45, 1.5];
  const path = trend.map((v, i) => `${(i / (trend.length - 1)) * (W - 40) + 20},${H - 20 - (v / 2.0) * (H - 40)}`).join(' ');
  const sections = [
    { code: 'ORD', mast: 0.78 }, { code: 'LÄS', mast: 0.62 }, { code: 'MEK', mast: 0.55 }, { code: 'ELF', mast: 0.71 },
    { code: 'XYZ', mast: 0.48 }, { code: 'KVA', mast: 0.36 }, { code: 'NOG', mast: 0.41 }, { code: 'DTK', mast: 0.58 },
  ];
  return (
    <Desk active="progress" onCmdK={onCmdK}>
      <div style={{ height: '100%', overflow: 'auto', padding: '40px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <Mono>Veckorapport</Mono>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 36, margin: '6px 0 0', lineHeight: 1.1 }}>Vecka 19 · 28 apr – 4 maj</h1>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              ['Tid pluggad', '4t 12m'],
              ['Frågor', '184'],
              ['Träffsäkerhet', '71%'],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'right' }}>
                <Mono size={10}>{l}</Mono>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 24 }}>
          <Card padded>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <Eyebrow>Uppskattat resultat över tid</Eyebrow>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>1,5 <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>/ 2,0</span></div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
              {/* gridlines */}
              {[0.5, 1.0, 1.5, 2.0].map((g) => (
                <g key={g}>
                  <line x1="20" x2={W - 20} y1={H - 20 - (g / 2.0) * (H - 40)} y2={H - 20 - (g / 2.0) * (H - 40)} stroke="var(--hairline)" strokeDasharray="2 3" />
                  <text x="0" y={H - 16 - (g / 2.0) * (H - 40)} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)">{g.toFixed(1)}</text>
                </g>
              ))}
              {/* target line */}
              <line x1="20" x2={W - 20} y1={H - 20 - (1.8 / 2.0) * (H - 40)} y2={H - 20 - (1.8 / 2.0) * (H - 40)} stroke="var(--accent)" strokeDasharray="3 3" opacity="0.5" />
              <text x={W - 60} y={H - 24 - (1.8 / 2.0) * (H - 40)} fontSize="9" fill="var(--accent)" fontFamily="var(--font-mono)">mål 1,8</text>
              {/* trend */}
              <polyline fill="none" stroke="var(--ink)" strokeWidth="1.6" points={path} />
              {trend.map((v, i) => (
                <circle key={i} cx={(i / (trend.length - 1)) * (W - 40) + 20} cy={H - 20 - (v / 2.0) * (H - 40)} r="2.4" fill="var(--ink)" />
              ))}
              {/* x labels */}
              {['v15', 'v17', 'v19'].map((l, i) => (
                <text key={l} x={20 + ((i * 7) / 14) * (W - 40)} y={H - 4} fontSize="9" fill="var(--muted)" fontFamily="var(--font-mono)" textAnchor="middle">{l}</text>
              ))}
            </svg>
          </Card>
          <Card padded>
            <Eyebrow>Sektionsmästring</Eyebrow>
            <Stack gap="10px" style={{ marginTop: 10 }}>
              {sections.map((s) => (
                <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, width: 32, color: 'var(--ink2)' }}>{s.code}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--hairline2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${s.mast * 100}%`, height: '100%', background: s.mast < 0.4 ? 'var(--bad)' : s.mast < 0.7 ? 'var(--warn)' : 'var(--ok)' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(s.mast * 100)}%</span>
                </div>
              ))}
            </Stack>
          </Card>
        </div>

        <Card padded>
          <Eyebrow>Topp 5 svagaste mönster</Eyebrow>
          <Stack gap="0px" style={{ marginTop: 10 }}>
            {[
              { id: 'KVA-NEG-001', label: 'Negativa tal i kvadrat', acc: 36, n: 14 },
              { id: 'NOG-EQS-002', label: 'Kombinera ekvationer utan att lösa', acc: 54, n: 11 },
              { id: 'MEK-NEG-DBL-001', label: 'Dubbel negation', acc: 67, n: 6 },
              { id: 'ORD-LAT-CUR-001', label: 'Latinska roten cur-', acc: 75, n: 8 },
              { id: 'DTK-AXES-001', label: 'Logaritmisk vs linjär axel', acc: 50, n: 4 },
            ].map((r, i) => (
              <button key={r.id} onClick={() => onL1 && onL1(r.id)} style={{
                display: 'grid', gridTemplateColumns: '24px 200px 1fr 80px 60px',
                gap: 16, alignItems: 'center', padding: '14px 4px',
                borderTop: i ? '1px solid var(--hairline)' : 'none',
                background: 'transparent', border: 'none', borderRadius: 0,
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)', textAlign: 'left',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{i + 1}</span>
                <L1Chip id={r.id} onClick={onL1} />
                <span style={{ fontSize: 13.5, color: 'var(--ink2)' }}>{r.label}</span>
                <div style={{ height: 4, background: 'var(--hairline2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${r.acc}%`, height: '100%', background: r.acc < 50 ? 'var(--bad)' : r.acc < 70 ? 'var(--warn)' : 'var(--ok)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink2)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.acc}% · {r.n}×</span>
              </button>
            ))}
          </Stack>
        </Card>
      </div>
    </Desk>
  );
}

// Mock exam — desktop full 4h
function DskMock({ onCmdK }) {
  return (
    <Desk noChrome>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)' }}>
          <div>
            <Mono>Fullständigt prov · 4 h</Mono>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Pass 2 av 4 · KVA + NOG + DTK</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Mono size={10}>Återstår</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 500, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginTop: 4 }}>2:14:08</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Mono size={10}>Fråga</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, marginTop: 4 }}>27 / 80</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1, padding: '60px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 760 }}>
            <Mono size={10}>NOG · Datatillräcklighet</Mono>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 22, lineHeight: 1.4, margin: '12px 0 14px', textWrap: 'pretty' }}>
              I en låda finns röda och blå kulor. Hur många kulor finns det totalt?
            </p>
            <Stack gap="6px" style={{ marginBottom: 18, fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--ink2)' }}>
              <div>(1) 30 % av kulorna är röda.</div>
              <div>(2) Det finns 12 fler blå kulor än röda.</div>
            </Stack>
            <Stack gap="6px">
              {[
                'Påstående (1) ensamt är tillräckligt.',
                'Påstående (2) ensamt är tillräckligt.',
                '(1) och (2) tillsammans är tillräckliga.',
                'Vart och ett ensamt är tillräckligt.',
                'Informationen räcker inte.',
              ].map((l, i) => (
                <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--ink)', fontSize: 14 }}>
                  <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 5px', background: 'var(--bg)', border: '1px solid var(--hairline)', borderRadius: 4, color: 'var(--muted)' }}>{i + 1}</kbd>
                  {l}
                </button>
              ))}
            </Stack>
          </div>
          <div style={{ width: 280, borderLeft: '1px solid var(--hairline)', padding: 24, background: 'var(--panel)' }}>
            <Eyebrow>Översikt</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginTop: 12 }}>
              {Array.from({ length: 80 }, (_, i) => {
                const ans = i < 26;
                const cur = i === 26;
                const flag = [3, 11, 19].includes(i);
                return <span key={i} style={{ aspectRatio: '1', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 9, color: cur ? 'var(--bg)' : 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cur ? 'var(--ink)' : ans ? 'var(--panel2)' : 'transparent', border: '1px solid var(--hairline)', position: 'relative' }}>{i + 1}{flag && <span style={{ position: 'absolute', top: -2, right: -2, width: 5, height: 5, borderRadius: 3, background: 'var(--accent)' }} />}</span>;
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14, lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: 'var(--ink)' }} /> nuvarande</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: 'var(--panel2)', border: '1px solid var(--hairline)' }} /> svarad</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent)' }} /> markerad</div>
            </div>
          </div>
        </div>
      </div>
    </Desk>
  );
}

// Settings — desktop ("Avancerat", hidden by default)
function DskSettings({ onCmdK }) {
  return (
    <Desk active="settings" onCmdK={onCmdK}>
      <div style={{ height: '100%', overflow: 'auto', padding: '40px 60px', maxWidth: 820 }}>
        <Mono>Avancerat</Mono>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 36, margin: '6px 0 6px' }}>Inställningar</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 28px', maxWidth: '52ch' }}>Standardvärden är medvetet återhållsamma. Aktivera bara det du faktiskt behöver.</p>

        <Stack gap="28px">
          {[
            { title: 'Tidshantering', items: [
              { l: 'Pass-typ', v: 'Flex med minimi-pass · 10 min', opts: ['Flex med min', 'Pomodoro', 'Mål-tid'] },
              { l: 'Dagligt mål', v: '40 min' },
              { l: 'Pomodoro-längd', v: '25 / 5 min' },
            ]},
            { title: 'Pedagogik', items: [
              { l: 'Variation', v: 'Auto', opts: ['Auto', 'Blockerad', 'Interfolierad'] },
              { l: 'Adaptiv repetition', v: 'På · efter 3 fel inom 7 dagar', toggle: true },
              { l: 'Coachpersonlighet', v: 'Taktiker', opts: ['Kompis', 'Professor', 'Taktiker'] },
            ]},
            { title: 'Tema & utseende', items: [
              { l: 'Palett', v: 'Sand', opts: ['Sand', 'Sage', 'Ink', 'Rose'] },
              { l: 'Mörkt läge', v: 'Av', toggle: true },
              { l: 'Typografi', v: 'Literary' },
              { l: 'Densitet', v: 'Regular' },
              { l: 'Reduce motion', v: 'Följ system', toggle: true },
            ]},
            { title: 'Gamification (avrådes från)', items: [
              { l: 'Streak-räknare', v: 'Av', toggle: true, sub: 'Ingen daglig påminnelse. Inget visuellt avdrag.' },
              { l: 'Badges & coins', v: 'Av', toggle: true, sub: 'Permanent borttaget ur denna app.' },
            ]},
            { title: 'Data', items: [
              { l: 'Exportera som JSON', v: '↓', btn: true },
              { l: 'Importera', v: '↑', btn: true },
              { l: 'Radera all data', v: 'Radera', btn: true, danger: true },
            ]},
          ].map((g) => (
            <div key={g.title}>
              <Eyebrow>{g.title}</Eyebrow>
              <div style={{ marginTop: 12, border: '1px solid var(--hairline)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {g.items.map((it, i) => (
                  <div key={it.l} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', borderTop: i ? '1px solid var(--hairline)' : 'none',
                    background: 'var(--panel)',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{it.l}</div>
                      {it.sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{it.sub}</div>}
                    </div>
                    {it.toggle ? (
                      <span style={{ width: 32, height: 18, borderRadius: 9, background: it.v === 'På' ? 'var(--ok)' : 'var(--hairline)', position: 'relative' }}>
                        <span style={{ position: 'absolute', width: 14, height: 14, background: 'var(--panel)', borderRadius: 7, top: 2, left: it.v === 'På' ? 16 : 2, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
                      </span>
                    ) : it.btn ? (
                      <button style={{ background: it.danger ? 'transparent' : 'var(--panel2)', border: it.danger ? '1px solid var(--bad)' : '1px solid var(--hairline)', color: it.danger ? 'var(--bad)' : 'var(--ink)', padding: '6px 14px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}>{it.v}</button>
                    ) : (
                      <Mono size={11.5} style={{ color: 'var(--ink2)' }}>{it.v}</Mono>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Stack>
      </div>
    </Desk>
  );
}

Object.assign(window, {
  Desk, DskHome, DskDrill, DskLesson, DskProgress, DskMock, DskSettings,
});
