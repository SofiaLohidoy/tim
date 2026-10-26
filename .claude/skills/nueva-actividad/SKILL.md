---
name: nueva-actividad
description: Para agregar un juego o actividad virtual a TIM con sus señales (fase B). Se dispara con "agregá un juego", "sumá el crucigrama", "hagamos el acertijo de Einstein", "un juego tipo Wordle", "nueva actividad", "qué mide este juego", "agregá una señal".
---

# Nueva actividad

Fase B. Las tablas `actividades`, `partidas` y `senales` todavía no existen: la primera actividad las crea (skill `migracion`). Revisá `docs/roadmap.md` antes: si la hackatón no pasó, esto espera.

Juegos previstos: **adivinar la palabra** (tipo Wordle, lista de palabras en español con licencia libre), **crucigrama** (grillas propias) y **acertijo de Einstein** (lógica con pistas, en grilla). Contenido propio, nunca copiado.

## 1. Spec del juego
- Nombre, duración estimada (para el filtro "tengo 5 / 15 / 30 min") y reglas en 3 líneas.
- Contenido: de dónde sale y su licencia. Se guarda versionado (una partida apunta a la versión que jugó).
- Jugable de punta a punta en el celular, con una mano.

## 2. Qué se registra de la partida
El proceso, no solo el resultado. Inicio, fin y, en `partidas.eventos` (jsonb), cada intento, pista usada, corrección, abandono y reintento, con su hora. Definí los tipos de evento antes de codear.

## 3. Señales: regla escrita primero
Por cada señal (ej. persistencia: reintenta después de un error; uso de información: pide pistas antes de arriesgar; autocorrección):
1. Escribila en `docs/senales.md` con el formato de ahí, **antes** de implementarla. Incluye "Qué NO dice".
2. Implementá el cálculo como función pura (sin base, sin red), fácil de testear.
3. Test en Vitest con partidas de ejemplo: una que la muestra, una que no, un borde.

Una señal es una hipótesis. En la UI se llama **señal**, nunca "medición", "puntaje" ni "nivel". Nunca se promedia con la rúbrica de un evento. Si alguien pide presentarla como validada, frená y explicá por qué no (regla dura 5 de `CLAUDE.md`).

## 4. Datos
Skill `migracion`. RLS: la persona ve sus partidas y señales; el organizador todas; mentores, jurados y empresas no (la empresa, recién en fase D y por la vista anónima).

## 5. Encuesta
Una pregunta al terminar cada partida (`respuestas_encuesta`, ampliar el `CHECK` de `encuesta` con una migración nueva).

## 6. UI
Skill `diseno-de-la-app` y `emil-design-eng`. Biblioteca filtrada por tiempo. El juego responde al instante; nada de animaciones largas entre intentos. Respeta reduced-motion.

## 7. Verificar y publicar
Skills `verificar` y `deploy`. DoD de la fase: el juego jugable en celular de punta a punta, con sus señales calculadas por tests.
