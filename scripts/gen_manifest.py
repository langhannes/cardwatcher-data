#!/usr/bin/env python3
"""Generate docs/manifest.json for the static CardWatcher viewer.

The GitHub Pages viewer cannot list the pages/ directory at runtime, so this
script emits a single manifest of the active cards (name, set, languages) that
the client-side search grid reads. It only *reads* the data repo; it never
touches pages/, changes/, or images/.

Run manually (`python scripts/gen_manifest.py`) or via the build-manifest
GitHub Action, which regenerates it on every data push.
"""
import json
import os
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(REPO_ROOT, "pages")
ARCHIVE_DIR = os.path.join(REPO_ROOT, "archive")
OUT_PATH = os.path.join(REPO_ROOT, "docs", "manifest.json")


def _card_entry(pages_dir, file_name, archived):
    """Minimal display record for one card, read from its page JSON."""
    canonical = file_name[:-5]
    path = os.path.join(pages_dir, file_name)
    entry = {
        "canonical": canonical,
        # Fallback display name mirrors build_search / dashboard: last path
        # segment with dashes turned into spaces.
        "name": canonical.split("_")[-1].replace("-", " "),
        "set": "",
        "languages": [],
        # Last-updated epoch (file mtime) — the search grid shows this date,
        # which a static client cannot read from the filesystem itself.
        "updated": os.path.getmtime(path),
        "archived": archived,
    }
    try:
        with open(os.path.join(pages_dir, file_name), "r", encoding="utf-8") as f:
            data = json.load(f)
        entry["name"] = data.get("card", entry["name"])
        entry["set"] = (data.get("set") or "").strip()
        entry["languages"] = data.get("languages", []) or []
    except (IOError, json.JSONDecodeError):
        pass
    return entry


def build_manifest():
    cards = []
    for file_name in sorted(os.listdir(PAGES_DIR)):
        if file_name.endswith(".json"):
            cards.append(_card_entry(PAGES_DIR, file_name, archived=False))

    archived = []
    if os.path.isdir(ARCHIVE_DIR):
        for file_name in sorted(os.listdir(ARCHIVE_DIR)):
            if file_name.endswith(".json"):
                archived.append(_card_entry(ARCHIVE_DIR, file_name, archived=True))

    return {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cards": cards,
        "archived": archived,
    }


def main():
    manifest = build_manifest()
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(f"gen_manifest | wrote {len(manifest['cards'])} active + "
          f"{len(manifest['archived'])} archived cards to {OUT_PATH}")


if __name__ == "__main__":
    main()
