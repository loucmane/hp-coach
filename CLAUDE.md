# HP-Coach — Proven

Webtjänst för att studera till det svenska högskoleprovet (HP).
Målgruppen är svenska studenter som vill ha ett högt resultat.
Tjänsten ska kunna användas av andra, inte bara mig.

## Språk

- **Användarvänd text** (UI, feedback, förklaringar) är på svenska — målgruppen är svenska studenter.
- **Kod, kommentarer, commit-meddelanden, samtal med Claude** kan vara på engelska eller svenska.
- **ELF-sektionens innehåll** är på engelska per provets design — översätt aldrig ELF-texter.
- Befintlig svensk text i `bygg_hp_databas.py` (utskrifter, docstrings) — behåll den, byt inte ut i onödan.

---

## Nuläge

### Klart
- `bygg_hp_databas.py` — scraper som laddar ner alla prov från allakando.se
- `hp_databas.json` — råtext från 27 HP-provtillfällen (var-2013 t.o.m. var-2026)
  - 135 PDF-filer extraherade: facit + 2 verbala pass + 2 kvantitativa pass per tillfälle
  - ~2,7 MB, format: `{ "var-2026": { "facit": "...", "verb1": "...", "verb2": "...", "kvant1": "...", "kvant2": "..." } }`

### Nästa steg (i ordning)
**Inget av detta är byggt ännu — bara `bygg_hp_databas.py` och `hp_databas.json` finns.**

1. **Parser** — extrahera strukturerade frågor ur `hp_databas.json` + bilder ur PDF:erna för DTK
2. **Backend** — FastAPI + PostgreSQL
3. **Frontend** — React + KaTeX (matematik) + Vite

---

## Köra scrapern (om något behöver hämtas om)

```bash
source venv/bin/activate
pip install requests pdfplumber   # om beroenden saknas
python3 bygg_hp_databas.py        # resumable — redan hämtade filer hoppas över
```

Scraper-arkitektur: allt ligger i `bygg_hp_databas.py`. `CATALOG`-dicten är källan till sanning för vad som ska hämtas. Lägg till nya prov där — resten av skriptet är data-drivet. `hp_databas.json` är data, inte genererad artefakt — radera den inte om du inte tänker göra en full re-scrape.

URL-stavfel i `CATALOG` (t.ex. `Hogksoleprovet`, `Hogkoleprovet`) är avsiktliga och matchar de riktiga URL:erna — rätta dem inte.

---

## Provets struktur

HP har två halvor à 160 min, vardera 80 frågor:

**Verbal del (VERB)**
| Del | Frågor | Testar |
|-----|--------|--------|
| ORD | 40 | Synonymer — ofta ovanlig/arkaisk vokabulär |
| LÄS | 20 | Svensk läsförståelse med inferensfrågor |
| MEK | 20 | Meningskomplettering (fyll i luckor) |
| ELF | 20 | Engelsk läsförståelse |

**Kvantitativ del (KVANT)**
| Del | Frågor | Testar |
|-----|--------|--------|
| XYZ | 12 | Algebra och ekvationslösning |
| KVA | 12 | Kvantitativa jämförelser: Kvantitet I vs II — A>B, B>A, A=B, eller otillräcklig info |
| NOG | 12 | Datasufficiency: räcker påstående (1) och/eller (2) för att lösa problemet? |
| DTK | 12 | Diagram, tabeller och kartor — kräver bilder från PDF |

**Poängsättning:** 0,0–2,0 per halva. Totalpoäng = medel av båda halvorna. 2,0 är perfekt, 1,8+ är topp-percentil. Ingen minuspoäng — svara alltid på allt.

---

## Parser — förväntad parsing-kvalitet per sektion

> **OBS:** Tabellen är förväntningar baserade på manuell granskning av råtexten, inte mätta resultat. Uppdatera stjärnorna när parsern är skriven och testad.

| Sektion | Kvalitet | Notering |
|---------|----------|----------|
| ORD | ★★★★★ | Tydligt mönster: `1. ord: A alt B alt...` |
| MEK | ★★★★★ | Tydligt mönster |
| KVA | ★★★★★ | Tydligt mönster |
| NOG | ★★★★☆ | Bra, men statement-parsing kräver omsorg |
| XYZ | ★★★★☆ | Matematik renderas ibland garblad (exp, bråk) — konvertera till LaTeX |
| LÄS | ★★★☆☆ | Text finns men passage↔fråga-koppling måste parsas |
| ELF | ★★★☆☆ | Samma som LÄS, på engelska |
| DTK | ★☆☆☆☆ | Frågor finns men diagram saknas — extrahera som bilder ur PDF med pdfplumber eller PyMuPDF (fitz) |

Parser-output ska sparas i `hp_fragebank.json` — skriv aldrig över `hp_databas.json`.
Testa alltid parsern mot ett enda provtillfälle (`var-2026`) innan du kör alla 27.

---

## Designprinciper för webtjänsten

- Snabb feedback per fråga — inte bara rätt/fel utan varför
- Progresstracking per sektion och per användare
- Adaptiv svårighet — prioritera svaga områden
- Facit är auktoritativt — alla svar valideras mot `facit`-fältet i databasen

---

## Viktigt om datan

- Frågorna är upphovsrättsskyddade av UHR (Universitets- och högskolerådet)
- Källan är allakando.se som publicerar proven med tillstånd
- ELF-texter publiceras bara en vecka efter provet av upphovsrättsskäl — äldre kan vara ofullständiga
- DTK-frågor utan bilder är oanvändbara för drilling — bildextraktion är högprioriterat
- `exam_id`-format: `var-2026`, `host-2025`, `var-2022-1`, `var-2022-2`, `host-ver1-2019`
