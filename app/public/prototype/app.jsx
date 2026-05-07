// app.jsx — main HP-Coach design canvas application

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "sand",
  "dark": false,
  "typography": "literary",
  "density": "regular",
  "coach": "taktiker",
  "streak": false,
  "homeLayout": "editorial"
}/*EDITMODE-END*/;

// ---- Apply tokens to root document ---------------------------------------
const PALETTES = {
  sand: {
    light: { bg: 'oklch(0.97 0.011 78)', panel: 'oklch(0.99 0.008 80)', panel2: 'oklch(0.945 0.014 78)', ink: 'oklch(0.18 0.011 70)', ink2: 'oklch(0.32 0.012 70)', muted: 'oklch(0.51 0.017 70)', hairline: 'oklch(0.88 0.014 78)', hairline2: 'oklch(0.93 0.012 78)', accent: 'oklch(0.61 0.13 42)', accentSoft: 'oklch(0.91 0.05 50)', ok: 'oklch(0.55 0.10 145)', okSoft: 'oklch(0.92 0.04 145)', warn: 'oklch(0.65 0.13 70)', bad: 'oklch(0.55 0.16 25)', badSoft: 'oklch(0.93 0.05 25)' },
    dark:  { bg: 'oklch(0.16 0.011 78)', panel: 'oklch(0.20 0.013 78)', panel2: 'oklch(0.24 0.013 78)', ink: 'oklch(0.95 0.011 78)', ink2: 'oklch(0.82 0.012 78)', muted: 'oklch(0.62 0.012 78)', hairline: 'oklch(0.30 0.012 78)', hairline2: 'oklch(0.26 0.012 78)', accent: 'oklch(0.72 0.13 42)', accentSoft: 'oklch(0.32 0.07 50)', ok: 'oklch(0.70 0.10 145)', okSoft: 'oklch(0.28 0.04 145)', warn: 'oklch(0.75 0.13 70)', bad: 'oklch(0.68 0.16 25)', badSoft: 'oklch(0.30 0.06 25)' },
  },
  sage: {
    light: { bg: 'oklch(0.96 0.012 175)', panel: 'oklch(0.985 0.008 175)', panel2: 'oklch(0.93 0.014 175)', ink: 'oklch(0.20 0.013 200)', ink2: 'oklch(0.34 0.014 200)', muted: 'oklch(0.51 0.017 195)', hairline: 'oklch(0.86 0.014 180)', hairline2: 'oklch(0.92 0.012 180)', accent: 'oklch(0.55 0.10 195)', accentSoft: 'oklch(0.90 0.04 195)', ok: 'oklch(0.55 0.10 155)', okSoft: 'oklch(0.92 0.04 155)', warn: 'oklch(0.68 0.13 80)', bad: 'oklch(0.55 0.15 25)', badSoft: 'oklch(0.93 0.05 25)' },
    dark:  { bg: 'oklch(0.17 0.012 200)', panel: 'oklch(0.21 0.014 200)', panel2: 'oklch(0.25 0.014 200)', ink: 'oklch(0.95 0.011 175)', ink2: 'oklch(0.82 0.012 175)', muted: 'oklch(0.62 0.012 175)', hairline: 'oklch(0.31 0.013 200)', hairline2: 'oklch(0.27 0.013 200)', accent: 'oklch(0.70 0.10 195)', accentSoft: 'oklch(0.32 0.06 195)', ok: 'oklch(0.70 0.10 155)', okSoft: 'oklch(0.28 0.04 155)', warn: 'oklch(0.75 0.13 80)', bad: 'oklch(0.68 0.15 25)', badSoft: 'oklch(0.30 0.06 25)' },
  },
  ink: {
    light: { bg: 'oklch(0.97 0.012 250)', panel: 'oklch(0.99 0.008 250)', panel2: 'oklch(0.94 0.015 250)', ink: 'oklch(0.20 0.04 260)', ink2: 'oklch(0.34 0.04 260)', muted: 'oklch(0.51 0.025 255)', hairline: 'oklch(0.86 0.018 250)', hairline2: 'oklch(0.92 0.014 250)', accent: 'oklch(0.85 0.13 95)', accentSoft: 'oklch(0.94 0.06 95)', ok: 'oklch(0.55 0.10 155)', okSoft: 'oklch(0.92 0.04 155)', warn: 'oklch(0.65 0.13 75)', bad: 'oklch(0.55 0.16 25)', badSoft: 'oklch(0.93 0.05 25)' },
    dark:  { bg: 'oklch(0.13 0.04 260)', panel: 'oklch(0.18 0.045 260)', panel2: 'oklch(0.22 0.045 260)', ink: 'oklch(0.96 0.012 250)', ink2: 'oklch(0.84 0.014 250)', muted: 'oklch(0.62 0.018 250)', hairline: 'oklch(0.28 0.04 260)', hairline2: 'oklch(0.24 0.04 260)', accent: 'oklch(0.88 0.14 95)', accentSoft: 'oklch(0.30 0.07 95)', ok: 'oklch(0.70 0.10 155)', okSoft: 'oklch(0.28 0.04 155)', warn: 'oklch(0.75 0.13 75)', bad: 'oklch(0.68 0.16 25)', badSoft: 'oklch(0.30 0.06 25)' },
  },
  rose: {
    light: { bg: 'oklch(0.97 0.012 25)', panel: 'oklch(0.99 0.008 25)', panel2: 'oklch(0.94 0.018 20)', ink: 'oklch(0.20 0.020 20)', ink2: 'oklch(0.34 0.020 20)', muted: 'oklch(0.52 0.022 20)', hairline: 'oklch(0.87 0.020 20)', hairline2: 'oklch(0.92 0.016 20)', accent: 'oklch(0.62 0.14 15)', accentSoft: 'oklch(0.92 0.06 15)', ok: 'oklch(0.55 0.10 145)', okSoft: 'oklch(0.92 0.04 145)', warn: 'oklch(0.68 0.13 65)', bad: 'oklch(0.55 0.16 25)', badSoft: 'oklch(0.93 0.05 25)' },
    dark:  { bg: 'oklch(0.17 0.014 20)', panel: 'oklch(0.21 0.018 20)', panel2: 'oklch(0.25 0.018 20)', ink: 'oklch(0.96 0.012 25)', ink2: 'oklch(0.83 0.014 25)', muted: 'oklch(0.62 0.018 25)', hairline: 'oklch(0.31 0.016 20)', hairline2: 'oklch(0.27 0.016 20)', accent: 'oklch(0.74 0.14 15)', accentSoft: 'oklch(0.32 0.08 15)', ok: 'oklch(0.70 0.10 145)', okSoft: 'oklch(0.28 0.04 145)', warn: 'oklch(0.75 0.13 65)', bad: 'oklch(0.68 0.16 25)', badSoft: 'oklch(0.30 0.06 25)' },
  },
};

