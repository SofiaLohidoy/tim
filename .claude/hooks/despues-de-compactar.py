#!/usr/bin/env python3
"""PostCompact: agrega a .claude/logs/compact-summary.md el resumen que generó la compactación."""
import json
import os
import sys

try:
    datos = json.load(sys.stdin)
except Exception:
    sys.exit(0)

resumen = datos.get("compact_summary")
if not resumen:
    sys.exit(0)

raiz = os.environ.get("CLAUDE_PROJECT_DIR") or datos.get("cwd") or os.getcwd()
logs = os.path.join(raiz, ".claude", "logs")
os.makedirs(logs, exist_ok=True)

with open(os.path.join(logs, "compact-summary.md"), "a", encoding="utf-8") as f:
    f.write("\n## Resumen de la conversación\n\n" + resumen.strip() + "\n")

sys.exit(0)
