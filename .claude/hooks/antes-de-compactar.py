#!/usr/bin/env python3
"""PreCompact: deja en .claude/logs/compact-summary.md el estado del repo antes de compactar.

PreCompact solo admite hooks de tipo command (no prompt), así que Claude no puede escribir el
resumen acá. Este hook guarda lo mecánico (rama, cambios, últimos commits) y el hook PostCompact
(despues-de-compactar.py) le agrega el resumen que generó la compactación.
"""
import json
import os
import subprocess
import sys
from datetime import datetime

try:
    datos = json.load(sys.stdin)
except Exception:
    datos = {}

raiz = os.environ.get("CLAUDE_PROJECT_DIR") or datos.get("cwd") or os.getcwd()
logs = os.path.join(raiz, ".claude", "logs")
os.makedirs(logs, exist_ok=True)


def git(*args):
    try:
        return subprocess.run(
            ["git", *args], cwd=raiz, capture_output=True, text=True, timeout=10
        ).stdout.strip()
    except Exception:
        return "(no disponible)"


lineas = [
    "# Resumen de compactación",
    "",
    f"- Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
    f"- Disparo: {datos.get('trigger', 'desconocido')}",
    f"- Sesión: {datos.get('session_id', '')}",
    f"- Transcript: {datos.get('transcript_path', '')}",
    f"- Rama: {git('rev-parse', '--abbrev-ref', 'HEAD')}",
    "",
    "## Cambios sin commitear",
    "```",
    git("status", "--short") or "(ninguno)",
    "```",
    "",
    "## Últimos commits",
    "```",
    git("log", "--oneline", "-5"),
    "```",
    "",
]
if datos.get("custom_instructions"):
    lineas += ["## Pedido de la persona al compactar", datos["custom_instructions"], ""]

with open(os.path.join(logs, "compact-summary.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(lineas))

sys.exit(0)
