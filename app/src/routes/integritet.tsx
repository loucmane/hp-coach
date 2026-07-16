// /integritet — integritetspolicy (privacy policy).
//
// PUBLIC route (registered in __root's PUBLIC_ROUTES) so it renders
// logged-out — reachable from the /mer hub, /konto, and any future
// landing/sign-in footer.
//
// House voice: plain Swedish, substantively truthful per the reviewed
// service plan's data inventory. Deliberately conservative on region
// claims — we say data lives "hos Cloudflare" and do NOT assert EU-only
// storage, because the D1 region has not been owner-verified. See the
// TODO comment below.

import { createFileRoute, Link } from '@tanstack/react-router'

import { LegalPage, type LegalSection, P } from '@/components/legal/LegalPage'
import { useFirstContentSignal } from '@/lib/motion'

export const Route = createFileRoute('/integritet')({
  component: IntegritetRoute,
})

const LAST_UPDATED = '15 juli 2026'

const KONTO_LINK = {
  fontFamily: 'inherit',
  color: 'var(--ink)',
  textDecoration: 'underline',
} as const

const SECTIONS: LegalSection[] = [
  {
    eyebrow: 'Kort sagt',
    heading: 'Vi sparar bara det som får övningen att fungera.',
    body: (
      <P>
        HP-Coach behöver ett konto för att känna igen dig mellan enheter, och lite studiedata för
        att kunna visa din historik och anpassa övningen. Vi säljer inga uppgifter vidare och kör
        ingen tredjepartsanalys. Nedan står exakt vad som samlas in, vem som hjälper oss att lagra
        det, och vad du kan göra med det.
      </P>
    ),
  },
  {
    eyebrow: 'Vad vi sparar',
    heading: 'Kontouppgifter och studiedata.',
    body: (
      <>
        <P>
          <strong>Kontot.</strong> Din inloggning sköts av Clerk. Där finns din e-postadress och, om
          du angett det, ditt namn. Det är vad som behövs för att logga in och för att skydda
          kontot.
        </P>
        <P>
          <strong>Studiedata.</strong> När du övar sparar vi dina försök, vilka frågor du missat,
          dina resultat och dina inställningar (tema, coach-röst och liknande). Det ligger i en
          databas hos Cloudflare (Cloudflare D1) och är kopplat till ditt konto så att din historik
          följer med mellan enheter.
        </P>
        <P>
          <strong>Ingen tredjepartsanalys.</strong> Vi använder inga externa analysverktyg idag. Den
          enkla användningsstatistik appen räknar med stannar lokalt i din webbläsare och skickas
          inte vidare.
        </P>
      </>
    ),
  },
  {
    eyebrow: 'Vem som hjälper oss',
    heading: 'Tre leverantörer, inga fler.',
    body: (
      <>
        <P>
          <strong>Cloudflare</strong> står för drift, databas och lagring — själva appen och din
          studiedata ligger hos dem.
        </P>
        <P>
          <strong>Clerk</strong> sköter inloggningen och lagrar dina kontouppgifter.
        </P>
        <P>
          <strong>Sentry</strong> tar emot felrapporter när något i appen går sönder (aktiveras vid
          lansering). Rapporterna innehåller tekniska detaljer om felet — aldrig dina svar, din
          e-post eller dina kakor; sådant skalas bort innan rapporten skickas.
        </P>
        {/* TODO(owner): verify D1 storage jurisdiction before making any EU-only
            region claim. Until confirmed, keep the wording at "hos Cloudflare"
            and do NOT state that data is stored exclusively within the EU. */}
        <P>
          Uppgifterna lagras hos Cloudflare. När du raderar något försvinner det direkt ur den
          aktiva databasen; eventuella säkerhetskopior tunnas ut och är borta inom 30 dagar. Vi
          betalar inte för någon betaltjänst ännu, så det finns ingen betalningsleverantör inblandad
          i dagsläget.
        </P>
      </>
    ),
  },
  {
    eyebrow: 'Dina rättigheter',
    heading: 'Se, exportera, radera.',
    body: (
      <>
        <P>
          <strong>Se och exportera.</strong> Du kommer åt din data i appen under{' '}
          <Link to="/konto" style={KONTO_LINK}>
            Konto → Exportera
          </Link>
          , där du kan ladda ner den.
        </P>
        <P>
          <strong>Radera.</strong> Du raderar ditt konto och din studiedata själv från{' '}
          <Link to="/konto" style={KONTO_LINK}>
            Konto-sidan
          </Link>
          . Allt tas bort direkt; säkerhetskopior är borta inom 30 dagar.
        </P>
        <P>
          <strong>Ångerrätt.</strong> När HP-Coach blir en betald tjänst gäller distansavtalslagens
          ångerrätt för köpet. Så länge tjänsten är gratis finns inget köp att ångra.
        </P>
      </>
    ),
  },
  {
    eyebrow: 'Barn och unga',
    heading: 'Tänkt för studenter.',
    body: (
      <P>
        HP-Coach riktar sig till dig som pluggar inför högskoleprovet. Är du under 18 år behöver du
        målsmans samtycke innan du gör ett framtida köp i tjänsten.
      </P>
    ),
  },
  {
    eyebrow: 'Ändringar',
    heading: 'Vi säger till i appen.',
    body: (
      <P>
        Om den här policyn ändras på ett sätt som spelar roll för dig meddelar vi det i appen.
        Datumet högst upp visar när texten senast uppdaterades.
      </P>
    ),
  },
]

// Exported for the legal-page render test (no router harness needed —
// same idiom as prov.tsx's Picker).
export function IntegritetRoute() {
  // Boot-veil content signal (#305 owner verdict) — legal pages are
  // static local content, ready by mount.
  useFirstContentSignal()
  return (
    <LegalPage
      title="Integritetspolicy."
      lastUpdated={LAST_UPDATED}
      intro="Den här sidan beskriver vilka uppgifter HP-Coach samlar in, varför, och vad du kan göra med dem — utan juristsvenska."
      sections={SECTIONS}
      otherDoc={{ to: '/villkor', label: 'Användarvillkor' }}
    />
  )
}