const TYPOGRAPHIES = {
  literary:    { display: '"Newsreader", Georgia, serif',           displayW: 500, displayTrack: '-0.02em', displayLead: 1.05, ui: '"Inter Tight", -apple-system, sans-serif',     mono: '"JetBrains Mono", ui-monospace, monospace' },
  geometric:   { display: '"Geist", -apple-system, sans-serif',     displayW: 500, displayTrack: '-0.025em', displayLead: 1.06, ui: '"Geist", -apple-system, sans-serif',           mono: '"Geist Mono", ui-monospace, monospace' },
  editorial:   { display: '"Instrument Serif", Georgia, serif',     displayW: 400, displayTrack: '-0.02em', displayLead: 1.03, ui: '"DM Sans", -apple-system, sans-serif',         mono: '"JetBrains Mono", ui-monospace, monospace' },
  hyperlegible:{ display: '"Atkinson Hyperlegible", sans-serif',     displayW: 700, displayTrack: '-0.01em', displayLead: 1.1,  ui: '"Atkinson Hyperlegible", sans-serif',          mono: '"JetBrains Mono", ui-monospace, monospace' },
};

const DENSITIES = {
  compact: { padSm: '8px', padMd: '10px', padLg: '14px', radius: '14px', titleScale: 0.92 },
  regular: { padSm: '10px', padMd: '14px', padLg: '18px', radius: '18px', titleScale: 1 },
  comfy:   { padSm: '14px', padMd: '20px', padLg: '24px', radius: '22px', titleScale: 1.08 },
};

