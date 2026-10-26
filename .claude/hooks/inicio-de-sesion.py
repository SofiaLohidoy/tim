#!/usr/bin/env python3
"""SessionStart: registra la sesión en .claude/logs/session.log.

Si la sesión viene de una compactación, le recuerda a Claude que existe el resumen.
"""
import json
import os
import sys
from datetime import datetime

try:
    datos = json.load(sys.stdin)
except Exception:
    datos = {}

raiz = os.environ.get("CLAUDE_PROJECT_DIR") or datos.get("cwd") or os.getcwd()
logs = os.path.join(raiz, ".claude", "logs")
os.makedirs(logs, exist_ok=True)
origen = datos.get("source", "startup")

with open(os.path.join(logs, "session.log"), "a", encoding="utf-8") as f:
    f.write(f"=== Sesión {origen}: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} ===\n")

resumen = os.path.join(logs, "compact-summary.md")
if origen == "compact" and os.path.exists(resumen):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": "El estado del repo antes de compactar está en .claude/logs/compact-summary.md.",
        }
    }))

sys.exit(0)
