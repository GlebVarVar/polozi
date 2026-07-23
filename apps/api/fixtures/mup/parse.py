#!/usr/bin/env python3
"""Parse the official MUP (Serbia) driving-exam question PDFs into structured JSON.

Approach: `pdftotext -bbox-layout` gives every word's (x,y) box. The PDFs are
two-column A4; each printed question number ("11.") is its own word sitting in
the far-left margin of its column. We:

  1. read all words per page, assign each to the left/right column by x,
  2. rebuild reading order = page -> column -> top-to-bottom -> left-to-right,
  3. group words into lines (by y), and mark a new question wherever a line's
     first word is a bare "<n>." in the margin,
  4. within a question: text before the first option is the stem; lines starting
     with "а)"/"б)"/... are options (wrapped continuations are appended);
     a lone 1-3 or a "(Заокружити N тачна…)" note gives correctCount.

The official PDFs do NOT mark which option is correct, so every option is emitted
with isCorrect: null. correctCount IS recovered (lets a later key be validated).
Sign/figure questions carry hasImage: true (the bitmap itself isn't in the text).
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
PDF_DIR = HERE / "pdf"
OUT = HERE / "questions.json"

AREAS = [
    ("pravila_saobracaja", "Pravila saobraćaja", 778),
    ("signalizacija", "Saobraćajna signalizacija", 524),
    ("vozila", "Vozila", 365),
    ("vozaci", "Vozači", 215),
    ("osnove_bezbednosti", "Osnove bezbednosti saobraćaja i pojmovi i izrazi", 182),
    ("posledice", "Posledice nepoštovanja propisa", 181),
    ("posebne_mere", "Posebne mere i ovlašćenja", 61),
]

MID = 298.0                      # column split x (A4 595pt wide)
# question-number words sit in a narrow margin: left col ~x28, right col ~x305,
# while body text starts at ~x48 / ~x324. Numbers >=100 render WITHOUT the dot.
LEFT_NUM_MAX = 40.0
RIGHT_NUM_MIN, RIGHT_NUM_MAX = MID, 318.0
Y_TOL = 4.0                      # words within this y-gap are the same line
# The copyright watermark is repeated in a top band AND a bottom band, and the
# bottom band overlaps real question text — so we can't clip by y alone. Instead
# we drop watermark *words* only when they fall inside a band (numbers/real text
# in the band survive). Watermark phrase:
#   "Забрањено је коришћење, односно повремено или стално умножавање базе
#    података испитних питања или њених делова, © било којим средствима и у
#    било којој форми, у комерцијалне сврхе"
BAND_TOP = 50.0
BAND_BOTTOM = 748.0
WM_WORDS = {
    "забрањено", "је", "коришћење", "односно", "повремено", "или", "стално",
    "умножавање", "базе", "података", "испитних", "питања", "њених", "делова",
    "©", "било", "којим", "средствима", "и", "у", "којој", "форми",
    "комерцијалне", "сврхе",
}

PAGE_RE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">')
WORD_RE = re.compile(
    r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>'
)
NUM_WORD_RE = re.compile(r"^(\d+)\.?$")
CATTAG_RE = re.compile(r"^[A-F]$")           # Latin category marker (A/B/C/D/E/F)
FOOTER_RE = re.compile(r"^(СРБИЈА|РЕПУБЛИКА|МУП|MUP|BEZBEDNOSTI?)\b", re.IGNORECASE)
OPTION_RE = re.compile(r"^([абвгдђеж])\)\s*(.*)$")
COUNT_RE = re.compile(r"^([1-3])$")
NOTE_RE = re.compile(r"\(Заокружити\s+(\w+)\s+тачн", re.IGNORECASE)
IMG_HINT_RE = re.compile(r"слици|слика|слике|слици|цртеж|фотографиј|приказан", re.IGNORECASE)
WORD_NUM = {"један": 1, "један": 1, "два": 2, "две": 2, "три": 3}


def is_watermark(text: str) -> bool:
    low = text.lower()
    return ("умножавање" in low or "комерцијалне сврхе" in low
            or "забрањено је коришћење" in low or low.startswith("©"))


def is_margin(col, x):
    return x < LEFT_NUM_MAX if col == 0 else RIGHT_NUM_MIN <= x < RIGHT_NUM_MAX


def page_words(pdf: Path):
    """Yield (page_idx, [ (col, ymin, xmin, text), ... ]) per page."""
    xml = subprocess.run(
        ["pdftotext", "-bbox-layout", "-enc", "UTF-8", str(pdf), "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    parts = PAGE_RE.split(xml)  # [pre, w,h, body, w,h, body, ...]
    for pi, i in enumerate(range(3, len(parts), 3)):
        words = []
        for m in WORD_RE.finditer(parts[i]):
            xmin, ymin = float(m.group(1)), float(m.group(2))
            text = html.unescape(m.group(5)).strip()
            if not text:
                continue
            in_band = ymin < BAND_TOP or ymin > BAND_BOTTOM
            if in_band:
                w = text.strip(".,")
                # watermark fragment OR ALL-CAPS running header/footer
                # ("МИНИСТАРСТВО … САОБРАЋАЈНЕ ПОЛИЦИЈЕ")
                if w.lower() in WM_WORDS or (len(w) >= 2 and w.isalpha() and w.isupper()):
                    continue
            words.append((0 if xmin < MID else 1, ymin, xmin, text))
        yield pi, words


def group_lines(words):
    """Group same-column words into lines by y-proximity. -> [(col,ymin,text)]"""
    words = sorted(words, key=lambda w: (w[0], round(w[1], 1), w[2]))
    lines, cur = [], None
    for col, ymin, xmin, text in words:
        if CATTAG_RE.match(text):            # drop Latin A/B/C/D category tags
            continue
        if cur and cur[0] == col and abs(ymin - cur[1]) <= Y_TOL:
            cur[2].append(text)
        else:
            if cur:
                lines.append((cur[0], cur[1], " ".join(cur[2])))
            cur = [col, ymin, [text]]
    if cur:
        lines.append((cur[0], cur[1], " ".join(cur[2])))
    return lines


def strip_caps_prefix(text):
    """Drop a leading run of ALL-CAPS words — a section header ("ДУЖНОСТИ …",
    "САОБРАЋАЈНА СИГНАЛИЗАЦИЈА") that leaked into the first question's stem."""
    words = text.split()
    k = 0
    while k < len(words) and len(words[k]) >= 2 and words[k].isalpha() and words[k].isupper():
        k += 1
    return " ".join(words[k:]) if k else text


