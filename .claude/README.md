<!--
Fuente de la sintaxis de hooks: referencia oficial de Claude Code,
https://code.claude.com/docs/en/hooks (consultada el 25/10/2026, versión .md completa).
Lo que se verificó ahí:
- El input del tool llega por stdin como JSON (`tool_input.command` en Bash, `tool_input.file_path`
  en Write/Edit). No existe `$CLAUDE_TOOL_INPUT`.
- PreToolUse bloquea con exit 2 + stderr. Un aviso sin bloquear va como JSON en stdout:
  `hookSpecificOutput.additionalContext` (lo lee Claude) y `systemMessage` (lo ve la persona).
- PreCompact y PostCompact solo admiten hooks `command` (no `prompt`). PreCompact recibe `trigger` y
  `custom_instructions`; PostCompact recibe `compact_summary`.
- SessionStart recibe `source` (startup, resume, clear, compact, fork).
- `${CLAUDE_PROJECT_DIR}` es la raíz del proyecto. Los campos `description` por hook no existen en el
  esquema; por eso cada hook se documenta acá y en su script.
-->

# `.claude/` de TIM

El harness de Claude Code del proyecto. Viaja con el repo: el equipo de TIM trabaja con su propio Claude y esto es lo que le enseña cómo se trabaja acá. La puerta de entrada es `CLAUDE.md` en la raíz.

| Carpeta | Qué hay |
|---|---|
| `rules/` | Reglas que siempre valen: diseño, seguridad, datos y migraciones, textos. |
| `skills/` | Procedimientos que se disparan solos por lo que pide la persona. |
| `agents/` | `code-reviewer` (revisa, no edita) y `debugger` (busca la causa raíz). |
| `hooks/` | Scripts que corre Claude Code antes o después de ciertas acciones. |
| `settings.json` | Qué hook corre cuándo. |
| `launch.json` | Cómo levantar la app en el navegador del panel (`preview_start`, nombre `tim`). |
| `logs/` | Log de sesiones y resumen de compactación. No se commitea. |

## Hooks
| Cuándo | Script | Qué hace |
|---|---|---|
| Al arrancar la sesión | `hooks/inicio-de-sesion.py` | Anota la sesión en `logs/session.log`. Si viene de una compactación, le recuerda a Claude que existe el resumen. |
| Antes de un comando | `hooks/bloquear-destructivos.py` | Bloquea `rm -rf` sobre `/`, `~`, `.` o `*`; `dd`, `mkfs`; `git push --force` / `-f` / `--force-with-lease` / `+rama`; borrar ramas o tags remotos; `git reset --hard`, `git clean -f`, `git checkout .` y `git restore .` (en este checkout puede haber otra sesión trabajando); `supabase db reset --linked`; borrar proyectos de Supabase o Vercel. **El push directo a `main` no se bloquea**: en TIM se pushea directo a `main`. |
| Antes de escribir un archivo | `hooks/avisar-env.py` | Si es un `.env*`, avisa sin bloquear: qué no se commitea y que la clave secreta saltea la RLS. |
| Después de un comando | (inline) | Anota la hora en `logs/session.log`, sin el contenido del comando. |
| Antes de compactar | `hooks/antes-de-compactar.py` | Escribe `logs/compact-summary.md` con fecha, rama, cambios sin commitear y últimos commits. |
| Después de compactar | `hooks/despues-de-compactar.py` | Le agrega a `logs/compact-summary.md` el resumen de la conversación. |

El bloqueo mira el texto del comando entero. Un heredoc que **contiene** uno de esos textos (por ejemplo, un doc que menciona `git push --force`) también se bloquea: en ese caso el archivo se escribe con la herramienta Write, no por Bash.

Diferencias con el kickoff (`~/Projects/claude-project-kickoff/.claude/settings.json`): se dejó de leer `$CLAUDE_TOOL_INPUT` (ya no existe); el PreCompact de tipo `prompt` pasó a `command` + PostCompact (prompt no está soportado ahí); se sacó el Stop de "candidato a skill" (un hook `prompt` en Stop evalúa si Claude puede terminar, no agrega una línea; la sugerencia de skills vive en la skill `grow`); se sacó el bloqueo de push a `main`.

## Mantenerlo
- Una skill o regla nueva: skill `grow`. Se suma también a la tabla de ruteo de `CLAUDE.md`.
- Después de tocar `settings.json`: `python3 -m json.tool .claude/settings.json`.
- Los agentes y skills fijan `model: claude-sonnet-5-5`. Si cambia el modelo vigente, se actualiza en todos.
