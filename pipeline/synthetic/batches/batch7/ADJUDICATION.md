# Batch 7 — adjudication package (2026-07-24)
**7 enheter / 20 frågor — tredje raka batchen med noll grindfällningar.** Hela kedjan inkl. V-FINAL; promote exit 0.
**Svara fritt:** `godkänn alla`, `godkänn alla utom X`, `ändra X: …`, `avvisa Y`.

---

## elf-b7-001 · ELF · The Fastest Mend
*Grind:* SURVIVED_CLEAN · *language:* CORRECTED · *pedagogy:* SOUND · *integrated:* MINOR_NOTES · *final_verify:* VERIFIED_NOTES

### Text

For years the case for a resilient cable network has been made with a stopwatch. When a submarine cable breaks — snagged by an anchor, buried under a seabed slide, chafed through on rock — the traffic it carried goes dark until a repair ship reaches the spot, raises the broken ends with a grapnel, and splices them together again. The faster that mend, the story runs, the safer the network, and so the pitch to any operator is always the same: cut the mean time to repair, put more and faster ships to sea. Every hour shaved off a repair is an hour of outage prevented, the argument goes, and a fleet that mends quicker is a network that fails less. It is a clean story, and it has set the targets operators measure themselves against. What it mostly skips is that an outage costs a network not by its hours alone, but by how much traffic had nowhere else to go while the ship was still steaming out.

That gap was put to a working network. At the Meridian cable-maintenance consortium, a team led by the reliability engineer Nadia Osei tracked eight years of faults across a dozen sea regions, holding the fault rate and the cable types steady but varying one thing: whether a region built up repair-ship capacity faster than it spread its traffic across independent routes. On the number everyone watches, the result came out exactly as advertised. Adding ships cut the mean time to repair, and it did so right across the regions they tracked — in the regions that widened their routes to match, and in the regions that simply funnelled more traffic onto the cables they already had, alike. Measured by the hours it took to mend a break, more ships was simply a faster mend.

Then Osei's team stopped timing the ships and started weighing what the faults actually cost. A break hurts a network in proportion to the traffic stranded behind it: mend a lightly loaded cable in a day and little is lost; mend a cable carrying half a region's traffic in half that time, and the loss is still enormous. In the regions that grew their route diversity in step with the fleet, the connectivity lost to faults kept falling as ships were added, even where the fleet had grown large. In the regions that added ships without spreading the load, the lost connectivity fell slowly at first and then, once a single cable had come to carry more than about a third of a region's traffic, stopped falling almost entirely. Past that point each new ship still shaved another hour off the mend, and the hour bought next to nothing — because the fault that mattered was the one no repair speed could paper over: a single overloaded cable down, and no path left to carry what it had dropped. Time the ships, and the fastest fleet looks the safest. Weigh what the faults cost, and it does not.

This is not how the case is usually made. Bjorn Haugland, who runs the largest of the consortium's repair fleets, puts it with no such hedging. "Shave the repair time — always, whatever the map happens to look like," he told me. "There is no such thing as too many ships. A cable breaks, you mend it faster; you do not sit and redraw your routes." Osei is more guarded. Route diversity can indeed be widened, she agrees, but only slowly and never cheaply: a fresh independent path means new landings, new permits, and stretches of seabed nobody has surveyed, and no operator she knows can diversify fast enough to make repair speed the only thing that counts.

The eight-year record, read whole, is more divided than Haugland's rule allows. It does not show that faster ships are wasted — the mends they buy are real, and where the routes stay diverse the gains run all the way up. What it shows is that "quicker repair" and "less lost connectivity" hold together only while no single cable carries too much of the load; past that, in the regions that let their traffic concentrate, the fast mends quietly stop buying resilience. The number that matters, in the end, is not how fast a fleet can mend a break. It is how little the network leans on any one cable while it waits. A network that spreads its traffic can absorb almost any fault. One that funnels it has a floor on what a fault can cost, and that floor sits well above what the repair-time targets like to admit.
— Clara Voss

