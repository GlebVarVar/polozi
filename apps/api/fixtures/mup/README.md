# MUP driving-exam question bank (Serbia)

Structured fixtures parsed from the official Ministry of Interior (МУП) theory
question PDFs — the authoritative, public question base for the Serbian driving
theory exam (categories A/B/C/D).

## Files

- `pdf/` — the 7 official area PDFs, downloaded from mup.gov.rs
- `parse.py` — extracts them to structured JSON (`pdftotext -bbox-layout` +
  a column/anchor reconstruction; see the module docstring)
- `questions.json` — **2315 questions**, the parser output

Re-run with: `python3 parse.py` (needs `pdftotext` from poppler-utils).

## Record shape

```json
{
  "id": "pravila_saobracaja_0001",
  "area": "pravila_saobracaja",
  "areaTitle": "Pravila saobraćaja",
  "number": 1,
  "text": "У случају да значење …",
  "hasImage": false,          // true = the question references a sign/figure image
  "points": 2,                // exam weight of the question (1-3)
  "correctCount": 1,          // how many options are correct (from the printed note)
  "type": "multipleChoice",   // or "openText"
  "options": [
    { "label": "а", "text": "…", "isCorrect": null }
  ]
}
```

Counts by area (parsed / max printed number):

| area | count |
|---|---|
| pravila_saobracaja | 797 |
| signalizacija | 524 |
| vozila | 365 |
| vozaci | 216 |
| posledice | 182 |
| osnove_bezbednosti | 170 |
| posebne_mere | 61 |
| **total** | **2315** |

## ⚠️ Two things this data does NOT give you

1. **No answer key.** The official PDFs never mark which option is correct, so
   every `isCorrect` is `null`. `correctCount` tells you *how many* to mark (from
   the "(Заокружити N тачна одговора)" note), but not *which*. Filling the key is
   a separate step (manual, or cross-referenced from a practice source).

2. **~932 questions reference an image** (`hasImage: true`), mostly in
   `signalizacija` and `pravila_saobracaja`. The sign/figure bitmaps are NOT in
   this JSON — they need to be extracted from the PDFs separately
   (`pdfimages`/render) and linked per question.

## ⚠️ Licensing

Each source PDF is stamped: *"Забрањено … умножавање базе података испитних
питања … у комерцијалне сврхе"* — reproduction of the question base for
**commercial purposes is prohibited**. Resolve usage rights with МУП/ABS before
shipping this in a published product.

## Known parser limitations

- ~9 options contain a stray mid-sentence ALL-CAPS token (section-header bleed).
- `points`/`correctCount` are best-effort from the printed layout; verify while
  keying answers.
