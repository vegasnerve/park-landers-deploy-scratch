#!/usr/bin/env python3
"""Assemble bundle/index.js and bundle/index.b64 from chunk-00.txt .. chunk-12.txt."""
from pathlib import Path
import base64

root = Path(__file__).resolve().parent
b64 = "".join((root / f"chunk-{i:02d}.txt").read_text() for i in range(13))
(root / "index.b64").write_text(b64)
js = base64.b64decode(b64)
(root / "index.js").write_bytes(js)
print("index.js", len(js))
print("inventLanderFromPrompt", js.count(b"inventLanderFromPrompt"))