grapnel = a hook dragged along the seabed to catch and raise a broken cable for repair
landing = the shore station where a submarine cable comes up out of the sea

### Fråga 1

What is this text mainly about?

- **A.** That the surest way to make a submarine cable network fail less is to cut the mean time to repair by putting more and faster ships to sea.
- **B.** That faster repair genuinely helps, but a cable network only stays resilient as long as no single cable is left carrying too much of the traffic. **◀ NYCKEL**
- **C.** That operators should give priority to shielding their busiest submarine cables from the anchors and trawls that most often break them.
- **D.** That a broken submarine cable must be located, raised from the seabed with a grapnel, and spliced back together before its traffic can return.

### Fråga 2

What does the text say happened to the mean time to repair as repair-ship capacity was increased?

- **A.** Adding ships shortened the mean time to repair in the route-diversifying regions and the traffic-concentrating regions alike. **◀ NYCKEL**
- **B.** Adding ships shortened the mean time to repair, and it would have gone on shortening it without any limit however large the fleet was allowed to grow.
- **C.** The mean time to repair fell only in the regions that widened their routes, not in those that funnelled traffic onto existing cables.
- **D.** The mean time to repair fell fastest for faults caused by dragging anchors, which the ships could reach and mend more quickly than seabed slides.

### Fråga 3

According to the text, what happened to the connectivity lost to faults in the regions that added ships but did not spread out their traffic?

- **A.** It went on falling steadily as more ships were added, staying reassuringly low even in the regions where the repair fleet had grown to its very largest.
- **B.** It dropped to almost nothing the moment the region first put an extra repair ship to sea.
- **C.** It fell slowly at first and then stopped falling almost entirely once a single cable carried more than roughly a third of the region's traffic. **◀ NYCKEL**
- **D.** It climbed back down over the years as crews learned to pre-position their ships nearer the cables most likely to break.

### Fråga 4

What does the text imply about why the route-diversifying regions kept losing little connectivity at a large fleet size while the traffic-concentrating regions did not?

- **A.** Because the diversifying regions happened to sit in calmer waters where faults were rarer and their ships could reach a break sooner.
- **B.** Because a network can never lose only a little connectivity to a fault unless every single one of its routes is fully duplicated by a second cable laid alongside.
- **C.** Because a broken cable has to be raised and spliced before its traffic can return, however many ships stand ready to do the work.
- **D.** Because what sets a fault's cost is the share of traffic on the one cable that breaks, not the number of ships on hand to mend it. **◀ NYCKEL**

### Fråga 5

What is the writer's attitude towards Haugland's claim that there is no such thing as too many repair ships?

- **A.** Broadly persuaded: she largely accepts Haugland's rule and treats the concentrating regions' plateau as a minor gap that still-faster mends will close.
- **B.** Qualified: she grants that faster repair genuinely helps but holds that piling on ships stops buying resilience once a network funnels its traffic. **◀ NYCKEL**
- **C.** Convinced: she shares Haugland's certainty that a fleet simply cannot have too many ships, whatever the network's routes happen to look like.
- **D.** Dismissive: she concludes that the outages a fast fleet prevents are too slight to be worth the cost of running the repair ships at all.

---

## elf-b7-002 · ELF · Cut to Size
*Grind:* SURVIVED_FLAGGED · *language:* CORRECTED · *pedagogy:* SOUND · *integrated:* MINOR_NOTES · *final_verify:* VERIFIED_NOTES
- [G-DISTRACTOR q:4] ARGUABLE: textually true ('ordered its entire correspondence to be kept on the folding size') and tempting, but the prompt asks what spread the size AMONG ORDINARY FIRMS once the office had adopted it

### Text

