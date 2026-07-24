#!/usr/bin/env python3
"""Generate the sqlx data migration from questions.json.

Emits ../../migrations/0003_mup_questions.sql — 7 area categories, 2315
questions, and their answer options. sqlx runs it once (version-tracked, inside
a transaction), so it is lock-safe across Kubernetes replicas.

IMPORTANT: every answer is written with is_correct = FALSE — the official MUP
PDFs never mark the correct option, so the answer key must be filled in later.
image_name is left NULL (sign/figure bitmaps are not extracted yet; questions.json
keeps the hasImage flag for a future image-extraction pass).
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "questions.json"
OUT = HERE / "../../migrations/0003_mup_questions.sql"

# area slug -> (icon_name, order). Titles come from the JSON itself.
AREA_META = {
    "pravila_saobracaja": ("book-open-check", 0),
    "signalizacija": ("signpost", 1),
    "vozila": ("car", 2),
    "vozaci": ("user", 3),
    "osnove_bezbednosti": ("shield-check", 4),
    "posledice": ("gavel", 5),
    "posebne_mere": ("siren", 6),
}
DEMO_CATEGORIES = ("cat_signs", "cat_rules", "cat_first_aid")
CHUNK = 200  # rows per multi-row INSERT


def q(s):
    """SQL string literal (standard_conforming_strings: only ' needs doubling)."""
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def chunked_insert(head, rows):
    out = []
    for i in range(0, len(rows), CHUNK):
        out.append(head + "\n" + ",\n".join(rows[i:i + CHUNK]) + ";\n")
    return "\n".join(out)


def main():
    questions = json.loads(SRC.read_text(encoding="utf-8"))

    titles = {}
    for q_ in questions:
        titles.setdefault(q_["area"], q_["areaTitle"])

    lines = [
        "-- Official MUP (Serbia) driving-exam question bank — 2315 questions.",
        "-- GENERATED from fixtures/mup/questions.json by gen_migration.py.",
        "-- DO NOT edit by hand; re-run the generator instead.",
        "--",
        "-- answers.is_correct is FALSE for EVERY option: the official PDFs do not",
        "-- mark the correct answer, so the key must be filled in separately.",
        "",
        "-- drop the throwaway demo content (cascades to its questions & answers)",
        f"DELETE FROM categories WHERE id IN "
        f"({', '.join(q(c) for c in DEMO_CATEGORIES)});",
        "",
    ]

    # categories
    cat_rows = []
    for area, (icon, order) in sorted(AREA_META.items(), key=lambda kv: kv[1][1]):
        cat_rows.append(f"  ({q(area)}, {q(titles[area])}, {q(icon)}, {order})")
    lines.append(
        "INSERT INTO categories (id, name, icon_name, order_index) VALUES\n"
        + ",\n".join(cat_rows) + "\nON CONFLICT (id) DO NOTHING;\n"
    )

    # questions
    qrows = []
    for it in questions:
        image = f"{it['id']}.png" if it["hasImage"] else None
        qrows.append(
            f"  ({q(it['id'])}, {q(it['area'])}, {q(it['text'])}, "
            f"{q(it['type'])}, {q(image)}, {it['points']}, {it['number']})"
        )
    lines.append(
        "-- image_name is a PLACEHOLDER filename for questions that reference a\n"
        "-- sign/figure; the bitmap itself is not extracted yet.\n"
        + chunked_insert(
            "INSERT INTO questions "
            "(id, category_id, text, type, image_name, difficulty, order_index) VALUES",
            qrows).replace(";\n", " ON CONFLICT (id) DO NOTHING;\n")
    )

    # answers
    arows = []
    for it in questions:
        for idx, opt in enumerate(it["options"]):
            arows.append(
                f"  ({q(it['id'])}, {q(opt['text'])}, FALSE, {idx})"
            )
    lines.append(chunked_insert(
        "INSERT INTO answers (question_id, text, is_correct, order_index) VALUES",
        arows))

    OUT.resolve().write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.resolve()}")
    print(f"  categories: {len(cat_rows)}  questions: {len(qrows)}  answers: {len(arows)}")


if __name__ == "__main__":
    main()
