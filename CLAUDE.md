# TIM

Las instrucciones del proyecto están en `AGENTS.md`: las comparte con Codex, que es lo que usa Sofía. Se editan ahí, no acá.

@AGENTS.md

## Solo para Claude Code
- Hooks en `.claude/settings.json`: bloquean comandos destructivos y avisan al tocar `.env*`.
- Agentes: `code-reviewer` y `debugger` en `.claude/agents/`.
- Para ver la app en el navegador del panel: `preview_start` con el nombre `tim` (`.claude/launch.json`).
