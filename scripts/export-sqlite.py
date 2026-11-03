#!/usr/bin/env python3
"""Read-only export of the old SQLite history to a local (gitignored) JSON file."""
import json
import sqlite3
import sys
from pathlib import Path

COLUMNS = (
    "id", "city", "temperature", "feelsLike", "condition", "windSpeed",
    "uvIndex", "humidity", "recommendationText", "createdAt"
)

def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "prisma/dev.db")
    destination = Path(
        sys.argv[2] if len(sys.argv) > 2
        else "migration-backup/recommendations.json"
    )
    if not source.is_file():
        raise SystemExit(f"SQLite source not found: {source}")
    if destination.exists():
        raise SystemExit(f"Refusing to overwrite existing export: {destination}")

    with sqlite3.connect(f"file:{source.resolve()}?mode=ro", uri=True) as conn:
        conn.row_factory = sqlite3.Row
        query = "SELECT " + ", ".join('"' + name + '"' for name in COLUMNS) + ' FROM "Recommendation"'
        records = [dict(row) for row in conn.execute(query)]

    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("x", encoding="utf-8") as output:
        json.dump(records, output, ensure_ascii=False, indent=2)
        output.write("\n")
    print(f"Exported {len(records)} recommendations to {destination} (keep it private).")

if __name__ == "__main__":
    main()
