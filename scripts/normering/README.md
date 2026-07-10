# UHR normering import

Downloads UHR's official normeringstabeller (raw-score → normed 0.0–2.0)
per provtillfälle from studera.nu and emits one JSON per sitting.

## Run

```bash
source venv/bin/activate      # needs nothing beyond stdlib + pdftotext (poppler)
python3 scripts/normering/build_normering.py
# then mirror into the app's static store:
cp data/normering/*.json app/public/normering/
```

`manifest.py` holds the `exam_id → (source_page, verb_pdf, kvant_pdf)`
map (verified URLs, harvested from studera.nu's per-sitting index pages).

## What UHR actually publishes

UHR norms **per delprovstyp** (verbal, kvantitativ), each over the whole
**80-question half** (two 40-q provpass combined). A single 40-q pass has
**no official table**. The tables are published as **bands** (a raw-score
range → one normed step, 0.0–2.0 in 0.1 increments, 21 bands per half).

## Schema (`data/normering/{exam_id}.json`)

```jsonc
{
  "exam_id": "var-2024",
  "source_url": "https://www.studera.nu/.../normeringstabeller-varen-2024/",
  "verbal": {
    "source_pdf": "https://www.studera.nu/.../norm24a_verb.pdf",
    "bands": [ { "lo": 0, "hi": 18, "score": 0.0 }, ... ],  // faithful to the PDF
    "table": [ 0.0, 0.0, ..., 2.0 ]                          // dense: index = raw 0..80
  },
  "kvant": { ...same shape... }
}
```

`_index.json` lists every sitting with `verbal`/`kvant` booleans (table present).

## 40-q derivation (see app/src/lib/normering.ts)

For an authentic 40-q pass we scale the raw score onto the 80-q axis and
read the official table, interpolating between neighbouring rows:

```
scaledRaw = correct / presented * 80
score     = table[scaledRaw]     // linear interpolation when fractional
```

The UI labels this **"normerat (härlett)"** — it is an estimate of the
official curve, not an official 40-q score (which does not exist).
Synthetic passes stay on the linear "indikativ" fallback.
