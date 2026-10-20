// E · Svep's entry in the bake-off's direction registry (../directions.ts).

import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'e',
  slug: 'e-svep',
  name: 'Svep',
  tagline: 'Ett kort i taget',
  traits: [
    'En sak i taget på skärmen: appen är en kortlek du går igenom, och nästa handling är alltid kortet framför dig – byggt mot beslutströgheten vid ADHD.',
    'Idag är en lek med sju kort: överst Fortsätt med skärmens enda fyllda knapp, sedan planens tre delar och till sist prognosen med sitt förbehåll, fällan och de senaste passen. Räknaren och kortregistret syns alltid; svep, ←/→, pilarna eller registret flyttar, ↵ tar kortet. Vid lekens ände går ←/→ vidare till bake-offens skärmar.',
    'Kort av riktigt material – papperskorn och ett mjukt inre ljus – på ett stilla bord som tar färg efter delprovet på kortet framför dig. En enda stark accent, hallonmagenta, bara på det du ska göra härnäst.',
    'Schibsted Grotesk för gränssnitt och rubriker, Source Serif 4 med optisk storlek för texterna. Fysiska kortrörelser på 200–260 ms och ingen rörelse under läsning; med minskad rörelse tonas korten i stället.',
    'Läsfrågan: texten är ett högt kort som rullar och frågan nästa kort – bredvid på datorn, under texten på telefonen (Till frågan, eller svep uppåt; texten behåller sin plats). Efter svaret vänds kortet till facit, och förklaringen fortsätter som en kort serie kort, en tanke per kort, medan texten stryker under det kortet lutar sig mot.',
    'Omgång 2: Öva är tre kort – förslaget, blandat och Repetera – bredvid alla åtta delprov som små dörrkort. Kvantfrågan är ett enda stort problemkort som vänds till facit, DTK lägger provsidan som ett högt referenskort på ett ljust blad att förstora och vrida, och Repetera är dagens missar som en ändlig hand med ett register.',
    'Provpass delar ut passen som en lek, det du sett minst av överst, och lägger ett bekräftelsekort på bordet innan klockan startar. Passet går ett frågekort i taget med hela handen som register – inget facit förrän du lämnat in. Resultatet vänds och läses ett bevis i taget, och Framsteg är en liten lek med prognosen först och Historiken sist.',
  ],
  risk: 'Risk: man tappar överblicken, och svep är klumpigt på datorn. Svar: räknaren och kortregistret syns alltid, och på datorn finns piltangenter och synliga pilar.',
  references:
    'Apple Wallets kortstaplar, Readwises dagliga repetition, Arc Search-kort, Duolingos lektionskort, Things snabbinmatning.',
  // Round 2, batch 1 (hpf-qr0p.21): Öva, Kvantfråga, DTK and Repetera;
  // batch 2 (hpf-qr0p.22): Provpass, Provpassresultat and Framsteg.
  screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}
