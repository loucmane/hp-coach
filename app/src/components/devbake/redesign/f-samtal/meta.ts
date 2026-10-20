// F · Samtal's entry in the bake-off's direction registry (../directions.ts).

import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'f',
  slug: 'f-samtal',
  name: 'Samtal',
  tagline: 'En lugn coach i dialog',
  traits: [
    'Appen talar med dig som en lugn handledare: varje skärm är ett kort samtal med tydliga svarsknappar – coachen föreslår, du väljer, och du behöver aldrig skriva.',
    'Hanken Grotesk för gränssnittet, Lora för texterna. Ett mjukt neutralt underlag, coachens repliker på en svag havreton och dina svar i plommon – helfyllt plommon bara för skärmens enda handling.',
    'Menyn är en lista över samtal: de fem dörrarna med en rad om vad som väntar där, som i en meddelandeapp. Hopfälld blir den en smal list med runda ikoner.',
    'Idag är en enda fråga – ”Du var mitt i LÄS, fråga 3 av 4. Fortsätta?” – med två svar. Plan, prognos med fotnot och fälla kommer som korta meddelandekort, de senaste passen som en replik.',
    'I övningen ligger texten kvar som ett lugnt dokument; frågan kommer som en replik och alternativen är dina svar, med en svarsrad utan textfält. Facit är ett kort samtal – coachen frågar vad som lockade dig, och du kan svara eller hoppa över – och sedan coachens anteckningar, med ¶-hänvisningar som lyser upp i texten.',
    'Öva är ett förslag med skäl och alla åtta delprov som svarsknappar i fast ordning; Repetera visar vad som är redo nu och tar en avgränsad omgång. I kvant ligger uppgiften som en bilaga i coachens replik med matematiken satt, och DTK-underlaget är ett eget dokument att förstora, vrida och flytta.',
    'Provpasset är ett åtagande i ett enda utbyte: coachen föreslår passet du sett minst, och klockan startar först efter villkoren. Under passet tystnar coachen – frågan, dina svar och en svarsöversikt, inget facit. Resultatet sägs rakt ut med underlaget bredvid poängen, och Framsteg är en iakttagelse och ett svar, med prognos, veckor, delprov och Historik som bilagor.',
  ],
  risk: 'Risk: långsamt och chattbottsklyschigt. Svar: inga skrivprickar, inga avatarer och inget textfält – replikerna kommer direkt med en tonad entré på 120 ms, Nästa finns alltid i svarsraden, coachens fråga går att hoppa över och ”Visa allt” fäller ut hela förklaringen på en gång.',
  references:
    'ChatGPT:s studieläge, Khanmigo, Duolingos ”Förklara mitt svar”, Pi, iMessages återhållsamhet.',
  screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}
