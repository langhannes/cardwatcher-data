#!/usr/bin/env python3
"""Local dev server for the static CardWatcher viewer.

Serves docs/ as the site root while transparently exposing the sibling data
directories (pages/, changes/, images/) at the same root — exactly the layout
the Pages deploy workflow assembles. This means the shells can use plain
relative paths (pages/x.json, changes/price_history.json, images/x.jpg) that
resolve identically in local dev and in production.

    python scripts/serve.py           # http://localhost:8000
    python scripts/serve.py 8080

Regenerates docs/manifest.json on startup so local runs reflect current data.
"""
import http.server
import os
import sys
import functools

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(REPO_ROOT, "docs")
# URL path prefixes that live outside docs/ and map to repo-root siblings.
DATA_DIRS = ("pages", "changes", "images", "archive")


class ViewerHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Strip query/fragment and leading slash to get the first segment.
        clean = path.split("?", 1)[0].split("#", 1)[0].lstrip("/")
        first = clean.split("/", 1)[0]
        if first in DATA_DIRS:
            return os.path.join(REPO_ROOT, *clean.split("/"))
        # Everything else is served from docs/.
        return super().translate_path(path)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

    # Refresh the manifest so a local run mirrors current data.
    try:
        sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))
        import gen_manifest
        gen_manifest.main()
    except Exception as e:  # non-fatal: an existing manifest.json still works
        print(f"serve | manifest refresh skipped: {e}")

    handler = functools.partial(ViewerHandler, directory=DOCS_DIR)
    print(f"serve | CardWatcher viewer at http://localhost:{port}  (docs root: {DOCS_DIR})")
    http.server.ThreadingHTTPServer(("0.0.0.0", port), handler).serve_forever()


if __name__ == "__main__":
    main()
