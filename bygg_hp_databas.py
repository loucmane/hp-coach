#!/usr/bin/env python3
"""
bygg_hp_databas.py
==================
Laddar ner alla gamla högskoleprov från allakando.se och bygger en
strukturerad JSON-databas med all extraherad text.

Krav:
    pip install requests pdfplumber

Kör:
    python3 bygg_hp_databas.py

Resultatet sparas i hp_databas.json i samma mapp.
Skriptet kan avbrytas och startas om – redan hämtade filer hoppas över.
"""

import json
import os
import sys
import time
import requests
import pdfplumber
import io

OUTPUT_FILE = "hp_databas.json"
DELAY = 0.8  # sekunder mellan requests (var snäll mot servern)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# ── URL-katalog ────────────────────────────────────────────────────────────────
# Format: { exam_id: { "facit": url, "verb1": url, "verb2": url,
#                       "kvant1": url, "kvant2": url } }
# verb1/verb2   = de två verbala provpassen
# kvant1/kvant2 = de två kvantitativa provpassen
# ──────────────────────────────────────────────────────────────────────────────

BASE = "https://www.allakando.se/wp-content/uploads"

CATALOG = {
    "var-2026": {
        "facit":  f"{BASE}/2026/04/hp-2026-04-18-hogskoleprovet-facit-26a.pdf",
        "verb1":  f"{BASE}/2026/04/provpass-2-verb-VT-2026.pdf",
        "verb2":  f"{BASE}/2026/04/provpass-4-verb-VT-2026.pdf",
        "kvant1": f"{BASE}/2026/04/provpass-3-kvant-VT-2026.pdf",
        "kvant2": f"{BASE}/2026/04/provpass-5-kvant-VT-2026.pdf",
    },
    "host-2025": {
        "facit":  f"{BASE}/2025/10/hogskoleprovet-2025-10-19-facit-25b.pdf",
        "verb1":  f"{BASE}/2025/10/hogskoleprovet-ht-2025-10-19-provpass-3-verb.pdf",
        "verb2":  f"{BASE}/2025/10/hogskoleprovet-ht-2025-10-19-provpass-5-verb.pdf",
        "kvant1": f"{BASE}/2025/10/hogskoleprovet-ht-2025-10-19-provpass-1-kvant.pdf",
        "kvant2": f"{BASE}/2025/10/hogskoleprovet-ht-2025-10-19-provpass-4-kvant.pdf",
    },
    "var-2025": {
        "facit":  f"{BASE}/2025/10/hogskoleprovet-2025-04-05-facit-25a.pdf",
        "verb1":  f"{BASE}/2025/04/hogskoleprovet-vt-2025-04-05-provpass-2-verb.pdf",
        "verb2":  f"{BASE}/2025/04/hogskoleprovet-vt-2025-04-05-provpass-4-verb.pdf",
        "kvant1": f"{BASE}/2025/04/hogskoleprovet-vt-2025-04-05-provpass-3-kvant.pdf",
        "kvant2": f"{BASE}/2025/04/hogskoleprovet-vt-2025-04-05-provpass-5-kvant.pdf",
    },
    "host-2024": {
        "facit":  f"{BASE}/2024/11/hogskoleprovet-facit-24b-2024-10-20.pdf",
        "verb1":  f"{BASE}/2024/11/provpass-3-verb-2024-10-20.pdf",
        "verb2":  f"{BASE}/2024/11/provpass-5-verb-2024-10-20.pdf",
        "kvant1": f"{BASE}/2024/11/provpass-1-kvant-2024-10-20.pdf",
        "kvant2": f"{BASE}/2024/11/provpass-4-kvant-2024-10-20.pdf",
    },
    "var-2024": {
        "facit":  f"{BASE}/2024/11/hogskoleprovet-facit-24a-2024-04-13.pdf",
        "verb1":  f"{BASE}/2024/04/provpass-1-verb-VT2024.pdf",
        "verb2":  f"{BASE}/2024/04/provpass-4-verb-VT2024.pdf",
        "kvant1": f"{BASE}/2024/04/provpass-2-kvant-VT2024.pdf",
        "kvant2": f"{BASE}/2024/04/provpass-5-kvant-VT2024.pdf",
    },
    "host-2023": {
        "facit":  f"{BASE}/2023/10/hogskoleprovet-facit-23b.pdf",
        "verb1":  f"{BASE}/2023/10/provpass-3-verb-ht-2023.pdf",
        "verb2":  f"{BASE}/2023/10/provpass-5-verb-ht-2023.pdf",
        "kvant1": f"{BASE}/2023/10/provpass-2-kvant-ht-2023.pdf",
        "kvant2": f"{BASE}/2023/10/provpass-4-kvant-ht-2023.pdf",
    },
    "var-2023": {
        "facit":  f"{BASE}/2023/03/hogskoleprovet-facit-23a.pdf",
        "verb1":  f"{BASE}/2023/03/provpass-3-verb.pdf",
        "verb2":  f"{BASE}/2023/03/provpass-5-verb.pdf",
        "kvant1": f"{BASE}/2023/03/provpass-2-kvant.pdf",
        "kvant2": f"{BASE}/2023/03/provpass-4-kvant.pdf",
    },
    "host-2022": {
        "facit":  f"{BASE}/2022/10/hogskoleprovet-20221023-facit-22b.pdf",
        "verb1":  f"{BASE}/2022/10/hogskoleprovet-20221023-provpass-2-verb.pdf",
        "verb2":  f"{BASE}/2022/10/hogskoleprovet-20221023-provpass-5-verb.pdf",
        "kvant1": f"{BASE}/2022/10/hogskoleprovet-20221023-provpass-1-kvant.pdf",
        "kvant2": f"{BASE}/2022/10/hogskoleprovet-20221023-provpass-4-kvant.pdf",
    },
    # var-2022 hade två tillfällen (12 mars och 7 maj)
    "var-2022-1": {
        "facit":  f"{BASE}/2022/03/hogskoleprovet-facit-22a1.pdf",
        "verb1":  f"{BASE}/2022/03/provpass-2-verb.pdf",
        "verb2":  f"{BASE}/2022/03/provpass-4-verb.pdf",
        "kvant1": f"{BASE}/2022/03/provpass-3-kvant.pdf",
        "kvant2": f"{BASE}/2022/03/provpass-5-kvant.pdf",
    },
    "var-2022-2": {
        "facit":  f"{BASE}/2022/10/hogskoleprovet-20220507-facit-22a2-7-maj.pdf",
        "verb1":  f"{BASE}/2022/10/hogskoleprovet-20220507-provpass-3-verb.pdf",
        "verb2":  f"{BASE}/2022/10/hogskoleprovet-20220507-provpass-5-verb.pdf",
        "kvant1": f"{BASE}/2022/10/hogskoleprovet-20220507-provpass-1-kvant.pdf",
        "kvant2": f"{BASE}/2022/10/hogskoleprovet-20220507-provpass-4-kvant.pdf",
    },
    "host-2021": {
        "facit":  f"{BASE}/2021/10/hogskoleprovet-facit-21-b.pdf",
        "verb1":  f"{BASE}/2021/10/provpass-2-verb-hp-ht-2021.pdf",
        "verb2":  f"{BASE}/2021/10/provpass-5-verb-hp-ht-2021.pdf",
        "kvant1": f"{BASE}/2021/10/provpass-1-kvant-hp-ht-2021.pdf",
        "kvant2": f"{BASE}/2021/10/provpass-4-kvant-hp-ht-2021.pdf",
    },
    # host-2020 (inget vårprov 2020)
    "host-2020": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2020-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-provpass-2-verb.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-provpass-4-verb-3.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-provpass-3-kvant-3.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-provpass-5-kvant-komprimerad.pdf",
    },
    # host-2019 hade två versioner
    "host-ver1-2019": {
        "facit":  f"{BASE}/2021/08/hogskoleprovet-facit-19b-version-1.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-provpass-3-verb-1.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-provpass-5-verb-1.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-provpass-1-1-kvant-2.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-provpass-4-kvant-1.pdf",
    },
    "host-ver2-2019": {
        "facit":  f"{BASE}/2021/08/hogskoleprovet-facit-19b-version-2.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-provpass-3-verb-1.pdf",   # samma verbala pass
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-provpass-5-verb-1.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-provpass-1-2-kvant-2.pdf",  # annan kvantversion
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-provpass-4-kvant-1.pdf",
    },
    "var-2019": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-VT-2019-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-provpass-1-verb-4.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-provpass-4-verb-4.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-provpass-2-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-provpass-5-kvant-3.pdf",
    },
    "host-2018": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2018-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-provpass-3-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-provpass-5-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskolepovet-provpass-2-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-provpass-4-kvant.pdf",
    },
    # var-2018 hade 8 versioner — allakando har version 1 av provpassen
    "var-2018-1": {
        "facit":  f"{BASE}/2021/08/Hogskoleprovet-2018-04-14-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-provpass-2-verbal-1.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-provpass-5-verbal-version-1-1.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-provpass-1-kvant-version-1-1-min.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-provpass-4-kvant-version-1-1-min.pdf",
    },
    "host-2017": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2017-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-10-21-pp1-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-10-21-pp4-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-10-21-pp3-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-10-21-pp5-kvant-version-1.pdf",
    },
    "var-2017": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-VT-2017-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-04-01-pp3-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-04-01-pp5-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-04-01-pp1-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2017-04-01-pp4-kvant.pdf",
    },
    "host-2016": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2016-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-10-29-pp2-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-10-29-pp4-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-10-29-pp3-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-10-29-pp5-kvant.pdf",
    },
    "var-2016": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-VT-2016-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogksoleprovet-elevmaterial-2016-04-09-pp2-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-04-09-pp4-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-04-09-pp3-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2016-04-09-pp5-kvant.pdf",
    },
    "host-2015": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2015-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-10-24-pp1-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-10-24-pp4-verbal.pdf",
        "kvant1": f"{BASE}/2022/10/hogskoleprovet-2015ht-provpass-3-kvantitativ.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-10-24-pp5-kvant.pdf",
    },
    "var-2015": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-VT-2015-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-03-28-pp3-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-03-28-pp5-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-03-28-pp2-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2015-03-28-pp4-kvant.pdf",
    },
    "host-2014": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2014-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-10-25-pp1-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-10-25-pp4-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-10-25-pp2-kvant-min.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-10-25-pp5-kvant-kopia.pdf",
    },
    "var-2014": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-VT-2014-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-04-05-pp3-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-04-05-pp5-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-04-05-pp1-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2014-04-05-pp4-kvant.pdf",
    },
    "host-2013": {
        "facit":  f"{BASE}/2021/01/Hogskoleprovet-HT-2013-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-10-26-pp1-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-10-26-pp4-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-10-26-pp3-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-10-26-pp5-kvant.pdf",
    },
    "var-2013": {
        "facit":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-04-06-facit.pdf",
        "verb1":  f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-04-06-pp3-verbal.pdf",
        "verb2":  f"{BASE}/2021/08/Hogkoleprovet-elevmaterial-2013-04-06-pp5-verbal.pdf",
        "kvant1": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-04-06-pp2-kvant.pdf",
        "kvant2": f"{BASE}/2021/08/Hogskoleprovet-elevmaterial-2013-04-06-pp4-kvant.pdf",
    },
}


