// overlays.jsx — global overlays: Cmd+K palette, Layer 1 ID overlay, Formula sheet, Scratchpad

// ---- Layer 1 ID overlay --------------------------------------------------
const L1_DATA = {
  'KVA-NEG-001': {
    section: 'KVA',
    title: 'Negativa tal i kvadrat',
    def: 'När jämförelsestorheter innehåller en variabel som kan vara negativ eller ligga i intervallet (-1, 1), kan kvadrering ändra rangordningen. x² ≥ 0 alltid; x kan vara negativt; |x| < 1 ger x² < |x|.',
    counter: 'Testa minst tre värden: ett negativt heltal, ett tal i (-1, 0), och ett tal i (0, 1). Om svaret skiljer sig — välj "går ej att avgöra".',
    encounters: 14, accuracy: 36, trend: [50, 45, 40, 38, 36, 36, 36],
    examples: [
      'Låt -1 < x < 0. Jämför x² och x.',
      'Låt x ≠ 0. Jämför x² och 1.',
      'Givet att x² > x, vad vet vi om x?',
    ],
  },
  'NOG-EQS-002': {
    section: 'NOG',
    title: 'Kombinera ekvationer utan att lösa',
    def: 'NOG-frågor kräver att du avgör tillräcklighet, inte att du beräknar. Att kombinera (1) och (2) räcker ofta — men kontrollera om var och en räcker ensam först.',
    counter: 'Steg 1: räcker (1) ensamt? Steg 2: räcker (2) ensamt? Endast om båda är otillräckliga, kombinera.',
    encounters: 11, accuracy: 54, trend: [40, 45, 48, 50, 52, 54, 54],
    examples: [
      'Antal kulor: (1) 30 % röda, (2) 12 fler blå än röda.',
      'Värdet av x: (1) x² = 9, (2) x > 0.',
      'Triangelarea: (1) bas 8, (2) höjd 5.',
    ],
  },
  'ORD-LAT-CUR-001': {
    section: 'ORD',
    title: 'Latinska roten cur- / curr-',
    def: 'Roten betyder "att löpa, att flöda". Förekommer i kurir, rekursion, kursiv, exkursion, konkurrent.',
    counter: 'När du ser ett okänt ord med cur-/curr-, fråga: "vad löper här?" Tre ankarord räcker som mall.',
    encounters: 8, accuracy: 75, trend: [60, 65, 68, 72, 73, 74, 75],
    examples: [
      'Synonym till "kursiv": A) bred B) lutande C) fet D) tryckt E) glest',
      'Vad betyder "rekurrera"?',
      'Roten i "konkurrens" är?',
    ],
  },
  'MEK-NEG-DBL-001': {
    section: 'MEK',
    title: 'Dubbel negation i meningskomplettering',
    def: 'När en mening innehåller två negationer (icke, varken, knappast, sällan), ger de tillsammans positiv betydelse. MEK-distraktorer utnyttjar att läsaren räknar fel antal negationer.',
    counter: 'Räkna negationer explicit. Jämn = positiv, udda = negativ.',
    encounters: 6, accuracy: 67, trend: [50, 55, 60, 64, 66, 67, 67],
    examples: ['"Det är inte ovanligt att…"', '"Knappast någon förnekar…"', '"Varken oviktigt eller…"'],
  },
  'DTK-AXES-001': {
    section: 'DTK',
    title: 'Logaritmisk vs linjär axel',
    def: 'Diagram med logaritmisk skala visar relativa förändringar; linjära visar absoluta. Att läsa "fördubbling" på en log-axel kräver att man identifierar skalan.',
    counter: 'Läs alltid axelmärkningen först. Om y-värden går 1, 10, 100, 1000 — det är log.',
    encounters: 4, accuracy: 50, trend: [55, 52, 50, 50, 50, 50, 50],
    examples: ['Befolkningstillväxt 1900–2000', 'Inflationsindex per land', 'Magnitudskala för jordbävningar'],
  },
};

