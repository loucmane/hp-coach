// components.jsx — HP-Coach shared UI primitives
// Conventions:
//   - All components consume CSS vars from <Theme>.
//   - Icons are inline SVG, stroke-1.6, 20px nominal (Lucide-flavored).
//   - No emoji. No animation overshoot.

// ── Icons ──────────────────────────────────────────────────────────
const I = {
  arrowRight: (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  arrowLeft: (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>,
  check:  (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  x:      (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  clock:  (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>,
  pencil: (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
  book:   (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 014 17.5v-13zM4 17.5A2.5 2.5 0 016.5 15H20"/></svg>,
  fn:     (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21c0-7 2-12 7-12M3 13h10M14 4l4 6-4 6M14 16l4-6"/></svg>,
  search: (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  home:   (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V11z"/></svg>,
  sliders:(p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M4 12h6M4 18h14"/><circle cx="18" cy="6" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="20" cy="18" r="2"/></svg>,
  chart:  (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V5M3 21h18M7 17V11M12 17V8M17 17V13"/></svg>,
  user:   (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
  focus:  (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3"/><circle cx="12" cy="12" r="3"/></svg>,
  more:   (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>,
  dot:    (p) => <svg width={p?.s||6} height={p?.s||6} viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="2"/></svg>,
  chevR:  (p) => <svg width={p?.s||14} height={p?.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  chevD:  (p) => <svg width={p?.s||14} height={p?.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  alert:  (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>,
  wifi:   (p) => <svg width={p?.s||16} height={p?.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9c5-5 15-5 20 0M5.5 12.5c3-3 10-3 13 0M9 16c1.5-1.5 4.5-1.5 6 0M12 20h.01"/></svg>,
  cmd:    (p) => <svg width={p?.s||14} height={p?.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9V6a3 3 0 113 3H9zm0 0v6m0 0v3a3 3 0 11-3-3h3zm0 0h6m0 0V6a3 3 0 113 3h-3zm0 0v6m0 0v3a3 3 0 11-3-3h3z"/></svg>,
  enter:  (p) => <svg width={p?.s||14} height={p?.s||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10l-5 5 5 5M4 15h12a4 4 0 004-4V4"/></svg>,
};

// ── Layout primitives ──────────────────────────────────────────────
const Stack = ({ children, gap = 'var(--gap)', dir = 'col', align, justify, style = {}, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: dir === 'row' ? 'row' : 'column', gap, alignItems: align, justifyContent: justify, ...style }} {...rest}>{children}</div>
);

const Hairline = ({ vertical = false, style = {} }) => (
  <div style={{ background: 'var(--hairline)', flexShrink: 0, ...(vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, alignSelf: 'stretch' }), ...style }} />
);

// ── Buttons ────────────────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', size = 'md', full = false, onClick, style = {}, leading, trailing, disabled, ...rest }) => {
  const sizes = {
    sm: { h: 36, px: 14, fz: 13 },
    md: { h: 44, px: 18, fz: 14 },
    lg: { h: 56, px: 22, fz: 16 },
    xl: { h: 64, px: 28, fz: 18 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: 'var(--ink)', color: 'var(--bg)', border: 'transparent' },
    secondary: { bg: 'transparent', color: 'var(--ink)', border: 'var(--hairline)' },
    accent: { bg: 'var(--accent)', color: 'var(--accentInk)', border: 'transparent' },
    ghost: { bg: 'transparent', color: 'var(--ink2)', border: 'transparent' },
    soft: { bg: 'var(--panel2)', color: 'var(--ink)', border: 'transparent' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: s.h, padding: `0 ${s.px}px`, borderRadius: 'calc(var(--radius) * 0.6)',
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      fontSize: s.fz, fontWeight: 500, fontFamily: 'inherit', letterSpacing: 'var(--font-ui-track)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: disabled ? 'default' : 'pointer', width: full ? '100%' : undefined,
      transition: 'background .15s cubic-bezier(.16,1,.3,1), opacity .15s',
      opacity: disabled ? 0.4 : 1, ...style,
    }} {...rest}>
      {leading}{children}{trailing}
    </button>
  );
};

// ── Cards ──────────────────────────────────────────────────────────
const Card = ({ children, style = {}, padded = true, onClick, ...rest }) => (
  <div onClick={onClick} style={{
    background: 'var(--panel)', border: '1px solid var(--hairline)',
    borderRadius: 'var(--radius)', padding: padded ? 'var(--pad-lg)' : 0,
    cursor: onClick ? 'pointer' : undefined, ...style,
  }} {...rest}>{children}</div>
);

// Layer 1 ID chip — clickable opens overlay (handled by host).
const L1Chip = ({ id, onClick, locked = false, size = 'md' }) => {
  const sz = size === 'sm' ? { fz: 10.5, py: 2, px: 6 } : { fz: 11, py: 3, px: 7 };
  return (
    <button onClick={(e) => { e.stopPropagation(); !locked && onClick && onClick(id); }} title={locked ? 'Inte upplåst än' : id} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--font-mono)', letterSpacing: 'var(--font-mono-track)',
      fontSize: sz.fz, padding: `${sz.py}px ${sz.px}px`,
      background: locked ? 'transparent' : 'var(--panel2)',
      border: '1px solid var(--hairline)',
      borderRadius: 4, color: locked ? 'var(--muted2)' : 'var(--ink2)',
      cursor: locked ? 'default' : 'pointer', fontWeight: 500,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: 2, background: locked ? 'var(--muted2)' : 'var(--accent)' }} />
      {id}
    </button>
  );
};

// Mono caption (data labels)
const Mono = ({ children, style = {}, size = 11 }) => (
  <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: 'var(--font-mono-track)', fontSize: size, color: 'var(--muted)', textTransform: 'uppercase', ...style }}>{children}</span>
);

// Section eyebrow used at top of artboards/sections in editorial layout.
const Eyebrow = ({ children, style = {} }) => (
  <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--muted)', ...style }}>{children}</div>
);

// ── Status bar (used by mobile artboards) ─────────────────────────
const StatusBar = ({ time = '09:41', dark }) => (
  <div style={{ height: 44, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--ink)' }}>
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
      {/* signal */}
      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="5" width="3" height="6" rx="0.5"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>
      {/* wifi */}
      <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 11l2.2-2.7a3 3 0 00-4.4 0L7.5 11zM3 6.4a7 7 0 019 0l1.5-1.6a9 9 0 00-12 0L3 6.4zM.5 3.4a11 11 0 0114 0L15.7 2A13 13 0 00-.7 2L.5 3.4z"/></svg>
      {/* battery */}
      <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor"/><rect x="23.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.5"/></svg>
    </div>
  </div>
);

const HomeIndicator = () => (
  <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: 134, height: 5, background: 'var(--ink)', borderRadius: 3, opacity: 0.85 }} />
  </div>
);

// Bottom tab bar (mobile)
const BottomTabs = ({ active = 'home', onChange }) => {
  const tabs = [
    { id: 'home', label: 'Hem', icon: I.home },
    { id: 'drill', label: 'Övning', icon: I.pencil },
    { id: 'coach', label: 'Coach', icon: I.user },
    { id: 'progress', label: 'Framsteg', icon: I.chart },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 28,
      background: 'var(--panel)', borderTop: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 4px' }}>
        {tabs.map((t) => {
          const Ic = t.icon;
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange && onChange(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px',
              color: on ? 'var(--ink)' : 'var(--muted2)', fontFamily: 'inherit',
            }}>
              <Ic s={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Desktop sidebar
const Sidebar = ({ active = 'home', onChange, onOpenCmdK }) => {
  const items = [
    { id: 'home', label: 'Hem', icon: I.home },
    { id: 'drill', label: 'Övning', icon: I.pencil },
    { id: 'progress', label: 'Framsteg', icon: I.chart },
    { id: 'mock', label: 'Provmock', icon: I.book },
    { id: 'settings', label: 'Avancerat', icon: I.sliders },
  ];
  return (
    <div style={{ width: 220, padding: '20px 14px', borderRight: '1px solid var(--hairline)',
      background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--ink)', color: 'var(--bg)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>HP</div>
        <span style={{ fontSize: 14, fontWeight: 600 }}>HP-Coach</span>
      </div>
      <button onClick={onOpenCmdK} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', marginBottom: 10,
        background: 'var(--panel2)', border: '1px solid var(--hairline)',
        borderRadius: 8, color: 'var(--muted)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><I.search s={13}/> Sök eller hoppa till…</span>
        <span style={{ display: 'flex', gap: 2 }}>
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 4 }}>⌘</kbd>
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 4 }}>K</kbd>
        </span>
      </button>
      {items.map((it) => {
        const Ic = it.icon;
        const on = active === it.id;
        return (
          <button key={it.id} onClick={() => onChange && onChange(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            background: on ? 'var(--panel2)' : 'transparent', border: 'none', borderRadius: 8,
            color: on ? 'var(--ink)' : 'var(--ink2)', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 500 : 400,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <Ic s={16} /> {it.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--hairline)', fontSize: 11, color: 'var(--muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--ok)' }} /> Linnea · Höstprov 26
        </div>
      </div>
    </div>
  );
};

// Layer 1 ID overlay — full-bleed sheet (mobile) / centred modal (desktop).
function L1Overlay({ id, onClose, mode = 'modal' }) {
  const data = LAYER1_DATA[id] || LAYER1_DATA['KVA-NEG-001'];
  const isSheet = mode === 'sheet';
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(20,16,10,0.42)',
      display: 'flex', alignItems: isSheet ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isSheet ? 0 : 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--panel)', borderRadius: isSheet ? '20px 20px 0 0' : 'var(--radius)',
        width: isSheet ? '100%' : 460, maxHeight: isSheet ? '88%' : '92%',
        padding: 'var(--pad-lg)', display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'auto',
      }}>
        {isSheet && <div style={{ width: 36, height: 4, background: 'var(--hairline)', borderRadius: 2, alignSelf: 'center', marginBottom: 4 }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <Mono>{data.id} · {data.section}</Mono>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', fontSize: 22, letterSpacing: 'var(--font-display-track)', lineHeight: 1.15, marginTop: 4 }}>
              {data.title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--panel2)', border: 'none', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', color: 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.x s={14}/></button>
        </div>

        <div>
          <Eyebrow>Definition</Eyebrow>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink2)', margin: '6px 0 0' }}>{data.definition}</p>
        </div>

        <div>
          <Eyebrow>Motåtgärd</Eyebrow>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink2)', margin: '6px 0 0' }}>{data.countermeasure}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: 12, border: '1px solid var(--hairline)', borderRadius: 10 }}>
            <Mono size={10}>Möten</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, marginTop: 2 }}>{data.encounters}</div>
          </div>
          <div style={{ flex: 1, padding: 12, border: '1px solid var(--hairline)', borderRadius: 10 }}>
            <Mono size={10}>Träffsäkerhet</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, marginTop: 2 }}>{data.accuracy}%</div>
          </div>
          <div style={{ flex: 1, padding: 12, border: '1px solid var(--hairline)', borderRadius: 10 }}>
            <Mono size={10}>Senast</Mono>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, marginTop: 2 }}>{data.lastSeen}</div>
          </div>
        </div>

        {/* trend sparkline */}
        <div style={{ padding: 12, border: '1px solid var(--hairline)', borderRadius: 10 }}>
          <Mono size={10}>Träffsäkerhet över tid</Mono>
          <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40, marginTop: 6 }}>
            <polyline fill="none" stroke="var(--accent)" strokeWidth="1.6" points={data.trend.map((v, i) => `${(i / (data.trend.length - 1)) * 196 + 2},${38 - v * 0.32}`).join(' ')} />
            {data.trend.map((v, i) => <circle key={i} cx={(i / (data.trend.length - 1)) * 196 + 2} cy={38 - v * 0.32} r="1.6" fill="var(--accent)" />)}
          </svg>
        </div>

        <div>
          <Eyebrow>Exempel</Eyebrow>
          <Stack gap="6px" style={{ marginTop: 6 }}>
            {data.examples.map((ex, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--panel2)', borderRadius: 8, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.4 }}>{ex}</div>
            ))}
          </Stack>
        </div>
      </div>
    </div>
  );
}

const LAYER1_DATA = {
  'KVA-NEG-001': {
    id: 'KVA-NEG-001', section: 'KVA · Kvantitativa jämförelser',
    title: 'Negativa tal i kvadrat',
    definition: 'När en variabel kan vara negativ, ändrar kvadrering rangordningen. (-3)² = 9 > (-3) = -3. Fällan: anta att x² alltid är större än x.',
    countermeasure: 'Fråga: kan x vara negativt eller noll? Om ja — testa med x = -2, x = 0, x = 0.5 och x = 2 innan du jämför.',
    encounters: 14, accuracy: 36, lastSeen: 'igår',
    trend: [20, 25, 18, 30, 28, 35, 30, 36, 42, 38],
    examples: [
      'A: x²   B: x   där -1 < x < 0 — ej entydigt avgörbart.',
      'A: a·b  B: a   där b kan vara negativt.',
      'A: 1/x  B: x   där x ≠ 0.',
    ],
  },
  'ORD-LAT-CUR-001': {
    id: 'ORD-LAT-CUR-001', section: 'ORD · Synonymer',
    title: 'Latinska roten cur- / curr-',
    definition: 'Roten betyder att löpa eller flöda. Återfinns i kurrent, kurrera, kurriär, rekurrens, kursiv. Fällan: blanda ihop med cor- (hjärta) eller cura- (vård).',
    countermeasure: 'Tre ankarord: kurriär, rekursion, valuta (currency). När du ser cur-/curr-, fråga: handlar det om att löpa/röra sig?',
    encounters: 8, accuracy: 75, lastSeen: 'i förrgår',
    trend: [40, 45, 55, 50, 60, 65, 70, 72, 75, 75],
    examples: [
      'Excursion ~ utflykt (löpa ut).',
      'Recurrent ~ återkommande (löpa tillbaka).',
      'Cursive ~ löpande skrift.',
    ],
  },
  'NOG-EQS-002': {
    id: 'NOG-EQS-002', section: 'NOG · Datatillräcklighet',
    title: 'Kombinera ekvationer utan att lösa',
    definition: 'I NOG ska du avgöra om informationen räcker — inte beräkna värdet. Vanlig fälla: lösa ut x för att kontrollera, vilket bränner tid.',
    countermeasure: 'Räkna obekanta vs. oberoende ekvationer. Två oberoende ekvationer ger två obekanta entydigt. Inget mer behövs.',
    encounters: 11, accuracy: 54, lastSeen: 'i tisdags',
    trend: [30, 35, 40, 42, 45, 48, 50, 52, 54, 54],
    examples: [
      '(1) x + y = 7  (2) x − y = 1 → tillräckligt.',
      '(1) 2x + 4y = 10  (2) x + 2y = 5 → ej oberoende.',
      '(1) xy = 12  (2) x + y = 7 → tillräckligt (system).',
    ],
  },
  'MEK-NEG-DBL-001': {
    id: 'MEK-NEG-DBL-001', section: 'MEK · Meningskomplettering',
    title: 'Dubbel negation',
    definition: 'Konstruktioner med två negationer (icke-otänkbart, inte sällan) flippar betydelsen. Fällan: läsa snabbt och välja motsatsen.',
    countermeasure: 'Markera båda negationerna med pennan. Räkna jämnt antal → positivt; udda → negativt.',
    encounters: 6, accuracy: 67, lastSeen: 'idag',
    trend: [45, 48, 52, 55, 58, 60, 62, 65, 67, 67],
    examples: [
      '"Inte osannolikt" = sannolikt.',
      '"Knappast omöjligt" = möjligt.',
      '"Sällan icke-relevant" = ofta relevant.',
    ],
  },
};

// Cmd+K palette ---------------------------------------------------------
const CMDK_ITEMS = [
  { cat: 'Sektioner', items: [
    { id: 'ORD', label: 'ORD · Synonymer', hint: '40 frågor' },
    { id: 'LÄS', label: 'LÄS · Svensk läsförståelse', hint: '20 frågor' },
    { id: 'MEK', label: 'MEK · Meningskomplettering', hint: '20 frågor' },
    { id: 'ELF', label: 'ELF · English Reading', hint: '20 questions' },
    { id: 'XYZ', label: 'XYZ · Algebra', hint: '12 frågor' },
    { id: 'KVA', label: 'KVA · Kvantitativa jämförelser', hint: '12 frågor' },
    { id: 'NOG', label: 'NOG · Datatillräcklighet', hint: '12 frågor' },
    { id: 'DTK', label: 'DTK · Diagram, tabeller, kartor', hint: '12 frågor' },
  ]},
  { cat: 'Övning', items: [
    { id: 'mode-blocked', label: 'Blockerat läge', hint: 'En typ åt gången' },
    { id: 'mode-interleaved', label: 'Interfolierat läge', hint: 'Blanda typer' },
    { id: 'mode-mistakes', label: 'Repetera dagens fel' },
    { id: 'mode-srs', label: 'Repetition (SRS)', hint: '12 kort idag' },
  ]},
  { cat: 'Layer 1', items: [
    { id: 'KVA-NEG-001', label: 'KVA-NEG-001 · Negativa tal i kvadrat', mono: true },
    { id: 'ORD-LAT-CUR-001', label: 'ORD-LAT-CUR-001 · Latinska roten cur-', mono: true },
    { id: 'NOG-EQS-002', label: 'NOG-EQS-002 · Kombinera ekvationer', mono: true },
    { id: 'MEK-NEG-DBL-001', label: 'MEK-NEG-DBL-001 · Dubbel negation', mono: true },
  ]},
  { cat: 'Senaste fel', items: [
    { id: 'err1', label: 'KVA · "x² vs x när -1<x<0"', hint: 'för 12 min sedan' },
    { id: 'err2', label: 'NOG · System av ekvationer', hint: 'igår 19:14' },
  ]},
  { cat: 'Provmock', items: [
    { id: 'mock-half', label: 'Övningsmock · Halva (160 min)' },
    { id: 'mock-full', label: 'Fullständigt prov (4 h)' },
  ]},
  { cat: 'Inställningar', items: [
    { id: 'set-theme', label: 'Tema & palett' },
    { id: 'set-typo', label: 'Typografi' },
    { id: 'set-coach', label: 'Coachpersonlighet' },
    { id: 'set-export', label: 'Exportera data (JSON)' },
  ]},
];

function CmdK({ onClose, onPickL1 }) {
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const flat = React.useMemo(() => {
    const out = [];
    const ql = q.toLowerCase();
    for (const g of CMDK_ITEMS) {
      const matches = g.items.filter((it) => !ql || it.label.toLowerCase().includes(ql) || it.id.toLowerCase().includes(ql));
      if (matches.length) out.push({ cat: g.cat, items: matches });
    }
    return out;
  }, [q]);
  const flatList = flat.flatMap((g) => g.items);

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(flatList.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === 'Enter') {
      const it = flatList[sel];
      if (it && /^[A-Z]+-[A-Z]+-\d+$/.test(it.id)) { onPickL1 && onPickL1(it.id); return; }
      onClose();
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(20,16,10,0.5)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '8%',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--panel)', borderRadius: 14, width: 560, maxWidth: '92%', maxHeight: '74%',
        boxShadow: '0 30px 80px rgba(0,0,0,.32)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', border: '1px solid var(--hairline)',
      }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--hairline)' }}>
          <I.search s={16} />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey}
            placeholder="Sök sektioner, fällor, fel, inställningar…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)' }} />
          <Mono size={10}>esc</Mono>
        </div>
        <div style={{ overflow: 'auto', padding: '4px 6px 8px' }}>
          {flat.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Inga träffar.</div>
          )}
          {flat.map((g) => (
            <div key={g.cat} style={{ padding: '8px 8px 4px' }}>
              <Mono size={9.5}>{g.cat}</Mono>
              <div style={{ marginTop: 4 }}>
                {g.items.map((it) => {
                  const idx = flatList.indexOf(it);
                  const on = idx === sel;
                  const isL1 = /^[A-Z]+-[A-Z]+-\d+$/.test(it.id);
                  return (
                    <button key={it.id} onMouseEnter={() => setSel(idx)} onClick={() => isL1 ? onPickL1 && onPickL1(it.id) : onClose()} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      padding: '8px 10px', background: on ? 'var(--panel2)' : 'transparent',
                      border: 'none', borderRadius: 6, color: 'var(--ink)', fontFamily: 'inherit',
                      fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
                    }}>
                      <span style={{ fontFamily: it.mono ? 'var(--font-mono)' : 'inherit', letterSpacing: it.mono ? 'var(--font-mono-track)' : 'inherit' }}>{it.label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {it.hint && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{it.hint}</span>}
                        {on && <I.enter s={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--hairline)', padding: '8px 14px', display: 'flex', gap: 14, color: 'var(--muted)', fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mono size={10}>↑↓</Mono> bläddra</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mono size={10}>↵</Mono> välj</span>
          <span style={{ flex: 1 }} />
          <span>{flatList.length} resultat</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  I, Stack, Hairline, Btn, Card, L1Chip, Mono, Eyebrow,
  StatusBar, HomeIndicator, BottomTabs, Sidebar,
  L1Overlay, LAYER1_DATA, CmdK, CMDK_ITEMS,
});
