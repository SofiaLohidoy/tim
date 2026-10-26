---
name: content-strategy
description: >-
  Usar SIEMPRE antes de escribir, generar, rehacer o revisar el CONTENIDO/copy (no el diseño
  visual) de una landing, sitio o página de marketing — de un cliente o del propio
  producto/empresa: hero, secciones, headlines, propuesta de valor, prueba/confianza, CTAs,
  FAQ. Fuerza una secuencia estrategia-primero (clasificar naturaleza → metabolizar brief →
  gate de inputs → arquitectura → copy prueba-primero → auto-crítica anti-genérica) para que
  el contenido base no salga genérico. Se dispara con pedidos tipo "escribí el contenido de la
  landing", "el copy del sitio", "rehacé/mejorá el hero", "armá las secciones", "esto quedó
  genérico, mejoralo", "write the landing copy", "rewrite the hero". NO es para ejecución
  visual (colores, componentes, layout, tipografía) — de eso se ocupan las skills de UI.
---

# Content Strategy — contenido estrategia-primero

Tu trabajo con esta skill es convertir un brief en **contenido base que NO sea genérico**.

La enfermedad que esto previene tiene nombre: **"copy de manual"** — la empresa hablando
de sí misma ("tenemos 30 años, 200 personas, tecnología"), secciones ordenadas por *cosas
de la empresa* en vez de por *lo que el lector necesita para confiar*, claims sin la prueba
al lado, y un solo mensaje donde hay dos públicos distintos. Se ve prolijo y no convierte.

> **Regla de oro:** no escribas un solo headline hasta pasar los Pasos 0-3. Si te falta un
> input, **marcá el hueco como PENDIENTE — nunca lo inventes.** Lo genérico casi siempre es
> síntoma de un input que falta, no de falta de oficio. Rellenar con paja lo esconde; marcarlo
> lo resuelve.

**¿Venís a MEJORAR copy existente** (no a escribir desde un brief)? Corré primero el **Paso 5**
(gate) para diagnosticar qué falla, después completá hacia atrás los **Pasos 1-2** (qué inputs
faltan que explican lo genérico) y reescribí con los **Pasos 3-4**.

### No-negociables (aplican aunque no abras ninguna referencia)

- **Palabras prohibidas** (reemplazá por lo concreto): disruptivo · innovador · soluciones
  integrales · líder / el mejor / de excelencia · calidad / compromiso / pasión · "+X años de
  experiencia" como headline solo. Si la frase la firma cualquier competidor, no sirve.
- **Tóxicos en alta confianza** (finanzas, salud, legal, seguros, cobranzas): urgencia,
  escasez, countdown, "quedan 3", "solo hoy", descuentos agresivos, pop-ups de email. Ahí
  **legitimidad > conversión**.
- **Prueba con fuente:** todo dato/testimonio/número/premio va con su **fuente rastreable** a
  un input. Sin fuente, se trata como inventado → no se usa.
- **PENDIENTE nunca es claim** (ni siquiera como calificador): lo que no tenés confirmado **no
  aparece afirmado**. Si tenés el conteo pero no la credencial → "3 nutricionistas", no "3
  nutricionistas matriculadas".

Cada paso tiene una referencia con el detalle. Leé la referencia del paso antes de ejecutarlo.

---

## Paso 0 — Clasificá la naturaleza del proyecto  → `references/02-architecture.md`

Etiquetá el proyecto (son **tags, no excluyentes** — un proyecto puede ser varios):

- **DTC / e-commerce** — se vende un producto, hay carrito.
- **Servicios / B2B** — agencia, estudio, consultora; el objetivo es un lead/contacto.
- **Alta confianza** — finanzas, salud, legal, seguros, cobranzas. Legitimidad **> urgencia**.
- **Multi-público** — la misma página le habla a 2+ lectores con trabajos distintos.

La combinación decide **la arquitectura** y **qué patrones aplican (y cuáles son tóxicos)**.
Ejemplo recurrente en este kit: **EPB** (estudio de cobranzas para bancos) = Servicios +
Alta confianza + Multi-público (el banco que terceriza + el deudor que paga). *Es un ejemplo
ilustrativo, no tu cliente — no importes sus diferenciales.* Caso resuelto end-to-end en
`references/06-example-epb.md`.

## Paso 1 — Metabolizá el brief → spec estratégico  → `references/01-discovery.md`