function L1Overlay({ id, onClose }) {
  if (!id) return null;
  const d = L1_DATA[id];
  if (!d) return null;
  const W = 320, H = 80;
  const tpath = d.trend.map((v, i) => `${(i / (d.trend.length - 1)) * (W - 20) + 10},${H - 10 - (v / 100) * (H - 20)}`).join(' ');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,10,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxHeight: '90vh', background: 'var(--panel)', borderRadius: 16, padding: 28, overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Mono>{d.section} · Layer 1</Mono>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 26, lineHeight: 1.15, margin: '6px 0 8px', textWrap: 'balance' }}>{d.title}</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'var(--panel2)', border: '1px solid var(--hairline)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink2)', fontWeight: 500 }}>{id}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)' }}><I.x s={18}/></button>
        </div>

        <div style={{ marginTop: 18 }}>
          <Eyebrow>Definition</Eyebrow>
          <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--ink2)' }}>{d.def}</p>
        </div>

        <div style={{ marginTop: 18, padding: 'var(--pad-lg)', background: 'var(--panel2)', borderRadius: 'var(--radius)' }}>
          <Eyebrow>Motåtgärd</Eyebrow>
          <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--ink2)' }}>{d.counter}</p>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ padding: 'var(--pad-lg)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)' }}>
            <Eyebrow>Din historik</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{d.encounters}</div>
                <Mono size={10}>förekomster</Mono>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: d.accuracy < 50 ? 'var(--bad)' : d.accuracy < 70 ? 'var(--warn)' : 'var(--ok)' }}>{d.accuracy}%</div>
                <Mono size={10}>träffsäkert</Mono>
              </div>
            </div>
          </div>
          <div style={{ padding: 'var(--pad-lg)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius)' }}>
            <Eyebrow>Trend (senaste 7 förekomster)</Eyebrow>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, marginTop: 6 }}>
              <line x1="10" x2={W - 10} y1={H - 10 - 0.7 * (H - 20)} y2={H - 10 - 0.7 * (H - 20)} stroke="var(--hairline)" strokeDasharray="2 3" />
              <polyline fill="none" stroke="var(--ink)" strokeWidth="1.4" points={tpath} />
              {d.trend.map((v, i) => (
                <circle key={i} cx={(i / (d.trend.length - 1)) * (W - 20) + 10} cy={H - 10 - (v / 100) * (H - 20)} r="2" fill="var(--ink)" />
              ))}
            </svg>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Eyebrow>Exempel</Eyebrow>
          <Stack gap="6px" style={{ marginTop: 8 }}>
            {d.examples.map((ex, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--panel2)', borderRadius: 8 }}>
                <Mono size={11} style={{ color: 'var(--muted)' }}>{i + 1}</Mono>
                <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.45 }}>{ex}</span>
              </div>
            ))}
          </Stack>
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="ghost" size="md" onClick={onClose}>Stäng</Btn>
          <Btn variant="primary" size="md">Öva detta mönster</Btn>
        </div>
      </div>
    </div>
  );
}

// ---- Cmd+K palette -------------------------------------------------------
const CMDK_DATA = [
  { cat: 'Sektioner', icon: 'book', items: [
    { l: 'ORD · Synonymer', sub: 'Lektion 4 / 12' },
    { l: 'LÄS · Svensk läsförståelse', sub: 'Lektion 1 / 8' },
    { l: 'KVA · Kvantitativa jämförelser', sub: 'Lektion 3 / 8' },
    { l: 'NOG · Datatillräcklighet', sub: 'Ej startad' },
    { l: 'DTK · Diagram & tabeller', sub: 'Lektion 2 / 6' },
  ]},
  { cat: 'Övningslägen', icon: 'fn', items: [
    { l: 'Snabbpass · 10 min', sub: 'Auto-val från svaga mönster' },
    { l: 'Blockerad övning', sub: 'En sektion åt gången' },
    { l: 'Interfolierad övning', sub: 'Blandar sektioner' },
    { l: 'Felkö · att repetera', sub: '3 fel i kön' },
  ]},
  { cat: 'Layer 1 mönster', icon: 'alert', items: [
    { l: 'KVA-NEG-001 · Negativa tal i kvadrat', l1: 'KVA-NEG-001' },
    { l: 'NOG-EQS-002 · Kombinera ekvationer utan att lösa', l1: 'NOG-EQS-002' },
    { l: 'ORD-LAT-CUR-001 · Latinska roten cur-', l1: 'ORD-LAT-CUR-001' },
    { l: 'MEK-NEG-DBL-001 · Dubbel negation', l1: 'MEK-NEG-DBL-001' },
    { l: 'DTK-AXES-001 · Logaritmisk vs linjär axel', l1: 'DTK-AXES-001' },
  ]},
  { cat: 'Senaste fel', icon: 'x', items: [
    { l: 'KVA Q7 · 2 min sedan · KVA-NEG-001' },
    { l: 'NOG Q3 · igår · NOG-EQS-002' },
    { l: 'MEK Q12 · 2 dagar sedan · MEK-NEG-DBL-001' },
  ]},
  { cat: 'Mock', icon: 'check', items: [
    { l: 'Övningsmock · 160 min · halvor', sub: 'Mobil + desktop' },
    { l: 'Fullständigt prov · 4 h', sub: 'Endast desktop' },
    { l: 'Tidigare mockar (3)', sub: 'Senaste: 1,4 / 2,0' },
  ]},
  { cat: 'Inställningar', icon: 'cog', items: [
    { l: 'Palett: Sand / Sage / Ink / Rose' },
    { l: 'Typografi: Literary / Geometric / Editorial / Hyperlegible' },
    { l: 'Densitet: compact / regular / comfy' },
    { l: 'Coach: Kompis / Professor / Taktiker' },
    { l: 'Streak-räknare: Av' },
    { l: 'Reduce motion: Följ system' },
    { l: 'Exportera data som JSON' },
  ]},
];