Everyone who has folded a sheet of office paper in half and found the two halves the same shape as the whole knows the trick a modern paper standard is built on: choose the one proportion that survives folding, and every size in the family is just the size above it cut in two. It is the kind of fact that looks like its own explanation. The proportion is neat, the neatness is useful, and so — the usual story runs — the neat proportion won. When the Uniform Papers Committee sat down in 1911 to thin the hundreds of sheet sizes then in trade down to a single ordered family, it is supposed to have simply recognised the better geometry and written it into the rules.

The historian Marta Vey, who has read the committee's minutes rather than its published report, tells a less tidy story. The geometry was real and the committee knew it, but it did not walk in agreed. Two proportions reached the last round of voting: the folding one everyone now uses, and a squarer sheet that wasted less off the standing rolls the mills already cut and would have cost the trade less to take up. The squarer sheet had the printers behind it. The folding sheet won the final round by a single voice, and even then several members recorded that they doubted a rule written on paper would change what firms actually bought.

For its first year the doubters looked right. Vey counted the firms filing returns on the new sizes: a year after the rule, fewer than thirty had taken it up, most of them the stationers who had sat on the committee. What changed things was not the geometry, which had not moved, but a customer. In 1913 the Northern Assurance Office, then refitting its record rooms, ordered its entire correspondence to be kept on the folding size and had its filing cabinets built to fit. The office bought paper and cabinets in such quantity that the cabinet makers, rather than tool up twice, began offering only the one size; and a firm that bought those cabinets found the folding sheet was the sheet that fitted the drawer. Within four years the count of firms on the standard had passed six hundred. The proportion that had scraped a single vote was suddenly the one everybody kept.

This is not how the design press likes to tell it. Piet Halloran, whose short history of the standard has done much to fix the elegant version in people's minds, will have none of the accident. "The maths was always going to win," he told me. "A proportion that good does not need a lucky customer; sooner or later every office would have arrived at it on its own." Vey is more careful. The geometry was necessary, she agrees — a squarer sheet would have locked into the cabinets just as firmly, and had it won the vote it, not the folding one, would be the standard we now cannot imagine doing without. What the geometry was not, on the evidence of the minutes and the returns, was sufficient. Something had to make the size worth changing to, and in this case it was a drawer, not a diagram.

Read whole, the record cuts against both the tidy story and Halloran's version of it. It does not show that the folding proportion was a bad choice; the sheet is convenient, and the offices that took it up had no reason to regret it. What it shows is that being the better shape did not, by itself, make it the common one. A standard, on Vey's telling, is not the idea a committee endorses but the size a large enough buyer makes everyone else's problem. The elegant proportion had to wait for a filing cabinet before it could become the thing we now assume it always was.
— Elin Sarauw

### Fråga 1

What is this text mainly about?

- **A.** That a sheet proportion elegant enough to survive folding was always bound to be recognised as the best one and duly written into the rules.
- **B.** That every size in the paper family is simply the size above it folded in half, which is what makes the folding proportion so convenient to use.
- **C.** That the folding proportion became the common standard less through its own elegance than because one large buyer's cabinet order pushed the trade onto it. **◀ NYCKEL**
- **D.** That printers held out against the folding sheet because a squarer proportion wasted less paper off the mills' standing rolls and cost less.

### Fråga 2

What does the text say about how the committee settled on the folding proportion?

- **A.** The members agreed on it comfortably, most of them preferring its geometry to the squarer sheet from the very first round of voting onward.
- **B.** It won the final round by a single vote over a squarer sheet that the printers preferred and that would have cost the trade less to adopt. **◀ NYCKEL**
- **C.** The squarer, cheaper sheet actually carried the committee's vote at first but was quietly set aside once the mills refused to cut it to that shape.
- **D.** The committee could not choose between the two proportions and in the end left the final decision to the paper mills that would produce the sheets.

### Fråga 3

According to the text, how did take-up of the standard change after the Northern Assurance Office's 1913 order?