Si hay una **fuente de datos del proyecto conectada** (un MCP de Google Drive con la carpeta
del cliente), **leé de ahí primero** — el brief es la fuente autoritativa; buscá también
competencia, reviews/opiniones, lista de premios, logos autorizados y campañas anteriores.
Apuntá a la **carpeta del proyecto puntual**, no a todo el Drive; **no traigas data sensible**
(en cobranzas/finanzas/salud: nada de datos de deudores, cifras confidenciales, PII).

Extraé y escribí explícitamente, antes de nada:

1. **Público(s).** Por cada lector: quién es · el *job* (¿para qué "contrata" esta página?)
   · **LA pregunta con la que llega** · su objeción/miedo #1 · qué lo convence.
2. **Mecanismo / diferencial real** — articulable en UNA oración. "Ingredientes naturales",
   "usamos tecnología" o una formulación que usa medio rubro son **categorías, no mecanismos**.
3. **Mapa de pruebas** — cada claim con la prueba concreta que lo sostiene **y su fuente**.
4. **Voz del cliente** — verbatims reales (reviews, soporte, comentarios de ads) si existen.
5. **Prohibidos / restricciones** — lo que el cliente NO deja decir (cifras, nombres, etc.).

## Paso 2 — Gate de inputs (acá se mata lo genérico)  → `references/01-discovery.md`

Por cada público, ¿tenés los **4 mínimos**? (problema en lenguaje del cliente · mecanismo ·
prueba con fuente · objeciones). Si falta alguno:

```
PENDIENTE: <input que falta> — hasta tenerlo, <esta sección> queda genérica.
```

Seguí, pero dejá esas zonas marcadas. **No inventes pruebas, testimonios ni datos.** Antes de
marcar algo PENDIENTE, **buscalo en el Drive del proyecto**: marcá PENDIENTE **solo lo que no
está ni en el brief ni en el Drive.**

## Paso 3 — Arquitecturá la página  → `references/02-architecture.md`

Elegí el orden de secciones según la naturaleza (Paso 0). Para **cada sección** declará:
- qué **pregunta del lector** contesta,
- qué **prueba** usa (con fuente),
- qué **objeción** disuelve.

Dos reglas que no se negocian:
- **La joya va arriba.** La prueba más fuerte no se entierra en el puesto 8.
- **Multi-público: no colapses las voces.** Decidí tracks (secciones dedicadas y/o hero de
  doble CTA), un recorrido claro por lector.

## Paso 4 — Escribí, prueba-primero  → `references/03-copy-craft.md`

Reglas duras al escribir:
- **POV del cliente** (de afuera hacia adentro: resultado/sentimiento), no de la marca hacia
  afuera (feature/proceso/ingrediente).
- **Beneficio antes que feature.** Toda feature se traduce a lo que le pasa al lector. La
  tecnología —y toda formulación/modelo estándar del rubro— es commodity: traducila a
  beneficio o no la vendas como diferencial.
- **Cada claim con su prueba pegada al lado** (con fuente), no seis secciones más abajo.
- **Objeciones disueltas sin nombrarlas** (no "¿preocupado por el precio?" antes del CTA).
- **CTAs con verbos de recibir** ("Conseguí", "Tercerizá", "Pagá tu deuda"), jerarquía clara.
- **Cero palabras vacías** (ver No-negociables arriba y la lista en la referencia).

## Paso 5 — Auto-crítica anti-genérica (gate final)  → `references/05-self-critique.md`

Corré el checklist de banderas rojas. **Si falla cualquiera, reescribí — no entregues.** El
gate solo vale si lo corrés **por escrito**: el test de los 5 segundos exige nombrar 2-3
competidores REALES del rubro y correr el hero contra cada uno; el filtro de table-stakes
exige responder por cada pilar "¿es norma del rubro? SÍ/NO"; cada prueba exige su fuente.

---

## Formato de salida

Un `.md` por página. Por cada sección:

```
### <Nombre de la sección>
- Pregunta del lector: <...>
- Público: <cuál, si es multi-público>
- Copy: <headline (con conteo de palabras) + cuerpo + CTA, listos para diseño>
- Prueba usada: <...> · Fuente: <input de donde sale; sin fuente = inventada, no la uses>
- Objeción que disuelve: <...>
```

Y al final, un bloque **PENDIENTES** con los huecos de input que dejaron zonas genéricas.

## Límites

Esta skill produce **contenido + arquitectura**, listos para bajar a diseño. **No hace el
diseño visual** (color, componentes, layout, motion) — eso lo toman las skills de UI del kit.
Ejemplo resuelto: `references/06-example-epb.md`. Referencia profunda opcional (benchmarks,
casos con datos): `references/appendix-cro-full.md`.
