# Layer-2 rendering contract (antagen 2026-08-31, bead hpf-y1p4)

Bankens `rationale`-fält är **adjudikationsartefakter**, inte elevtext.
`GENERATION.md` pekar ut dem som "Layer-2 explanation source material
downstream" — och nedströms rendering till elevprosa MÅSTE därför passera
detta kontrakt. Uppmätt prevalens vid antagandet (batch16-metagranskningen):
snake_case-taxonomietiketter i 112 av 114 enheter, *hedgat*-former i 30 av
114, grindintern metakommentar ny i batch16. Den skeppade elevbutiken
`data/explanations/` bar vid mätningen ingen av dem — detta kontrakt gör
egenskapen till ett krav i stället för en slump.

## Reglerna

1. **Strippa eller översätt snake_case-etiketter.** `scope_shift`,
   `detail_as_main`, `plausible_worldknowledge` osv. är interna joinnycklar
   som grindarna räknar på. I elevtext ersätts de med svensk prosa
   ("förskjuter frågans omfång", "detalj som huvudsak") eller stryks.
2. **Ersätt *hedgat/hedgad/hedgar/hedgning*** med native svenska:
   *reserverat*, *garderat*, *med förbehåll*, *avgränsat* — efter kontext.
3. **Strippa heuristik- och grindinterna sektioner helt.** Meningar som
   refererar rundor, grindar, mech-listor eller pipelinehistorik ("the
   round-2 version of this paragraph …", "mech.py's absolutiser list …")
   får aldrig nå elevtext. Denna klass är farligast: den läser som vanlig
   prosa, inte som en etikett.

## Verkställighet

`gates/scripts/lint_learner_output.py` körs på **renderad elevtext** (t.ex.
`data/explanations/`) i importsteget och fäller på alla tre klasserna
(L2-SNAKE, L2-HEDGAT, L2-GATEREF). Linten pekas ALDRIG mot bankens interna
adjudikationsmetadata — bankens 112/114 är korrekt intern konsekvens och
ska inte skrivas om (ägardom 2026-08-31: att laga en enhet bryter
konsekvensen i 1 av 114 filer och river taxonomin grindarna joinar på).