def new_q(area, title, number):
    return {
        "id": f"{area}_{number:04d}", "area": area, "areaTitle": title,
        "number": number, "text": "", "hasImage": False,
        "points": None,          # question weight in the exam (1-3), printed digit
        "correctCount": None,    # how many options are correct (from the note)
        "type": "multipleChoice", "options": [],
    }


INLINE_OPT_RE = re.compile(r"(?:^|\s)([абвгдеж])\)")


def explode(text):
    """Split a physical line into segments at option markers, so inline layouts
    ("а) 1, б) 2, в) 3") and a stem merged with its first option split correctly.
    Returns [("txt", s) | ("opt", letter, s), ...]."""
    marks = [(m.start(), m.group(1)) for m in INLINE_OPT_RE.finditer(text)]
    if not marks:
        return [("txt", text)]
    segs = []
    head = text[: marks[0][0]].strip()
    if head:
        segs.append(("txt", head))
    for j, (pos, letter) in enumerate(marks):
        end = marks[j + 1][0] if j + 1 < len(marks) else len(text)
        body = re.sub(r"^\s*[абвгдеж]\)\s*", "", text[pos:end]).strip().rstrip(",")
        segs.append(("opt", letter, body))
    return segs


def build_question(area, title, number, lines):
    """lines: y-ordered (col,ymin,text) belonging to one question."""
    q = new_q(area, title, number)
    for _col, _y, text in lines:
        if is_watermark(text) or FOOTER_RE.match(text):
            continue
        note = NOTE_RE.search(text)
        if note:
            q["correctCount"] = WORD_NUM.get(note.group(1).lower())
            text = NOTE_RE.sub("", text).strip()
            if not text:
                continue
        if IMG_HINT_RE.search(text):
            q["hasImage"] = True
        for seg in explode(text):
            if seg[0] == "opt":
                q["options"].append({"label": seg[1], "text": seg[2], "isCorrect": None})
            elif (mc := COUNT_RE.match(seg[1])) and q["options"]:
                q["points"] = int(mc.group(1))          # lone digit = question weight
            elif q["options"]:
                q["options"][-1]["text"] = (q["options"][-1]["text"] + " " + seg[1]).strip()
            else:
                q["text"] = (q["text"] + " " + seg[1]).strip()

    # scrub note debris left in the stem when "(Заокружити N тачна одговора)"
    # wrapped across lines (the count was already captured above)
    q["text"] = re.sub(r"\(?\s*Заокружити\b[^)]*\)?", "", q["text"])
    q["text"] = re.sub(r"\s*\S{0,6}\s+одговора\)", "", q["text"])
    q["text"] = re.sub(r"\s{2,}", " ", q["text"]).strip()

    if q["options"]:
        last = q["options"][-1]["text"]
        # a mid-page section header (ALL-CAPS run) can bleed into the last option
        lw = last.split()
        while lw and len(lw[-1]) >= 2 and lw[-1].isalpha() and lw[-1].isupper():
            lw.pop()
        last = " ".join(lw)
        # the printed weight is a lone 1-3 trailing the last option ("…опасности. 3")
        if q["points"] is None:
            m = re.search(r"(?<=[.,)\s])([1-3])$", last)
            if m:
                q["points"] = int(m.group(1))
                last = last[: m.start()].strip()
        q["options"][-1]["text"] = last
    return q


