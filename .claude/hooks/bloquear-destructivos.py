#!/usr/bin/env python3
"""PreToolUse (Bash): bloquea comandos destructivos y el push forzado.

El input llega por stdin como JSON (tool_input.command). Exit 2 + stderr = bloqueo.
El push directo a main NO se bloquea: en TIM se pushea directo a main.
"""
import json
import re
import sys

try:
    datos = json.load(sys.stdin)
except Exception:
    sys.exit(0)

cmd = (datos.get("tool_input") or {}).get("command") or ""

REGLAS = [
    (r"\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?[a-zA-Z]*\s+(/|~|\$HOME|\.|\*)(\s|/?$|/\*)", "rm -rf sobre /, ~, . o *"),
    (r"\bdd\s+if=", "dd"),
    (r"\bmkfs", "mkfs"),
    (r">\s*/dev/(sd|disk|nvme)", "escritura directa a un disco"),
    (r"\bchmod\s+-R\s+777\s+/", "chmod -R 777 /"),
    (r"\bgit\s+push\b[^;&|]*\s(--force\b|--force-with-lease\b|-[a-zA-Z]*f[a-zA-Z]*\b)", "git push forzado"),
    (r"\bgit\s+push\b[^;&|]*\s\+[\w/.-]+", "git push forzado (refspec con +)"),
    (r"\bgit\s+reset\s+--hard\b", "git reset --hard (puede borrar trabajo de otra sesión en este checkout)"),
    (r"\bgit\s+clean\s+-[a-zA-Z]*f", "git clean -f (borra archivos sin trackear)"),
    (r"\bgit\s+checkout\s+(--\s+)?\.(\s|$)", "git checkout . (descarta cambios sin commitear)"),
    (r"\bgit\s+restore\s+(--\S+\s+)*\.(\s|$)", "git restore . (descarta cambios sin commitear)"),
    (r"\bgit\s+push\b[^;&|]*\s--delete\b|\bgit\s+push\b[^;&|]*\s:\S+", "borrar una rama o tag remoto"),
    (r"\bsupabase\s+db\s+reset\b[^;&|]*--linked", "supabase db reset contra la base remota"),
    (r"\bsupabase\s+projects\s+delete\b", "borrar un proyecto de Supabase"),
    (r"\bvercel\s+(remove|rm|project\s+rm)\b", "borrar un deploy o proyecto de Vercel"),
]

for patron, nombre in REGLAS:
    if re.search(patron, cmd):
        print(
            f"BLOQUEADO por .claude/hooks/bloquear-destructivos.py: {nombre}. "
            "Si de verdad hace falta, explicale a la persona qué se pierde y que lo autorice.",
            file=sys.stderr,
        )
        sys.exit(2)

sys.exit(0)
