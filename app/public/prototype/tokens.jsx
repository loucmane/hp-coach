// tokens.jsx — HP-Coach design tokens
// All palettes use OKLCH. Three font pairings, three density modes.
// Provides ThemeProvider that injects CSS variables into a wrapping element
// so per-artboard scoping works inside the design canvas.

const PALETTES = {
  sand: {
    label: 'Sand',
    light: {
      bg:        'oklch(0.97 0.011 78)',
      panel:     'oklch(0.99 0.008 80)',
      panel2:    'oklch(0.955 0.012 78)',
      ink:       'oklch(0.18 0.011 70)',
      ink2:      'oklch(0.32 0.013 70)',
      muted:     'oklch(0.51 0.017 70)',
      muted2:    'oklch(0.68 0.014 70)',
      hairline:  'oklch(0.88 0.012 70)',
      hairline2: 'oklch(0.92 0.012 70)',
      accent:    'oklch(0.61 0.13 42)',
      accentInk: 'oklch(0.99 0.008 80)',
      accentSoft:'oklch(0.91 0.05 50)',
      ok:        'oklch(0.55 0.10 145)',
      warn:      'oklch(0.65 0.13 70)',
      bad:       'oklch(0.55 0.16 25)',
      okSoft:    'oklch(0.93 0.04 145)',
      badSoft:   'oklch(0.93 0.05 25)',
    },
    dark: {
      bg:        'oklch(0.16 0.008 70)',
      panel:     'oklch(0.20 0.010 70)',
      panel2:    'oklch(0.235 0.011 70)',
      ink:       'oklch(0.96 0.008 78)',
      ink2:      'oklch(0.82 0.010 78)',
      muted:     'oklch(0.62 0.014 70)',
      muted2:    'oklch(0.48 0.014 70)',
      hairline:  'oklch(0.30 0.012 70)',
      hairline2: 'oklch(0.26 0.012 70)',
      accent:    'oklch(0.72 0.12 42)',
      accentInk: 'oklch(0.16 0.008 70)',
      accentSoft:'oklch(0.32 0.06 50)',
      ok:        'oklch(0.72 0.11 145)',
      warn:      'oklch(0.78 0.12 70)',
      bad:       'oklch(0.70 0.14 25)',
      okSoft:    'oklch(0.28 0.04 145)',
      badSoft:   'oklch(0.30 0.06 25)',
    },
  },
  sage: {
    label: 'Sage',
    light: {
      bg:        'oklch(0.965 0.012 175)',
      panel:     'oklch(0.99 0.008 175)',
      panel2:    'oklch(0.95 0.013 175)',
      ink:       'oklch(0.20 0.020 200)',
      ink2:      'oklch(0.34 0.022 200)',
      muted:     'oklch(0.50 0.020 200)',
      muted2:    'oklch(0.66 0.018 200)',
      hairline:  'oklch(0.87 0.014 175)',
      hairline2: 'oklch(0.92 0.012 175)',
      accent:    'oklch(0.52 0.085 195)',
      accentInk: 'oklch(0.99 0.008 175)',
      accentSoft:'oklch(0.90 0.04 195)',
      ok:        'oklch(0.55 0.10 155)',
      warn:      'oklch(0.65 0.12 70)',
      bad:       'oklch(0.55 0.15 25)',
      okSoft:    'oklch(0.92 0.04 155)',
      badSoft:   'oklch(0.93 0.05 25)',
    },
    dark: {
      bg:        'oklch(0.18 0.014 200)',
      panel:     'oklch(0.22 0.016 200)',
      panel2:    'oklch(0.255 0.018 200)',
      ink:       'oklch(0.96 0.008 175)',
      ink2:      'oklch(0.82 0.012 175)',
      muted:     'oklch(0.62 0.018 200)',
      muted2:    'oklch(0.48 0.018 200)',
      hairline:  'oklch(0.30 0.018 200)',
      hairline2: 'oklch(0.26 0.018 200)',
      accent:    'oklch(0.70 0.10 195)',
      accentInk: 'oklch(0.18 0.014 200)',
      accentSoft:'oklch(0.32 0.05 195)',
      ok:        'oklch(0.72 0.11 155)',
      warn:      'oklch(0.78 0.12 70)',
      bad:       'oklch(0.70 0.13 25)',
      okSoft:    'oklch(0.28 0.04 155)',
      badSoft:   'oklch(0.30 0.06 25)',
    },
  },
  ink: {
    label: 'Ink',
    light: {
      bg:        'oklch(0.97 0.008 250)',
      panel:     'oklch(0.99 0.005 250)',
      panel2:    'oklch(0.945 0.010 250)',
      ink:       'oklch(0.19 0.040 260)',
      ink2:      'oklch(0.32 0.045 260)',
      muted:     'oklch(0.50 0.025 260)',
      muted2:    'oklch(0.68 0.018 260)',
      hairline:  'oklch(0.88 0.014 250)',
      hairline2: 'oklch(0.93 0.010 250)',
      accent:    'oklch(0.36 0.13 265)',
      accentInk: 'oklch(0.99 0.005 250)',
      accentSoft:'oklch(0.92 0.05 100)', /* lemon */
      ok:        'oklch(0.55 0.10 150)',
      warn:      'oklch(0.78 0.13 95)',
      bad:       'oklch(0.55 0.16 25)',
      okSoft:    'oklch(0.93 0.04 150)',
      badSoft:   'oklch(0.93 0.05 25)',
    },
    dark: {
      bg:        'oklch(0.17 0.020 260)',
      panel:     'oklch(0.21 0.024 260)',
      panel2:    'oklch(0.245 0.028 260)',
      ink:       'oklch(0.96 0.008 250)',
      ink2:      'oklch(0.82 0.012 250)',
      muted:     'oklch(0.62 0.020 260)',
      muted2:    'oklch(0.48 0.020 260)',
      hairline:  'oklch(0.31 0.022 260)',
      hairline2: 'oklch(0.27 0.022 260)',
      accent:    'oklch(0.78 0.15 95)', /* lemon as accent in dark */
      accentInk: 'oklch(0.17 0.020 260)',
      accentSoft:'oklch(0.34 0.08 95)',
      ok:        'oklch(0.72 0.11 150)',
      warn:      'oklch(0.78 0.13 95)',
      bad:       'oklch(0.70 0.14 25)',
      okSoft:    'oklch(0.28 0.04 150)',
      badSoft:   'oklch(0.30 0.06 25)',
    },
  },
  rose: {
    label: 'Rose',
    light: {
      bg:        'oklch(0.97 0.011 25)',
      panel:     'oklch(0.99 0.008 25)',
      panel2:    'oklch(0.95 0.013 25)',
      ink:       'oklch(0.19 0.014 20)',
      ink2:      'oklch(0.33 0.016 20)',
      muted:     'oklch(0.51 0.020 20)',
      muted2:    'oklch(0.68 0.016 20)',
      hairline:  'oklch(0.88 0.014 20)',
      hairline2: 'oklch(0.93 0.011 20)',
      accent:    'oklch(0.58 0.14 15)',
      accentInk: 'oklch(0.99 0.008 25)',
      accentSoft:'oklch(0.91 0.05 15)',
      ok:        'oklch(0.55 0.10 145)',
      warn:      'oklch(0.65 0.13 70)',
      bad:       'oklch(0.55 0.16 25)',
      okSoft:    'oklch(0.93 0.04 145)',
      badSoft:   'oklch(0.93 0.05 25)',
    },
    dark: {
      bg:        'oklch(0.17 0.012 20)',
      panel:     'oklch(0.21 0.014 20)',
      panel2:    'oklch(0.245 0.016 20)',
      ink:       'oklch(0.96 0.008 25)',
      ink2:      'oklch(0.82 0.012 25)',
      muted:     'oklch(0.62 0.018 20)',
      muted2:    'oklch(0.48 0.018 20)',
      hairline:  'oklch(0.30 0.016 20)',
      hairline2: 'oklch(0.26 0.016 20)',
      accent:    'oklch(0.72 0.13 15)',
      accentInk: 'oklch(0.17 0.012 20)',
      accentSoft:'oklch(0.32 0.06 15)',
      ok:        'oklch(0.72 0.11 145)',
      warn:      'oklch(0.78 0.12 70)',
      bad:       'oklch(0.70 0.14 25)',
      okSoft:    'oklch(0.28 0.04 145)',
      badSoft:   'oklch(0.30 0.06 25)',
    },
  },
};