def parse_area(pdf, area, title, expected):
    # 1) collect number anchors and the non-anchor words, per page
    anchors = []            # (page, col, ymin, number)
    page_lines = {}         # page -> [(col,ymin,text)] from non-anchor words
    for pi, words in page_words(pdf):
        body = []
        for col, ymin, xmin, text in words:
            m = NUM_WORD_RE.match(text)
            if m and is_margin(col, xmin) and int(m.group(1)) <= expected + 30:
                anchors.append((pi, col, ymin, int(m.group(1))))
            else:
                body.append((col, ymin, xmin, text))
        page_lines[pi] = group_lines(body)

    # 2) reading order of anchors = question order
    anchors.sort(key=lambda a: (a[0], a[1], a[2]))

    # 3) assign each line to a question by RANGE (not nearest): the number sits
    # ~1 line below the stem's first line, so a line belongs to the last anchor
    # whose y <= line.y + OFFSET. This keeps a tall question's lower options with
    # it instead of leaking them to the next (closer-centroid) question.
    OFFSET = 16.0
    buckets = {i: [] for i in range(len(anchors))}
    col_anchors = {}                          # (pi,col) -> [(ay, idx)] sorted
    for i, (pi, col, ay, num) in enumerate(anchors):
        col_anchors.setdefault((pi, col), []).append((ay, i))
    for key in col_anchors:
        col_anchors[key].sort()
    for pi, lines in page_lines.items():
        for col, ymin, text in lines:
            cands = col_anchors.get((pi, col))
            if not cands:
                continue
            best = None
            for ay, idx in cands:
                if ay <= ymin + OFFSET:
                    best = idx
                else:
                    break
            if best is None:
                best = cands[0][1]            # above the first anchor -> first q
            buckets[best].append((col, ymin, text))

    # 4) build questions
    questions = []
    ALPHA = "абвгдежз"
    for i, (pi, col, ay, num) in enumerate(anchors):
        lines = sorted(buckets[i], key=lambda l: l[1])
        q = build_question(area, title, num, lines)
        # options can be laid out in a 2-column grid (а,б | в,г) -> restore а,б,в,г
        q["options"].sort(key=lambda o: ALPHA.find(o["label"]))
        q["text"] = strip_caps_prefix(q["text"])
        if not q["text"].strip():
            continue  # degenerate bucket from a stray margin digit (false anchor)
        if not q["options"]:
            q["type"] = "openText"
        if q["correctCount"] is None:
            q["correctCount"] = 1
        if q["points"] is None:
            q["points"] = 1
        questions.append(q)
    return questions


def main():
    all_q = []
    rep = []
    for stem, title, expected in AREAS:
        pdf = PDF_DIR / f"{stem}.pdf"
        if not pdf.exists():
            print(f"!! missing {pdf}", file=sys.stderr)
            continue
        qs = parse_area(pdf, stem, title, expected)
        all_q.extend(qs)
        nums = [q["number"] for q in qs]
        # sequence sanity: are printed numbers contiguous 1..N per area?
        dup = len(nums) != len(set(nums))
        imgs = sum(1 for q in qs if q["hasImage"])
        multi = sum(1 for q in qs if q["correctCount"] > 1)
        noopt = sum(1 for q in qs if not q["options"])
        rep.append((stem, len(qs), expected, imgs, multi, noopt, dup, max(nums) if nums else 0))

    OUT.write_text(json.dumps(all_q, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"{'area':<20}{'parsed':>7}{'exp':>6}{'maxN':>6}{'img':>6}{'multi':>7}{'noOpt':>7}{'dup?':>6}")
    print("-" * 65)
    for stem, got, exp, imgs, multi, noopt, dup, maxn in rep:
        flag = "" if abs(got - exp) <= max(3, exp * 0.02) else "  <-- OFF"
        print(f"{stem:<20}{got:>7}{exp:>6}{maxn:>6}{imgs:>6}{multi:>7}{noopt:>7}{'Y' if dup else '':>6}{flag}")
    print("-" * 65)
    print(f"{'TOTAL':<20}{len(all_q):>7}{sum(a[2] for a in AREAS):>6}")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
