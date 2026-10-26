#!/usr/bin/env python3
"""PreToolUse (Write|Edit): avisa, sin bloquear, al escribir un .env*.

Devuelve additionalContext (lo lee Claude) y systemMessage (lo ve la persona).
"""
import json
import os
import sys

try:
    datos = json.load(sys.stdin)
except Exception:
    sys.exit(0)

ruta = ((datos.get("tool_input") or {}).get("file_path") or "").replace("\\", "/")
nombre = os.path.basename(ruta)

if not nombre.startswith(".env"):
    sys.exit(0)

if nombre == ".env.example":
    contexto = (
        f"{ruta} se commitea al repo: lleva nombres de variables y comentarios, nunca valores reales."
    )
else:
    contexto = (
        f"{ruta} tiene secretos y no se commitea (.gitignore). "
        "SUPABASE_SECRET_KEY saltea la RLS: solo servidor, nunca con prefijo NEXT_PUBLIC_. "
        "Toda variable nueva también va, sin valor, a .env.example y a Vercel."
    )

print(json.dumps({
    "systemMessage": f"Aviso: se está escribiendo {nombre}.",
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "additionalContext": contexto,
    },
}))
sys.exit(0)
