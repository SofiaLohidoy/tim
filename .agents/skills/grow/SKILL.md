---
name: grow
description: Para que el agente aprenda a hacer algo nuevo en TIM. Se dispara con "convertí esto en skill", "guardá cómo hicimos esto", "quiero que la próxima vez lo hagas igual", "esto lo hacemos siempre", "necesito un agente para X", "enseñale a Claude a...", o cuando Claude nota que repitió el mismo proceso 2 o más veces en la sesión.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
model: claude-sonnet-5-5
effort: medium
---

# Grow: skills y agentes nuevos

El harness de TIM crece con el uso. Esta skill crea skills y agentes nuevos con el mismo estilo que los que ya hay. El equipo no es técnico: lo que se crea tiene que dispararse solo, con las palabras que usa el equipo.

## Principio: buscar antes de crear
Nunca crear algo sin verificar que no existe.
1. `.agents/skills/`: ¿hay una skill parecida? Si existe, **se amplía, no se duplica**.
2. `.claude/rules/`: ¿es una regla y no un procedimiento? Una regla va a `rules/`, no a una skill.
3. `AGENTS.md`, tabla de ruteo: ¿ya hay un camino para esto?

```bash
ls .agents/skills/ .claude/rules/ .claude/agents/
grep -ril "palabra clave" .agents/ .claude/ AGENTS.md docs/
```

## Skill, agente o regla
- **Regla** (`.claude/rules/*.md`): algo que siempre vale ("los botones llevan verbo"). Corta.
- **Skill** (`.agents/skills/<nombre>/SKILL.md`): un procedimiento con pasos, que se dispara por un pedido ("preparar un evento").
- **Agente** (`.claude/agents/<nombre>.md`): un especialista que trabaja muchos turnos con herramientas restringidas y devuelve un resultado (revisar código, depurar). Raro: casi siempre alcanza una skill.

## Cómo se escribe una skill
- Nombre en castellano, `kebab-case`, que diga la tarea: `preparar-evento`, no `event-helper`.
- Frontmatter con `name` y `description`. La `description` es el **disparador**, no un resumen: empieza con cuándo se usa e incluye las frases literales del equipo ("cómo vienen los números", "armá el evento").
- `model: claude-sonnet-5-5` si conviene fijar modelo. Herramientas mínimas en `allowed-tools`.
- Cuerpo: pasos numerados, comandos exactos con los scripts del repo (`pnpm verificar`, `pnpm datos:prueba`...), y un "Antes de decir listo" al final.
- Español rioplatense, oraciones cortas, sin emojis. Términos de `CONTEXT.md`.
- Nada que le pida a la persona correr un comando o abrir un dashboard.

## Cómo se escribe un agente
- Frontmatter: `name`, `description` (cuándo usarlo), `tools` mínimas, `model: claude-sonnet-5-5`, `maxTurns` razonable.
- Si no tiene que escribir, `disallowedTools: [Write, Edit]`.
- Formato de salida fijo, para que el hilo principal lo pueda leer rápido.

## Pasos
1. Entender qué se quiere: disparador, pasos, qué se entrega.
2. Buscar lo existente (arriba).
3. Escribir el archivo.
4. Sumarlo a la tabla de ruteo de `AGENTS.md` ("Te piden X → leé Y").
5. Registrar en el log:
   ```bash
   mkdir -p .claude/logs
   echo "[$(date +%Y-%m-%d)] <nombre> | skill/agente/regla | disparador: \"...\"" >> .claude/logs/skills-creadas.md
   ```
6. Contarle a la persona, en una línea, qué aprendió el agente y con qué frase se dispara.

## Cuándo proponerlo sin que lo pidan
Si en la sesión se repitió el mismo proceso 2 o más veces, al final de la respuesta, en una línea:

> Candidato a skill: `nombre-sugerido`, para cuando pidan "...". ¿La creo?

No se crea sin el sí de la persona.