function applyTokens(t) {
  const root = document.documentElement;
  const palKey = (typeof t.palette === 'string' && PALETTES[t.palette]) ? t.palette : 'sand';
  const pal = PALETTES[palKey][t.dark ? 'dark' : 'light'];
  Object.entries(pal).forEach(([k, v]) => root.style.setProperty('--' + k.replace(/([A-Z])/g, '-$1').toLowerCase(), v));
  const typ = TYPOGRAPHIES[t.typography];
  root.style.setProperty('--font-display', typ.display);
  root.style.setProperty('--font-display-w', typ.displayW);
  root.style.setProperty('--font-display-track', typ.displayTrack);
  root.style.setProperty('--font-display-lead', typ.displayLead);
  root.style.setProperty('--font-ui', typ.ui);
  root.style.setProperty('--font-mono', typ.mono);
  const den = DENSITIES[t.density];
  root.style.setProperty('--pad-sm', den.padSm);
  root.style.setProperty('--pad-md', den.padMd);
  root.style.setProperty('--pad-lg', den.padLg);
  root.style.setProperty('--radius', den.radius);
  document.body.style.fontFamily = typ.ui;
  document.body.style.color = pal.ink;
  document.body.style.background = pal.bg;
}

// ---- Tweaks panel --------------------------------------------------------
const PALETTE_SWATCHES = [
  { value: 'sand', label: 'Sand',  colors: ['oklch(0.97 0.011 78)',  'oklch(0.18 0.011 70)', 'oklch(0.61 0.13 42)'] },
  { value: 'sage', label: 'Sage',  colors: ['oklch(0.96 0.012 175)', 'oklch(0.20 0.013 200)', 'oklch(0.55 0.10 195)'] },
  { value: 'ink',  label: 'Ink',   colors: ['oklch(0.97 0.012 250)', 'oklch(0.20 0.04 260)',  'oklch(0.85 0.13 95)'] },
  { value: 'rose', label: 'Rose',  colors: ['oklch(0.97 0.012 25)',  'oklch(0.20 0.020 20)',  'oklch(0.62 0.14 15)'] },
];