function CmdK({ open, onClose, onL1 }) {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  React.useEffect(() => { if (open) setQ(''); setSel(0); }, [open]);
  if (!open) return null;
  const filtered = CMDK_DATA.map((g) => ({
    ...g,
    items: g.items.filter((it) => !q || it.l.toLowerCase().includes(q.toLowerCase()) || (it.sub || '').toLowerCase().includes(q.toLowerCase())),
  })).filter((g) => g.items.length > 0);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,10,0.45)', zIndex: 90, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: 540, background: 'var(--panel)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <I.search s={16}/>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök sektioner, mönster, fel, inställningar…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)' }} />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', background: 'var(--panel2)', border: '1px solid var(--hairline)', borderRadius: 4, color: 'var(--muted)' }}>esc</kbd>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Inga träffar för "{q}".</div>
          )}
          {filtered.map((g) => {
            const Icon = I[g.icon] || I.book;
            return (
              <div key={g.cat}>
                <div style={{ padding: '10px 18px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon s={11}/>
                  <Mono size={10}>{g.cat}</Mono>
                </div>
                {g.items.map((it, i) => (
                  <button key={it.l} onClick={() => { if (it.l1) { onL1 && onL1(it.l1); onClose(); } else { onClose(); } }} style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', color: 'var(--ink)', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 13.5 }}>{it.l}</span>
                    {it.sub && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{it.sub}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          <span>↑↓ navigera · ↵ välj · esc stäng</span>
          <span>HP-Coach · ⌘K</span>
        </div>
      </div>
    </div>
  );
}

// ---- Formula sheet (slide-up sheet on mobile, modal on desktop) ----------
function FormulaSheet({ open, onClose }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,10,0.45)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxHeight: '90vh', background: 'var(--panel)', borderRadius: 14, padding: 24, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <Mono>Formelblad</Mono>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', fontSize: 22, margin: '4px 0 0' }}>Algebra & geometri</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><I.x s={18}/></button>
        </div>
        <Stack gap="14px">
          {[
            { g: 'Algebra', items: ['(a + b)² = a² + 2ab + b²', '(a − b)² = a² − 2ab + b²', 'a² − b² = (a + b)(a − b)', 'a² ≥ 0 alltid; lika med 0 endast om a = 0'] },
            { g: 'Bråk', items: ['a/b · c/d = ac/bd', 'a/b ÷ c/d = ad/bc', 'a/b + c/d = (ad + bc)/bd'] },
            { g: 'Geometri', items: ['Pythagoras: a² + b² = c²', 'Cirkelarea: πr²', 'Triangelarea: bh/2'] },
            { g: 'Procent', items: ['Δ% = (ny − gammal) / gammal · 100', '% av X: X · p / 100'] },
          ].map((s) => (
            <div key={s.g}>
              <Eyebrow>{s.g}</Eyebrow>
              <Stack gap="4px" style={{ marginTop: 6 }}>
                {s.items.map((f) => (
                  <div key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, padding: '6px 10px', background: 'var(--panel2)', borderRadius: 6, color: 'var(--ink2)' }}>{f}</div>
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      </div>
    </div>
  );
}

Object.assign(window, { L1Overlay, CmdK, FormulaSheet, L1_DATA });
