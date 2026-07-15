// /villkor — användarvillkor (terms of use).
//
// PUBLIC route (registered in __root's PUBLIC_ROUTES) so it renders
// logged-out — reachable from the /mer hub, /konto, and any future
// landing/sign-in footer.
//
// House voice: plain Swedish, honest scope. No results promise (the
// service is a practice tool), and a truthful note that the HP questions
// are UHR's copyright, made available through the service for personal
// practice.

import { createFileRoute, Link } from '@tanstack/react-router'

import { LegalPage, type LegalSection, P } from '@/components/legal/LegalPage'
import { useFirstContentSignal } from '@/lib/motion'

export const Route = createFileRoute('/villkor')({
  component: VillkorRoute,
})

const LAST_UPDATED = '15 juli 2026'

const INLINE_LINK = {
  fontFamily: 'inherit',
  color: 'var(--ink)',
  textDecoration: 'underline',
} as const

const SECTIONS: LegalSection[] = [
  {
    eyebrow: 'Kort sagt',
    heading: 'Ett träningsverktyg för dig, personligt.',
    body: (
      <P>
        HP-Coach är ett verktyg för att öva inför högskoleprovet. Kontot är personligt, innehållet
        är till för din egen övning, och tjänsten lovar inga resultat — den ger dig frågor,
        förklaringar och struktur. Genom att använda HP-Coach godkänner du villkoren nedan.
      </P>
    ),
  },
  {
    eyebrow: 'Ditt konto',
    heading: 'Personligt och ditt eget ansvar.',
    body: (
      <>
        <P>
          Kontot är personligt — det är till för dig, inte för att delas. Håll dina
          inloggningsuppgifter för dig själv. Du ansvarar för det som görs via ditt konto.
        </P>
        <P>
          Sprid inte innehållet i tjänsten vidare. Frågorna och förklaringarna är till för din egen
          övning, inte för att publiceras eller delas ut till andra.
        </P>
      </>
    ),
  },
  {
    eyebrow: 'Innehållet',
    heading: 'Provfrågorna tillhör UHR.',
    body: (
      <P>
        Högskoleprovets frågor är upphovsrättsligt skyddade av UHR (Universitets- och
        högskolerådet). De görs tillgängliga i HP-Coach för din personliga övning. Förklaringar och
        annat pedagogiskt material är HP-Coachs och ska behandlas likadant — för eget bruk, inte för
        vidarespridning.
      </P>
    ),
  },
  {
    eyebrow: 'Inga löften om resultat',
    heading: 'Övning, inte en garanti.',
    body: (
      <P>
        HP-Coach är ett träningsverktyg. Vi kan inte lova någon viss poäng på högskoleprovet —
        resultatet beror på ditt eget arbete och på provdagen. Vi strävar efter att innehållet ska
        vara korrekt, men fel kan förekomma; hittar du något som ser tokigt ut får du gärna flagga
        det i appen.
      </P>
    ),
  },
  {
    eyebrow: 'Ändringar',
    heading: 'Vi säger till i appen.',
    body: (
      <P>
        Om villkoren ändras meddelar vi det i appen. Datumet högst upp visar när texten senast
        uppdaterades. Hur vi hanterar dina uppgifter beskrivs i{' '}
        <Link to="/integritet" style={INLINE_LINK}>
          integritetspolicyn
        </Link>
        .
      </P>
    ),
  },
]

// Exported for the legal-page render test (no router harness needed —
// same idiom as prov.tsx's Picker).
export function VillkorRoute() {
  // Boot-veil content signal (#305 owner verdict) — legal pages are
  // static local content, ready by mount.
  useFirstContentSignal()
  return (
    <LegalPage
      title="Användarvillkor."
      lastUpdated={LAST_UPDATED}
      intro="Kort om vad som gäller när du använder HP-Coach — utan juristsvenska."
      sections={SECTIONS}
      otherDoc={{ to: '/integritet', label: 'Integritetspolicy' }}
    />
  )
}