function PaletteSwatches({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: '#888', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Palett</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {PALETTE_SWATCHES.map((p) => {
          const on = value === p.value;
          return (
            <button key={p.value} onClick={() => onChange(p.value)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px',
              background: on ? '#1a1a1a' : '#262626',
              border: on ? '1px solid #555' : '1px solid #333',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              color: '#eee', fontSize: 12,
            }}>
              <span style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
                {p.colors.map((c, i) => (
                  <span key={i} style={{ width: 10, height: 16, background: c, display: 'block' }} />
                ))}
              </span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HPTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Tema">
        <PaletteSwatches value={tweaks.palette} onChange={(v) => setTweak('palette', v)} />
        <TweakToggle label="Mörkt läge" value={tweaks.dark} onChange={(v) => setTweak('dark', v)} />
      </TweakSection>
      <TweakSection title="Typografi">
        <TweakSelect label="Pairing" value={tweaks.typography} onChange={(v) => setTweak('typography', v)}
          options={[
            { value: 'literary', label: 'Literary · Newsreader + Inter Tight' },
            { value: 'geometric', label: 'Geometric · Geist family' },
            { value: 'editorial', label: 'Editorial · Instrument + DM Sans' },
            { value: 'hyperlegible', label: 'Hyperlegible · Atkinson' },
          ]} />
      </TweakSection>
      <TweakSection title="Layout">
        <TweakRadio label="Densitet" value={tweaks.density} onChange={(v) => setTweak('density', v)}
          options={[{ value: 'compact', label: 'Tät' }, { value: 'regular', label: 'Standard' }, { value: 'comfy', label: 'Luftig' }]} />
        <TweakSelect label="Hem-layout" value={tweaks.homeLayout} onChange={(v) => setTweak('homeLayout', v)}
          options={[
            { value: 'editorial', label: 'Editorial · stor mening + CTA' },
            { value: 'minimal', label: 'Minimal · siffer-stack' },
            { value: 'agenda', label: 'Agenda · checklista' },
          ]} />
      </TweakSection>
      <TweakSection title="Pedagogik">
        <TweakRadio label="Coach" value={tweaks.coach} onChange={(v) => setTweak('coach', v)}
          options={[{ value: 'kompis', label: 'Kompis' }, { value: 'professor', label: 'Professor' }, { value: 'taktiker', label: 'Taktiker' }]} />
        <TweakToggle label="Streak-räknare" value={tweaks.streak} onChange={(v) => setTweak('streak', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

// ---- Interactive Drill flow (shared state across artboards) --------------
function useFlow() {
  const [step, setStep] = React.useState('drill'); // drill | feedback
  const [selected, setSelected] = React.useState(null);
  const reset = () => { setStep('drill'); setSelected(null); };
  return { step, setStep, selected, setSelected, reset };
}

// ---- App with canvas -----------------------------------------------------
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTokens(tweaks); }, [tweaks]);
  const voice = (window.VOICE && window.VOICE[tweaks.coach]) || (window.VOICE && window.VOICE.taktiker);

  const [l1, setL1] = React.useState(null);
  const [cmdk, setCmdk] = React.useState(false);
  const [formula, setFormula] = React.useState(false);

  // global keyboard
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdk((v) => !v); }
      else if (e.key === 'Escape') { setCmdk(false); setL1(null); setFormula(false); }
      else if (e.key === '?') { setFormula(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Drill flow state per-artboard
  const mDrill = useFlow();
  const dDrill = useFlow();

  return (
    <>
      <DesignCanvas
        title="HP-Coach"
        subtitle="Hi-fi prototype · 16 artboards · mobile + desktop · live tweaks"
        bg="oklch(0.95 0.01 78)"
      >
        <DCSection id="onboarding" title="01 · Onboarding & Diagnostik" subtitle="Första intryck. Three Q's, en ärlig mening, sedan rakt in i diagnostiken.">
          <DCArtboard id="ob-1" label="01a · Onboarding · Q1 dagar" width={390} height={844}>
            <ScrOnboard step={0} />
          </DCArtboard>
          <DCArtboard id="ob-2" label="01b · Onboarding · Q2 tid" width={390} height={844}>
            <ScrOnboard step={1} />
          </DCArtboard>
          <DCArtboard id="ob-3" label="01c · Onboarding · ärlig handoff" width={390} height={844}>
            <ScrOnboard step={2} voice={voice} coach={tweaks.coach} />
          </DCArtboard>
          <DCArtboard id="diag-pre" label="02a · Diagnostik · innan start" width={390} height={844}>
            <ScrDiagPre />
          </DCArtboard>
          <DCArtboard id="diag" label="02b · Diagnostik · Q1 av 80" width={390} height={844}>
            <ScrDiagnostic />
          </DCArtboard>
          <DCArtboard id="diag-done" label="02c · Halvvägs · pass 1 klart" width={390} height={844}>
            <ScrDiagDone />
          </DCArtboard>
          <DCArtboard id="diag-results" label="03 · Diagnostik klar (båda halvor)" width={390} height={844}>
            <ScrDiagResults />
          </DCArtboard>
          <DCArtboard id="edge-pre" label="16e · Pre-diagnostik (edge)" width={390} height={844}>
            <ScrEdge kind="aborted" />
          </DCArtboard>
        </DCSection>

        <DCSection id="daily-loop" title="02 · Daily loop" subtitle="Hem · Sektionsintro · Lektion · Drill · Feedback. Single CTA. Inga kakelmenyer.">
          <DCArtboard id="home-m" label={`04a · Hem (mobil · ${tweaks.homeLayout} · ${tweaks.coach})`} width={390} height={844}>
            <ScrHomeMobile layout={tweaks.homeLayout} streak={tweaks.streak} voice={voice} coach={tweaks.coach} />
          </DCArtboard>
          <DCArtboard id="home-d" label={`04b · Hem (desktop · ${tweaks.coach})`} width={1280} height={820}>
            <DskHome streak={tweaks.streak} onCmdK={() => setCmdk(true)} voice={voice} coach={tweaks.coach} />
          </DCArtboard>
          <DCArtboard id="sect-onb" label={`05 · Sektionsintro · KVA · ${tweaks.coach}`} width={390} height={844}>
            <ScrSectionOnboard onL1={setL1} voice={voice} coach={tweaks.coach} />
          </DCArtboard>
          <DCArtboard id="lesson-m" label="06a · Lektion (mobil)" width={390} height={844}>
            <ScrLesson />
          </DCArtboard>
          <DCArtboard id="lesson-d" label="06b · Lektion (desktop · 65ch)" width={1280} height={820}>
            <DskLesson onCmdK={() => setCmdk(true)} />
          </DCArtboard>
          <DCArtboard id="drill-m" label="07a · Drill (mobil · interaktiv)" width={390} height={844}>
            {mDrill.step === 'drill' ? (
              <ScrDrill
                selected={mDrill.selected}
                onSelect={mDrill.setSelected}
                onAnswer={() => mDrill.setStep('feedback')}
                onCmdK={() => setCmdk(true)}
                onFormulaSheet={() => setFormula(true)}
              />
            ) : (
              <ScrFeedback correct={mDrill.selected === 'D'} onL1={setL1} onNext={mDrill.reset} />
            )}
          </DCArtboard>
          <DCArtboard id="drill-d" label="07b · Drill (desktop · interaktiv)" width={1280} height={820}>
            {dDrill.step === 'drill' ? (
              <DskDrill
                selected={dDrill.selected}
                onSelect={dDrill.setSelected}
                onAnswer={() => dDrill.setStep('feedback')}
                onCmdK={() => setCmdk(true)}
                onL1={setL1}
              />
            ) : (
              <Desk active="drill" onCmdK={() => setCmdk(true)}>
                <div style={{ height: '100%', padding: '40px 80px', maxWidth: 720, margin: '0 auto' }}>
                  <ScrFeedback correct={dDrill.selected === '4'} onL1={setL1} onNext={dDrill.reset} />
                </div>
              </Desk>
            )}
          </DCArtboard>
          <DCArtboard id="fb-static" label="08 · Feedback · klicka chips → overlay" width={390} height={844}>
            <ScrFeedback correct={false} onL1={setL1} onNext={() => {}} />
          </DCArtboard>
          <DCArtboard id="drill-dtk" label="07c · Drill · DTK med diagram" width={390} height={844}>
            <ScrDrillDTK onCmdK={() => setCmdk(true)} onFormulaSheet={() => setFormula(true)} />
          </DCArtboard>
          <DCArtboard id="end" label={`10 · Pass slut · ${tweaks.coach}`} width={390} height={844}>
            <ScrSessionEnd voice={voice} coach={tweaks.coach} />
          </DCArtboard>
        </DCSection>

        <DCSection id="adaptive" title="03 · Adaptiv repetition & Layer 1" data-screen-label="03 Adaptiv" subtitle="Avbryt drillen vid 3 fel inom 7 dagar. Layer 1 IDs är klickbara atomer.">
          <DCArtboard id="adapt" label={`09 · Adaptiv interrupt · ${tweaks.coach}`} width={390} height={844}>
            <ScrAdaptive onAccept={() => {}} onSkip={() => {}} onL1={setL1} voice={voice} coach={tweaks.coach} />
          </DCArtboard>
          <DCArtboard id="l1-static" label="15 · Layer 1 ID overlay (klicka chip för live)" width={680} height={680}>
            <div style={{ width: 680, height: 680, background: 'var(--bg)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, padding: 40, opacity: 0.18 }}>
                <div style={{ height: 14, width: 90, background: 'var(--ink)', borderRadius: 4 }} />
                <div style={{ height: 28, width: 240, background: 'var(--ink)', borderRadius: 4, marginTop: 14 }} />
                <div style={{ height: 80, marginTop: 24, background: 'var(--panel2)', borderRadius: 8 }} />
              </div>
              <div style={{ position: 'absolute', inset: 20, background: 'rgba(20,16,10,0.4)', borderRadius: 12 }} />
              <div style={{ position: 'absolute', top: 60, left: 60, right: 60, bottom: 60, background: 'var(--panel)', borderRadius: 16, padding: 24, overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
                <Mono>KVA · Layer 1</Mono>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)', letterSpacing: 'var(--font-display-track)', fontSize: 24, lineHeight: 1.15, margin: '6px 0 8px' }}>Negativa tal i kvadrat</h3>
                <span style={{ display: 'inline-block', padding: '3px 8px', background: 'var(--panel2)', border: '1px solid var(--hairline)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>KVA-NEG-001</span>
                <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.5 }}>När jämförelsestorheter innehåller en variabel som kan vara negativ, kan kvadrering ändra rangordningen.</p>
                <button onClick={() => setL1('KVA-NEG-001')} style={{ marginTop: 18, padding: '10px 14px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Öppna fullständig overlay →</button>
              </div>
            </div>
          </DCArtboard>
        </DCSection>

        <DCSection id="coach-voices" title="04 · Coach-röster" data-screen-label="04 Coach-röster" subtitle="Tre röster, samma fem ögonblick. Inget maskotvarelse — bara attribuerad monolog.">
          <DCArtboard id="voices" label="11 · Voice spec · Kompis · Professor · Taktiker" width={1240} height={1180}>
            <CoachVoiceSpec activeCoach={tweaks.coach} onPick={(c) => setTweak('coach', c)} />
          </DCArtboard>
        </DCSection>

        <DCSection id="progress" title="05 · Framsteg & Mock" subtitle="Veckorapport (opt-in). Mock = halvor på mobil, fullt 4h på desktop.">
          <DCArtboard id="weekly" label="11 · Veckorapport · trend + radar + topp 5" width={1280} height={820}>
            <DskProgress onCmdK={() => setCmdk(true)} onL1={setL1} />
          </DCArtboard>
          <DCArtboard id="mock-d" label="12 · Mock · fullständigt prov 4h" width={1280} height={820}>
            <DskMock />
          </DCArtboard>
        </DCSection>

        <DCSection id="palette-cmdk" title="06 · Cmd+K & Inställningar" subtitle="Kommando-paletten är primär nav. Inställningar är gömda bakom 'Avancerat'.">
          <DCArtboard id="cmdk-static" label="13 · Cmd+K palette · klicka för live" width={840} height={620}>
            <div style={{ width: 840, height: 620, background: 'var(--bg)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, padding: 40, opacity: 0.2 }}>
                <div style={{ height: 14, width: 90, background: 'var(--ink)', borderRadius: 4 }} />
                <div style={{ height: 56, width: 480, background: 'var(--ink)', borderRadius: 4, marginTop: 14 }} />
                <div style={{ height: 80, marginTop: 28, background: 'var(--panel2)', borderRadius: 12 }} />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,10,0.45)' }} />
              <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', width: 640, maxHeight: 500, background: 'var(--panel)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
                  <I.search s={16}/>
                  <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)' }}>kva neg</span>
                  <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', background: 'var(--panel2)', border: '1px solid var(--hairline)', borderRadius: 4, color: 'var(--muted)' }}>esc</kbd>
                </div>
                <div style={{ flex: 1, padding: '8px 0' }}>
                  {[
                    { cat: 'Sektioner', items: [['KVA · Kvantitativa jämförelser', 'Lektion 3 / 8']] },
                    { cat: 'Layer 1 mönster', items: [['KVA-NEG-001 · Negativa tal i kvadrat', '36% · 14×']] },
                    { cat: 'Senaste fel', items: [['KVA Q7 · 2 min sedan · KVA-NEG-001', '']] },
                  ].map((g) => (
                    <div key={g.cat}>
                      <div style={{ padding: '10px 18px 6px' }}><Mono size={10}>{g.cat}</Mono></div>
                      {g.items.map(([l, sub], i) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 18px', background: i === 0 && g.cat === 'Layer 1 mönster' ? 'var(--panel2)' : 'transparent' }}>
                          <span style={{ fontSize: 13.5 }}>{l}</span>
                          {sub && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{sub}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 18px', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>↑↓ navigera · ↵ välj · esc stäng</span>
                  <button onClick={() => setCmdk(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>öppna live ⌘K</button>
                </div>
              </div>
            </div>
          </DCArtboard>
          <DCArtboard id="settings" label="14 · Inställningar · 'Avancerat'" width={1280} height={820}>
            <DskSettings onCmdK={() => setCmdk(true)} />
          </DCArtboard>
        </DCSection>

        <DCSection id="edge" title="07 · Edge states" subtitle="Tom kö · inga kort att repetera · mock avbruten · offline.">
          <DCArtboard id="edge-empty" label="16a · Tom mistake queue" width={390} height={844}>
            <ScrEdge kind="empty" />
          </DCArtboard>
          <DCArtboard id="edge-cards" label="16b · SRS · inga kort idag" width={390} height={844}>
            <ScrEdge kind="nocards" />
          </DCArtboard>
          <DCArtboard id="edge-aborted" label="16c · Mock avbruten" width={390} height={844}>
            <ScrEdge kind="aborted" />
          </DCArtboard>
          <DCArtboard id="edge-offline" label="16d · Offline (PWA)" width={390} height={844}>
            <ScrEdge kind="offline" />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <HPTweaks tweaks={tweaks} setTweak={setTweak} />

      {/* Global overlays */}
      <L1Overlay id={l1} onClose={() => setL1(null)} />
      <CmdK open={cmdk} onClose={() => setCmdk(false)} onL1={setL1} />
      <FormulaSheet open={formula} onClose={() => setFormula(false)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