# ── Hjälpfunktioner ────────────────────────────────────────────────────────────

def load_db():
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_db(db):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"  → Sparad: {OUTPUT_FILE} ({size_kb:.0f} KB)")


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extraherar all text ur en PDF given som bytes."""
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n".join(pages)
    except Exception as e:
        return f"[FEL vid textextraktion: {e}]"


def fetch_pdf_text(url: str, session: requests.Session) -> str:
    """Hämtar en PDF och returnerar dess textinnehåll."""
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        if resp.status_code == 200:
            return extract_text_from_pdf_bytes(resp.content)
        else:
            return f"[HTTP {resp.status_code}: {url}]"
    except Exception as e:
        return f"[Nätverksfel: {e}]"


# ── Huvudprogram ───────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  HP-databas byggare")
    print("=" * 60)

    # Kontrollera att pdfplumber är installerat
    try:
        import pdfplumber  # noqa
    except ImportError:
        print("\nInstallera pdfplumber först:")
        print("  pip install pdfplumber requests")
        sys.exit(1)

    db = load_db()
    session = requests.Session()

    total_exams = len(CATALOG)
    total_files = total_exams * 5  # facit + verb1 + verb2 + kvant1 + kvant2
    done_files = sum(len(v) for v in db.values())

    print(f"\nHittade {len(db)} sparade prov ({done_files}/{total_files} filer sedan tidigare)")
    print(f"Hämtar {total_exams} provtillfällen × 5 filer = {total_files} PDFer totalt\n")

    for exam_idx, (exam_id, files) in enumerate(CATALOG.items(), 1):
        print(f"[{exam_idx:02d}/{total_exams}] {exam_id}")

        if exam_id not in db:
            db[exam_id] = {}

        for file_type, url in files.items():
            # Hoppa över om redan hämtad
            if file_type in db[exam_id] and db[exam_id][file_type]:
                print(f"  ✓ {file_type} (redan klar)")
                continue

            print(f"  ↓ {file_type}... ", end="", flush=True)
            text = fetch_pdf_text(url, session)

            if text.startswith("["):
                print(f"MISSLYCKADES: {text}")
            else:
                chars = len(text)
                print(f"OK ({chars} tecken)")

            db[exam_id][file_type] = text
            time.sleep(DELAY)

        # Spara efter varje provtillfälle
        save_db(db)
        print()

    # Summering
    print("=" * 60)
    print("KLAR!")
    total_chars = sum(
        len(text)
        for exam in db.values()
        for text in exam.values()
    )
    print(f"  Provtillfällen: {len(db)}")
    print(f"  Filer totalt:   {sum(len(v) for v in db.values())}")
    print(f"  Tecken totalt:  {total_chars:,}")
    print(f"  Fil:            {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