// Typography pairings. Each declares display, ui, mono families + tracking.
const FONTS = {
  literary: {
    label: 'Literary',
    display: '"Newsreader", "Times New Roman", Georgia, serif',
    displayWeight: 500,
    displayTracking: '-0.022em',
    displayLeading: 1.06,
    ui:      '"Inter Tight", "Inter", system-ui, sans-serif',
    uiTracking: '-0.01em',
    mono:    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    monoTracking: '0.04em',
  },
  geometric: {
    label: 'Geometric',
    display: '"Geist", "Inter", system-ui, sans-serif',
    displayWeight: 500,
    displayTracking: '-0.025em',
    displayLeading: 1.05,
    ui:      '"Geist", "Inter", system-ui, sans-serif',
    uiTracking: '-0.012em',
    mono:    '"Geist Mono", ui-monospace, monospace',
    monoTracking: '0.02em',
  },
  editorial: {
    label: 'Editorial',
    display: '"Instrument Serif", "Times New Roman", Georgia, serif',
    displayWeight: 400,
    displayTracking: '-0.015em',
    displayLeading: 1.02,
    ui:      '"DM Sans", system-ui, sans-serif',
    uiTracking: '-0.008em',
    mono:    '"JetBrains Mono", ui-monospace, monospace',
    monoTracking: '0.04em',
  },
  hyperlegible: {
    label: 'Hyperlegible',
    display: '"Atkinson Hyperlegible", system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.01em',
    displayLeading: 1.1,
    ui:      '"Atkinson Hyperlegible", system-ui, sans-serif',
    uiTracking: '0em',
    mono:    '"JetBrains Mono", ui-monospace, monospace',
    monoTracking: '0.04em',
  },
};

