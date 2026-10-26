---
name: diseno-de-la-app
description: Criterios de diseño, UX y UI de TIM. Usala SIEMPRE antes de crear o cambiar una pantalla, un formulario, una hoja, una lista, el tablero del organizador, la evaluación del mentor, la devolución o la landing, y para revisar una pantalla antes de darla por terminada. Se dispara con "hacé la pantalla de...", "cambiá cómo se ve...", "esto se ve feo", "no entra en el celular", "mejorá el diseño", "agregá un botón", "armá el formulario de...".
metadata:
  version: 1.0.0
  origen: "Adaptada de la skill de Lo de Gabi (03 y 04/10/2026) al contexto de TIM (25/10/2026)."
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Diseño de la app

TIM se usa en una hackatón, desde el celular, con poco tiempo y quizás sin señal. Lo usan jóvenes que esperan una app tan cuidada como las que usan todos los días, y mentores que tienen 10 minutos para evaluar a 5 personas. **La sensación de uso gana a la lista de funciones**: una función que agrega ruido no se agrega.

Reglas cortas que no se negocian: `.claude/rules/diseno.md` (marca, mobile, motion). Textos: `.claude/rules/textos.md`. Motion fino: skill `emil-design-eng`.

## Principios
1. **Lo más simple que resuelva.** Lo opcional se esconde hasta que se pide (el CV en el onboarding, la observación en la rúbrica).
2. **Nada de texto de relleno.** Sin bajadas que explican la pantalla. Si algo necesita explicación, el rótulo está mal.
3. **No mostrar lo que es cero o vacío** cuando no aporta. Sí mostrar el estado vacío de una lista, con una frase útil ("Tu devolución aparece acá cuando la publiquen").
4. **Coherencia total:** un término por concepto (`CONTEXT.md`), el mismo ícono por concepto, los mismos KPI con el mismo nombre en todas las vistas del organizador.
5. **El orden de una pantalla es el orden de lo que pasa en el evento.** Estudiante: registro → onboarding → asistencia → equipo → devolución. Mentor: equipo → persona → dimensión → nivel → enviar.
6. **Evidencia, no nota.** Niveles con su nombre descriptivo. Nunca un número, un promedio, un ranking ni una barra de "puntaje". Las señales (fase B) se muestran como señales, con su límite.

## Celular primero
- **Estudiante**: barra fija abajo, pocos lugares (Inicio, Equipo, Devolución, Perfil). Márgenes con `env(safe-area-inset-*)`.
- Diálogos como **hoja desde abajo** (`Sheet side="bottom"`). Un formulario largo va en hoja alta que deja ver la página arriba, nunca a pantalla completa.
- Con el teclado abierto, el pie con la acción principal sigue a la vista.
- Cada campo ocupa la fila entera. Áreas táctiles de 44 px.
- Rótulos en una sola línea a 375 px.
- **Registro en menos de 1 minuto** desde el QR de la puerta: mail + contraseña o Google, y adentro.
- **Onboarding en 3 pasos** con progreso visible: datos → intereses y "¿por qué estoy acá?" → arquetipo (una pregunta por pantalla, respuestas grandes para tocar).

## Mentor: evaluar 5 personas en 10 minutos
- Lista del equipo con el estado de cada persona (sin empezar / borrador / enviada).
- En la persona: las dimensiones que le tocan al mentor (`individual` y `ambas`), cada una con sus niveles como opciones grandes, **un toque por nivel**. Observación corta opcional, plegada.
- **Guarda solo**, también sin señal: guarda en el dispositivo y sincroniza al volver la conexión. Un indicador discreto dice "Guardado" o "Sin conexión, se guarda en el teléfono".
- "Enviar" cuando terminó, con resumen antes de confirmar.

## Jurado
- Sus equipos asignados, con link a la entrega. Rúbrica de equipo (`grupal` y `ambas`). Mismo patrón que el mentor.

## Organizador
- Tablero en vivo: asistencia, evaluaciones pendientes por mentor y jurado, completitud. Pocos KPI, los mismos en todas partes.
- Se usa en compu y en celular. En el celular, las tablas pasan a lista de filas.
- Acciones fuertes (publicar devoluciones, rotar QR, quitar staff) con confirmación que dice qué va a pasar y a cuántas personas.
- QR de asistencia a pantalla completa, legible desde lejos, con el código en texto abajo.

## Listas y filas
- La fila entera abre el detalle. **Nada destructivo en las filas**: quitar, borrar o revocar va adentro, con confirmación.
- Número a la derecha, `tabular-nums`. Debajo del título, una línea de datos chicos separados por " · ".

## Filtros
- A la Notion: un solo botón (Filtrar); lo aplicado queda como etiquetas con cruz.
- Reportes del organizador: período arriba y "Comparar con" en un solo control.

## Formularios
- Asterisco en lo obligatorio. Al intentar enviar sin completar: el campo en rojo y un aviso que dice qué falta.
- Lo que aparece entra con fundido; lo que se pliega achica su altura de a poco.
- Con cambios sin guardar, cerrar pregunta antes.

## Landing
- Nivel de calidad de la landing de LaunchKit (`~/Projects/launchkit/apps/web/src/components/marketing/`). Se toma el nivel, no el contenido.
- El contenido sale de `docs/landing-contenido.md` y de la skill `content-strategy`. Cada dato con su fuente.
- LCP < 2,5 s en celular. Lighthouse ≥ 90 en performance y accesibilidad.

## Antes de dar una pantalla por terminada
1. Mirarla en el navegador del panel a 375 px y a 1280 px, con datos realistas (`prueba-`).
2. Chequear: rótulos en una línea, nada que desborde, nada de relleno, ceros ocultos, filas sin acciones destructivas, contraste AA (violeta chico en `#6A4AD9`).
3. Recorrer el flujo de punta a punta (tipear, elegir, guardar, cancelar con cambios, sin señal si aplica).
4. Con el navegador del panel oculto, las animaciones no corren: verificar duraciones con `getComputedStyle` y avisar que el movimiento real se mira en el teléfono.