- **A.** It changed little, continuing at roughly the earlier pace, with the committee's own stationers still the main firms keeping to the new sizes.
- **B.** It spread only after the government stepped in and made the folding size compulsory for all official and commercial correspondence.
- **C.** It rose steadily until, within a few years, every paper-using firm in the whole trade had gone over entirely to the folding size.
- **D.** It climbed sharply: within four years the count of firms on the standard had passed six hundred, up from fewer than thirty a year after the rule. **◀ NYCKEL**

### Fråga 4

What does the text suggest actually spread the folding size among ordinary firms once the Assurance Office had adopted it?

- **A.** That the cabinet makers, meeting the office's bulk order, built only that size, so a firm buying cabinets found the folding sheet was the one that fitted its drawers. **◀ NYCKEL**
- **B.** That the Northern Assurance Office had ordered all of its own correspondence to be kept and filed on the folding size.
- **C.** That the office publicised the folding proportion's geometric advantages until other firms were persuaded of its merits and chose to switch across.
- **D.** That the new filing cabinets were physically incapable of holding any sheet but the folding size, leaving every firm that bought one no other option at all.

### Fråga 5

What is the writer's attitude towards Halloran's claim that the folding proportion 'was always going to win'?

- **A.** Broadly sympathetic: she treats the filing-cabinet order as a lucky push that merely hurried along an outcome the proportion's own merits would have reached in any case.
- **B.** Unconvinced on the decisive point: she grants the geometry was necessary but holds, on the minutes and returns, that it was not enough without a large buyer. **◀ NYCKEL**
- **C.** In full agreement: she too concludes that a proportion that good needed no lucky customer and would sooner or later have prevailed anywhere on its own.
- **D.** Openly scornful: she regards the folding sheet as a poor choice that a single office ended up forcing on an unwilling and resistant trade.

---

## elf-b7-003 · ELF · The Forgiving Majority
*Grind:* SURVIVED_CLEAN · *language:* CLEAR · *pedagogy:* SOUND · *integrated:* MINOR_NOTES · *final_verify:* VERIFIED

### Text

The trouble with right-handed tools, the ergonomist Nadia Bruck argues, is rarely the tool. Testing volunteers on can openers, ladles and school scissors, her team at the Vellum workshop found that left-handers fumbled the scissors badly — the upper blade hides the cut line from the left hand — but managed the opener and the ladle almost as smoothly as anyone once they were allowed to turn the object rather than the hand. The scissors, she notes, force a grip that cannot be reversed; the opener and the ladle only invite one. Designers who set out to cure left-handed frustration, Bruck suggests, tend to make mirrored copies of everything in sight, when the cheaper remedy is to pick out the few tools that genuinely lock the hand into a single approach and to leave the forgiving majority alone.
— Owen Rask

### Fråga 1

What distinction does the text draw between the scissors and the other tools that were tested?

- **A.** The opener and the ladle gave left-handers more difficulty than the scissors did, because those tools demand steadier force from the weaker hand.
- **B.** All three tools frustrated the left-handed volunteers about equally, right up until they were finally allowed to hold the hand still and turn the object.
- **C.** The scissors force one grip that cannot be reversed, whereas the opener and the ladle can be managed by turning the object rather than the hand. **◀ NYCKEL**
- **D.** The scissors were the only genuinely right-handed tool in the test, which is why the left-handers struggled so much more with them.

---

## elf-b7-004 · ELF · Long Grass
*Grind:* SURVIVED_CLEAN · *language:* CLEAR · *pedagogy:* SOUND · *integrated:* CONSISTENT · *final_verify:* VERIFIED_NOTES

### Text

Most airfields keep their grass cropped close, on the reasoning that short turf leaves gulls and lapwings nowhere to hide. At Kettle Vane airport the wildlife officer Sanna Iled tried the opposite on two grass belts for three seasons, letting the sward grow tall and rank. Bird counts on the long-grass belts fell by roughly half, and the birds that matter most — the flocking species that rise in numbers into an aircraft's path — fell furthest. Tall grass, Iled reasons, hides an approaching fox or hawk from the birds, not the birds from anyone, so open-country flockers that will not feed where they cannot watch simply go elsewhere. She is careful about the limits: a few solitary species were unmoved, and letting grass grow near the runway edge raises its own worries about drainage and drifting seed.
— Marco Yates