const DENSITIES = {
  compact: {
    label: 'Compact',
    pad: 14, padLg: 18, gap: 10, gapLg: 14, radius: 14, title: 26,
  },
  regular: {
    label: 'Regular',
    pad: 18, padLg: 22, gap: 14, gapLg: 18, radius: 18, title: 30,
  },
  comfy: {
    label: 'Comfy',
    pad: 22, padLg: 26, gap: 18, gapLg: 22, radius: 22, title: 34,
  },
};

// Build a CSS-variable style block for a given palette + font + density.
function buildThemeVars(paletteKey, dark, fontKey, densityKey) {
  const p = PALETTES[paletteKey] || PALETTES.sand;
  const colors = (dark ? p.dark : p.light);
  const f = FONTS[fontKey] || FONTS.literary;
  const d = DENSITIES[densityKey] || DENSITIES.regular;
  const vars = {};
  for (const [k, v] of Object.entries(colors)) vars['--' + k] = v;
  vars['--font-display'] = f.display;
  vars['--font-display-w'] = f.displayWeight;
  vars['--font-display-track'] = f.displayTracking;
  vars['--font-display-lead'] = f.displayLeading;
  vars['--font-ui'] = f.ui;
  vars['--font-ui-track'] = f.uiTracking;
  vars['--font-mono'] = f.mono;
  vars['--font-mono-track'] = f.monoTracking;
  vars['--pad'] = d.pad + 'px';
  vars['--pad-lg'] = d.padLg + 'px';
  vars['--gap'] = d.gap + 'px';
  vars['--gap-lg'] = d.gapLg + 'px';
  vars['--radius'] = d.radius + 'px';
  vars['--title-size'] = d.title + 'px';
  vars['--scheme'] = dark ? 'dark' : 'light';
  return vars;
}

// Theme — host wraps each artboard with this so vars cascade in.
function Theme({ paletteKey = 'sand', dark = false, fontKey = 'literary', densityKey = 'regular', children, style = {}, className = '' }) {
  const vars = React.useMemo(
    () => buildThemeVars(paletteKey, dark, fontKey, densityKey),
    [paletteKey, dark, fontKey, densityKey]
  );
  return (
    <div className={'hp ' + className} style={{
      ...vars,
      width: '100%', height: '100%',
      background: 'var(--bg)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-ui)',
      letterSpacing: 'var(--font-ui-track)',
      colorScheme: dark ? 'dark' : 'light',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

Object.assign(window, { PALETTES, FONTS, DENSITIES, Theme, buildThemeVars });