### Fråga 1

According to Iled, why did letting the grass grow tall reduce the birds that most threaten aircraft?

- **A.** Because the tall, rank grass held far fewer of the insects and seeds that such flocking birds come onto an airfield to feed on.
- **B.** Because tall grass conceals an approaching fox or hawk from the birds, and flocking open-country species will not feed where they cannot watch for danger. **◀ NYCKEL**
- **C.** Because the dense, high sward physically blocked the flocking birds from rising quickly enough to reach an aircraft's flight path.
- **D.** Because the taller grass drove away every species that had previously been using the two belts of the airfield.

---

## las-b7-001 · LÄS · Brevbäraren som gick före järnvägen
*Grind:* SURVIVED_FLAGGED · *language:* CORRECTED · *pedagogy:* SOUND · *integrated:* CONSISTENT · *final_verify:* VERIFIED_NOTES
- [G-DISTRACTOR q:4] ARGUABLE: echoes the closing ('inte bara räls och ånga ... utan lika mycket en granne med en väska') but overstates it. The text credits BOTH equally ('lika mycket') and gives rails the main routes ('

### Text

När historikern Elisabet Rahm gick igenom de gulnade turlistorna från Ådalens postkontor väntade hon sig en jämn och förutsägbar kurva. Det hon fann var något annat. I de socknar där den lokala postrundan sköttes av en bofast granne, och inte av en inhyrd bärare från en annan bygd, tycktes brevmängden växa snabbare under 1880-talet — men bara där avståndet till närmaste järnvägsstation var stort.

Lantbrevbäringen infördes i Sverige mot slutet av 1870-talet. Dessförinnan stannade posten vid kyrkbyns postkontor, och den enskilde fick själv ta sig dit för att hämta sina brev, ofta en resa på flera timmar fram och åter. Den nya ordningen var till en början blygsam. Bäraren var sällan någon utbildad tjänsteman, utan oftare en hemmansägare eller torpare som mot en mindre årlig ersättning åtog sig att gå, ro eller åka en fastställd runda, vanligen ett par gånger i veckan. Uppdraget sköttes som bisyssla vid sidan av jordbruket, och en enda runda kunde sträcka sig flera mil genom skog och utmed älven. Någon fast lön i egentlig mening var det inte tal om; ersättningen var symbolisk och rundan behölls ofta i åratal av samma person.

Rahms undersökning vilar på ett tålmodigt arkivarbete. Hon har jämfört bevarade turlistor och sockenräkenskaper från trettiofyra socknar i mellersta Norrland mellan 1878 och 1895. För varje runda har hon antecknat vem som var bärare, hur ofta posten gick och, där siffror alls finns bevarade, hur många försändelser som passerade. Sammanlagt rör det sig om närmare nittontusen noteringar. Metoden har sina luckor: för somliga år saknas listorna helt, och privatbrev och tjänstepost fördes inte alltid i skilda kolumner, vilket tvingat henne att göra försiktiga uppskattningar snarare än exakta räkningar. För att skilja bofasta bärare från inhyrda har hon utgått från kyrkböckernas uppgifter om var var och en var mantalsskriven. Vintertid, då rundan inte sällan gick på skidor, blev anteckningarna glesare, och de månaderna har hon lämnat därhän.

Mönstret som ändå framträder är att en bofast bärare tycks ha spelat roll. Där rundan sköttes av någon som själv bodde i socknen ökade antalet privatbrev snabbare än där bäraren kom utifrån, och skillnaden var som tydligast i de avlägsna socknar dit järnvägen ännu inte nått. Förklaringen, menar Rahm, ligger i förtrogenheten. En granne visste vilka som väntade brev, kunde lämna en försändelse i handen i stället för i en avlägsen låda och togs ofta i anspråk för små ärenden som förkortade vägen till posten för alla. Där en station låg nära spelade det däremot mindre roll vem som bar ut breven, eftersom vägen till posten redan var kort. Räknat per hundra hushåll rörde det sig om en försiktig men märkbar skillnad, störst under de år då de nya folkskolorna just hunnit sätta spår i bygden.

I en av listorna återkommer namnet Per Ersson, bofast i en by vars namn nu är svårläst. Vid sidan av breven har någon noterat att han förde med sig medicin från apoteket, budkavlar om auktioner och en gång en tjärad tunna. Sådana anteckningar är förstås för få och för oregelbundna för att räknas som belägg, men de ger en aning om vad rundan kunde betyda utöver själva posten. För somliga hushåll var brevbäraren den enda regelbundna förbindelsen med världen bortom socknen. Att tjära och budkavlar samsades med breven i väskan säger något om hur tunn gränsen var mellan post och vanlig grannsämja.

Bilden är samtidigt långt ifrån entydig. I ett dussin socknar syns ingen skillnad alls, och i två fall växte breven snabbast just där bäraren var utsocknes. Rahm är noga med att inte överdriva. ”Vi ser ett mönster, inte en lag”, skriver hon. En besvärande möjlighet är att läskunnigheten steg olika fort i olika bygder, och att det är den, snarare än bäraren, som driver siffrorna. Att helt skilja de två åt låter sig inte göras med det material som finns bevarat.

Andra forskare invänder på ett annat sätt. En bofast bärare kan ha varit mer angelägen att bokföra varje brev noggrant, vilket skulle blåsa upp siffrorna utan att någon verklig ökning ägt rum. En av dem, ekonomhistorikern Tore Lundqvist, framhåller att breven lika gärna kan ha bytt hand utan att bokföras alls när grannar ändå möttes, så att de verkliga volymerna är omöjliga att fastställa i efterhand. Dessutom var många rundor så glest trafikerade att en enda storbrukares korrespondens kunde förskjuta hela statistiken för en socken. Rahm medger invändningarna, men håller fast vid att mönstret återkommer i för många socknar för att avfärdas som en tillfällighet.

Ändå pekar materialet mot något som lätt glöms bort i berättelsen om hur landet knöts samman. Det var inte bara räls och ånga som bar posten ut i bygderna, utan lika mycket en granne med en väska över axeln. Tekniken drog fram de stora stråken; den sista biten, ända fram till grinden, gick länge till fots.
— Ingrid Sahlén, historieskribent

turlista = förteckning över en postrundas hållplatser och tider
utsocknes = från en annan socken

### Fråga 1

Vad var, enligt texten, huvudresultatet av Rahms undersökning?

- **A.** Att posten bokfördes noggrannare där bäraren var bofast, vilket förklarar hela den uppmätta ökningen av breven.
- **B.** I avlägsna socknar utan järnväg växte privatbreven snabbare där en bofast granne bar ut posten än där bäraren kom utifrån. **◀ NYCKEL**
- **C.** Oavsett hur långt det var till järnvägen ökade all slags post snabbare så snart rundan sköttes av någon bofast i socknen.
- **D.** Att turlistor och sockenräkenskaper kunde sammanställas till närmare nittontusen jämförbara noteringar.

### Fråga 2

Hur beskriver texten hur lantbrevbäringen först var ordnad?

- **A.** Varje socken ålades att anställa en heltidsanställd posttjänsteman som ensam ansvarade för utdelningen.
- **B.** Bäraren avlönades per försändelse och tjänade följaktligen mest i de socknar där posttrafiken råkade vara som allra tätast.
- **C.** Posten delades ut dagligen längs korta rundor i kyrkbyns omedelbara närhet.
- **D.** Rundan sköttes oftast som bisyssla av en bofast bonde eller torpare mot en blygsam årlig ersättning. **◀ NYCKEL**

### Fråga 3

Vad kan man, utifrån texten, dra för slutsats om varför en bofast bärare betydde mindre i socknar nära en järnvägsstation?

- **A.** Där var vägen till posten redan kort, så den fördel förtrogenheten gav en bofast bärare tillförde mindre. **◀ NYCKEL**
- **B.** Järnvägen gjorde bofasta bärare överflödiga, och därför fick de avlägsna socknarna en sämre fungerande postgång.
- **C.** Stationssocknarna hade fler brevskrivare eftersom de var tätare befolkade och mer läskunniga.
- **D.** Nära en station saknade det helt och hållet betydelse vem som skötte rundan, och inga brev kom någonsin bort.

### Fråga 4

Vilket påstående överensstämmer bäst med texten?

- **A.** Bevarade turlistor och sockenräkenskaper ger en genomgående tillförlitlig och i det närmaste heltäckande bild av hela 1800-talets postgång på landsbygden.
- **B.** Det var framför allt de bofasta brevbärarna, inte järnvägen, som knöt samman den svenska landsbygden.
- **C.** Även enkla, personliga inslag i postgången kan ha bidragit till att knyta samman landsbygden, om än på ett svårbevisat vis. **◀ NYCKEL**
- **D.** Lantbrevbäringen infördes främst för att bespara allmogen den långa resan till kyrkbyns postkontor.

---

## las-b7-002 · LÄS · Fler kilometer räcker inte — cykelnätet måste hänga ihop
*Grind:* SURVIVED_CLEAN · *language:* CLEAR · *pedagogy:* SOUND · *integrated:* CONSISTENT · *final_verify:* VERIFIED_NOTES

### Text

Varje gång en kommun vill visa handlingskraft i cykelfrågan mäts framgången i kilometer. Så många meter ny cykelbana, så många miljoner investerade. Men den som pendlar på cykel vet att det inte är längden som avgör, utan var banan tar slut.

I Kvarnby, där jag själv trampar till jobbet, byggdes förra året en bred och fin cykelväg längs Ringleden. Den håller i tre kilometer och upphör sedan tvärt vid en rondell, där cyklisten lämnas att samsas med lastbilarna. Trafikplaneraren Ellen Sundqvist har följt flödena före och efter bygget. Antalet cyklister ökade, men bara marginellt, och mätningarna tyder på att de flesta som vågar sig ut redan var vana pendlare. De nya cyklister man hoppats på uteblev.

Sundqvists slutsats är försiktig men tydlig: det är sammanhanget som lockar, inte sträckan i sig. En enda farlig passage tycks väga tyngre i cyklistens beslut än flera kilometer trygg väg. ”Man cyklar inte halva vägen”, säger hon. ”Kedjan är aldrig starkare än sitt sämsta glapp.”

Här bör kommunerna tänka om. Att bygga långa, obrutna stråk genom en förort ser mindre imponerande ut på kartan än att strö korta sträckor lite varstans, men effekten på pendlingen är sannolikt större. Jag menar inte att antalet kilometer är oväsentligt — självklart behövs de. Poängen är att en investering som lämnar ett enda otryggt glapp kvar riskerar att ge nästan ingenting tillbaka.

Invändningen kommer genast: sammanhängande stråk kräver mark, och marken finns sällan där den behövs. Det är sant, och ibland tvingar verkligheten fram kompromisser. Men även då bör den farligaste punkten åtgärdas först, inte den som är enklast att asfaltera.

Om vi vill se fler nya cyklister måste vi sluta räkna meter och börja räkna glapp.
— Tobias Renander, cykelpendlare och debattör

### Fråga 1

Vad visade, enligt texten, Ellen Sundqvists mätningar vid den nya cykelvägen?

- **A.** Ökningen bestod främst av nya cyklister, medan de redan vana pendlarna tycktes ha dragit sig undan.
- **B.** Den nya cykelvägen fick antalet cyklister att öka kraftigt längs hela sträckan.
- **C.** Antalet cyklister steg bara obetydligt, mest bland redan vana pendlare snarare än nya. **◀ NYCKEL**
- **D.** Mätningarna gällde framför allt hur mycket mark det nya stråket tog i anspråk.

### Fråga 2

Vilken hållning ger textförfattaren uttryck för i debatten om cykelvägar?

- **A.** Antalet byggda kilometer är det säkraste måttet på en lyckad cykelsatsning.
- **B.** Kommuner bör sluta farliga glapp i nätet framför att maximera antalet byggda kilometer. **◀ NYCKEL**
- **C.** Eftersom marken sällan finns där den behövs är fler sammanhängande cykelvägar i praktiken ogenomförbara.
- **D.** Cykelbanornas längd saknar helt betydelse för hur många som väljer cykeln.

---

## las-b7-003 · LÄS · Rätten att plocka vilar på en tyst överenskommelse
*Grind:* SURVIVED_CLEAN · *language:* CLEAR · *pedagogy:* SOUND · *integrated:* CONSISTENT · *final_verify:* VERIFIED

### Text

Min mormor lärde mig att aldrig tömma en fläck. Man tar några, lämnar några, och går vidare. Regeln stod inte i någon lag; den bara fanns, lika självklar som att stänga grinden efter sig.

Allemansrätten brukar beskrivas som en frihet, och det är den. Men ju äldre jag blir, desto mer ser jag den som något annat: en tyst överenskommelse om att inte ta för mycket. Friheten att gå över annans mark och plocka dess svampar har aldrig vilat på paragrafer, utan på att nästan alla som utnyttjar den gör det med måtta. Det är den återhållsamheten, inte lagtexten, som håller rätten vid liv.

På senare år har jag börjat undra hur länge det håller. En morgon i somras mötte jag tre skåpbilar vid skogsbrynet utanför Torsby. Ur dem steg ett dussin plockare som med rutinerad snabbhet arbetade sig genom marken, hink efter hink av kantareller som skulle säljas vidare till restauranger i stan. De gjorde inget olagligt. Allemansrätten skiljer inte på den som plockar en påse till söndagens omelett och den som plockar för avsalu. Ändå kände jag något gnaga.

Kanske är det orättvist att döma dem. Marken tog ingen skada, och svamp växer upp igen. Det vore lätt att göra plockarna till syndabockar för en oro som egentligen handlar om något större. För det som skaver är inte handlingen i sig, utan att den tysta överenskommelsen tycks lösas upp. När plockandet blir industri försvinner måttet, och utan mått står rätten på en svagare grund än vi tror.

Jag vill inte ha fler förbudsskyltar i skogen. Skyltar vore ett tecken på att något redan gått förlorat. Men jag önskar att vi talade mer om det som mormor aldrig behövde säga: att en rätt som alla missbrukar till slut inte är någon rätt alls.
— Ingrid Fahlén

### Fråga 1

Vad var, enligt texten, plockarnas syfte med svampen de samlade vid Torsby?

- **A.** De plockade svamp till sina egna hushåll och söndagsmiddagar.
- **B.** De samlade svamp åt markägaren som hade anlitat dem.
- **C.** De rensade marken fullständigt på all svamp innan de körde vidare till nästa skog.
- **D.** De plockade kantareller för att sälja dem vidare till restauranger i staden. **◀ NYCKEL**

### Fråga 2

Vilket påstående överensstämmer bäst med texten?

- **A.** Kommersiella svampplockare bör mötas med förbudsskyltar i skogen.
- **B.** Allemansrätten har i alla tider byggt på tydliga lagregler som varje plockare följer.
- **C.** Allemansrätten vilar mindre på lagtext än på en tyst måtta, som storskaligt plockande hotar. **◀ NYCKEL**
- **D.** Eftersom svamp alltid växer upp igen tar naturen ingen som helst skada av kommersiell plockning.
