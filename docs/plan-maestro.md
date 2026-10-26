# TIM — plataforma (VPP de la tesis) + harness + handoff

## Contexto
El equipo Beitzá (UTDT, Desarrollo de Nuevos Negocios) arma TIM: jóvenes resuelven desafíos y construyen un perfil con evidencia de sus habilidades. Fuentes: business plan (BP, sep-2026), diagramas B2C y B2B, manual de marca y la charla de Joaquín con Sofía (Lohidoy, del equipo).

Qué tiene que lograr el VPP según Sofía: **medir el interés de las personas y si la aplicación funciona**. Foco en **habilidades blandas**; las duras (ej. Excel básico / intermedio / avanzado) quedan para después.

Hito duro: **hackatón del sábado 31/10/2026** (hoy es domingo 25/10). 40 participantes, 8 equipos de 5, un mentor por equipo, unos 4 jurados.

Decisiones tomadas:
- Alcance final: plataforma completa, pero **en orden de evento**. Primero lo que la hackatón necesita, después los juegos, después perfil y outputs, después el lado empresa.
- Mentor y jurado evalúan **equipo + persona** (como el Anexo 6). El mentor observa a las personas; el jurado evalúa la entrega del equipo.
- Juegos iniciales: crucigrama, adivinar la palabra y acertijo de Einstein, con contenido propio.
- **Sin monetización.** Esta instancia valida el problema y la solución. Nada de pagos, precios, planes ni estados comerciales en el producto. Los precios del BP quedan solo en el BP.
- Repo y deploy nuestros durante el desarrollo; base desde el día 1 en el Supabase de Sofía; transferencia al final.

## Hallazgos del BP (avisarle a Sofía, no tocan el código)
- Tipografía: el manual dice Manrope + Inter; el Anexo 7 dice Montserrat + Calibri. Se usa Manrope + Inter.
- Cifras: el índice dice TAM 1.534 M / SAM 568 M; el cuerpo dice 2.212 M / 819 M.
- Regla de negocio: un desafío es solo evaluación, nunca trabajo productivo gratis (pág. 17). Va a los términos y al formulario de propuesta de desafío de empresa.

## Roles
`estudiante` (usuario final) · `mentor` · `jurado` · `organizador` (equipo TIM) · `empresa` (más adelante). Una persona puede tener más de un rol. Los roles de staff los asigna el organizador desde una invitación; nadie se autoasigna.

## Vocabulario (`CONTEXT.md`, un término por concepto)
Estudiante · Mentor · Jurado · Organizador · Empresa · Evento (la hackatón) · Asistencia ("estuve ahí") · Equipo · Desafío · Entrega · Rúbrica · Dimensión · Nivel · Evaluación (individual / de equipo) · Devolución (lo que ve el estudiante) · Actividad (juego) · Partida · Señal (lo que mide una partida) · Perfil TIM · Habilidad blanda / dura · Interés (de una empresa en un perfil anónimo) · Contacto (el estudiante acepta que la empresa vea su nombre) · Credencial verificable.

## Infraestructura gratis (verificado 25/10/2026)
| Servicio | Plan | Límite que importa |
|---|---|---|
| Supabase (cuenta de Sofía) | Free | 2 proyectos activos por usuario owner; 500 MB DB; 1 GB storage; 50k MAU; **pausa tras 7 días sin actividad**; mail por defecto solo a miembros del equipo y 2 por hora |
| Vercel | Programon ahora, Hobby de Sofía al final | Hobby: no comercial; cron 1 vez por día; bloquea commits de terceros en repos privados → al transferir, repo público |
| Resend | Free | 3.000 por mes, 100 por día; exige dominio propio |

Decisiones de infraestructura:
- **Login para la hackatón: mail + contraseña sin confirmación por mail, y Google.** No necesita SMTP, y 40 personas se registran en 1 minuto desde el celular. El magic link y la confirmación por mail entran cuando haya dominio + Resend.
- Pausa de Supabase: cron diario (`/api/cron/salud`) con un `select` real.
- Proyectos `tim-dev` y `tim-prod` en la cuenta de Sofía.
- Por qué Supabase y no Neon: hacen falta Auth, Storage para las entregas y RLS en un solo lugar. Netlify no resuelve la base.

**Bloqueante de hoy:** Sofía crea su cuenta de Supabase e invita a joaquinberardi@programon.co como owner. Sin eso no hay deploy live el martes. Mientras tanto se trabaja con Supabase local.

## Stack (versiones verificadas en npm hoy)
Next.js 16.4.3 (App Router, Server Components, Server Actions) · React 19 · TypeScript strict · Tailwind 4.3 · shadcn 4.22 sobre Base UI 1.9 · `@supabase/ssr` 0.12 + `supabase-js` 2.118 · zod 4 · sonner · lucide · `qrcode` · `@react-pdf/renderer` (CV, fase C) · Vitest + Playwright · pnpm. Sin modelos de IA en el producto.
Se copian de `~/Projects/sole-30-pueblos/dashboard/`: clientes de Supabase (`src/lib/supabase/{navegador,servidor,servicio}.ts`), migraciones numeradas con su porqué dentro de `BEGIN`, script `verificar`, `AGENTS.md` con tabla de ruteo.

## Modelo de datos (todo con RLS)
- `perfiles` (1:1 con `auth.users`) y `roles_usuario` (persona, rol, evento).
- `estudiantes`: carrera, universidad, año, área buscada, intereses, "¿por qué estoy acá?", arquetipo (árbol del Anexo 2), CV opcional (Storage privado), consentimiento.
- `eventos`: nombre, fecha, lugar, código de asistencia rotativo (QR en pantalla del lugar).
- `asistencias`: estudiante, evento, hora, método (QR o carga del organizador).
- `equipos` y `miembros_equipo`; `asignaciones` (mentor → equipo, jurado → equipos).
- `desafios`: del evento o virtuales, consigna, fechas, estado.
- `rubricas` / `dimensiones` / `niveles`: la plantilla es el Anexo 6 (5 dimensiones con instancia grupal o individual). Niveles descriptivos, no notas. Cada dimensión dice quién la evalúa: mentor, jurado o los dos.
- `evaluaciones`: evaluador, rol, objetivo (persona o equipo), nivel por dimensión, observación, estado (`borrador` / `enviada`).
- `devoluciones`: lo que ve cada estudiante. La arma el sistema con sus evaluaciones individuales + las de su equipo, y el organizador la **publica** (nada llega antes).
- `actividades` (juegos: tipo, duración estimada, contenido versionado) y `partidas` (inicio, fin, resultado, eventos de juego en JSON: intentos, pistas, correcciones, abandono).
- `senales`: derivadas de partidas, con su regla de cálculo escrita.
- `encuestas` / `respuestas`: interés post evento y post actividad.
- `interesados` y `eventos_landing`: registro y comportamiento en la landing. Inserción anónima solo por Server Action con validación y rate limit; lectura solo del organizador.
- Más adelante: `empresas`, `intereses`, `contactos`, `propuestas_desafio`, `credenciales`, `habilidades_duras`.

Seguridad: el estudiante solo ve su devolución publicada. El mentor solo ve a su equipo. El jurado solo ve a sus equipos asignados. Las evaluaciones de otros evaluadores no se ven entre sí hasta el cierre, para no sesgar. La empresa nunca lee estudiantes directo: usa una vista anónima y una función `security definer` que exige un contacto aceptado por el estudiante.

## Roadmap
Cada fase tiene DoR (qué tiene que estar antes) y DoD (cómo se da por terminada).

### Fase L — Landing de conversión (live el jue 29/10, junto con la fase A)
Para qué: es el instrumento principal para validar el interés, de los dos lados. Es también la puerta de entrada al registro (el QR de la hackatón apunta acá).

Nivel de calidad: el de la landing de LaunchKit. Referencia de estructura y motion en `~/Projects/launchkit/apps/web/src/components/marketing/` (`Landing.tsx`, `LandingNav.tsx`, `HeroOrbit.tsx`, `RevealObserver.tsx`) y `apps/web/src/app/landing.css`. Se toma el nivel, no el contenido.

Proceso:
1. El contenido va antes que el diseño: skill `content-strategy` de `~/Projects/skills-kit/` (discovery → arquitectura → copy → CRO → autocrítica).
2. Copy con datos del BP, cada uno con su fuente citada:
   - 72 % de los jóvenes señala la falta de experiencia como el principal obstáculo (UCEMA, 2025).
   - 71 % sintió que no logró mostrar su potencial en una entrevista (relevamiento propio).
   - 87,7 % mostró interés en resolver un desafío real (relevamiento propio).
   - Para empresas: 10 de 15 PyMEs no consiguieron candidatos adecuados (relevamiento propio).
3. Mockup como artifact para que Sofía y el equipo lo revisen antes de codear.
4. Implementación en el mismo repo, como página estática (CDN).

Estructura propuesta:
1. Hero: "Tu capacidad, en evidencia." Con un isotipo animado: los tres módulos que se apilan, la metáfora del perfil que se construye. Dos CTA, uno por audiencia: "Quiero demostrar lo que sé" y "Busco talento junior".
2. Problema, para estudiantes: el CV no muestra cómo pensás.
3. Cómo funciona: desafío → evidencia → perfil. Tres pasos con mini demos animadas de la rúbrica y del perfil.
4. Qué te llevás: perfil de habilidades blandas, CV, QR verificable.
5. Para empresas: conocé cómo trabaja alguien antes de la entrevista. Perfiles anónimos y desafíos sobre problemas reales.
6. Prueba: la hackatón del 31/10 y los números del relevamiento.
7. Preguntas frecuentes: ¿cuesta algo?, ¿quién ve mis datos?, ¿qué es un desafío?
8. CTA final.

Medición, toda en la base propia (sin herramientas pagas):
- Registro de interés corto por audiencia, en la tabla `interesados`:
  - Estudiantes: mail, carrera, año, arquetipo en una pregunta.
  - Empresas: mail, tamaño, rubro, "¿propondrías un desafío?".
- Eventos de la landing en `eventos_landing`: visitas, scroll por sección, clics en cada CTA, inicio y fin del formulario, origen (`utm`, QR de la hackatón).
- Dos variantes del título del hero con reparto fijo por visitante, para ver qué mensaje convierte más.
- Panel de organizador: conversión por audiencia, por origen y por variante. Export CSV para la tesis.

Diseño:
- Marca del manual. Mobile primero.
- Motion según `emil-design-eng`: solo transform y opacity, respeta reduced-motion.
- LCP < 2,5 s en celular. OG image propia, metadata y favicon con el isotipo.
- Accesibilidad AA.

DoR: Sofía confirma los textos clave (título, promesa a empresas) el martes 27/10.
DoD:
- Mockup aprobado.
- Live, vista a 375 y 1280 px.
- Registro y eventos guardando en `tim-prod`, verificados con una carga de prueba que después se borra.
- Lighthouse en celular ≥ 90 en performance y accesibilidad.

### Fase A — Hackatón (lista el jue 29/10; ensayo el vie 30/10)
DoR: Supabase de Sofía creado; Sofía confirma consigna, equipos y mentores y jurados con sus mails antes del miércoles.

**Estudiante (celular)**
- Registro en menos de 1 minuto desde un QR en la puerta.
- Onboarding corto en 3 pasos:
  1. Datos.
  2. Intereses de carrera y "¿por qué estoy acá?".
  3. Arquetipo, con el árbol del Anexo 2.
- CV opcional, para poder correr después la comparación "CV vs. evidencia" del BP.
- "Estuve ahí": escanea el QR del evento o lo marca el organizador.
- Ve su equipo y, después del evento, su devolución.

**Mentor (celular)**
- Ve su equipo.
- Evalúa a cada persona con la rúbrica: un toque por nivel y una observación corta por dimensión.
- Guarda solo, también sin señal: guarda en el dispositivo y sincroniza cuando vuelve la conexión.
- Envía cuando terminó.

**Jurado**
- Evalúa la entrega y el pitch de cada equipo asignado con la rúbrica de equipo.

**Organizador**
- Arma el evento, los equipos y las asignaciones, y carga staff por mail.
- Proyecta el QR de asistencia.
- Tablero en vivo: asistencia, evaluaciones pendientes por mentor y jurado, completitud.
- Publica las devoluciones.
- Exporta CSV.

**Interés**
- Encuesta de 3 preguntas al publicar la devolución:
  - ¿Te sirvió?
  - ¿Querés seguir sumando evidencia?
  - ¿La compartirías con una empresa?
- Se registra la apertura de la devolución.

DoD:
- Ensayo del viernes con 8 cuentas de prueba (prefijo `prueba-`) y los mentores reales en sus celulares.
- Playwright cubre registro, asistencia, evaluación de mentor y publicación.
- Tests de RLS: un mentor no ve otro equipo; un estudiante no ve devoluciones sin publicar.
- Deploy live verificado.
- Plan B en papel: la misma rúbrica impresa y carga posterior del organizador. Si se usa, queda marcada como "carga diferida".
- Datos de prueba borrados antes del sábado.

### Fase B — Actividades virtuales (noviembre, semanas 1 y 2)
- Biblioteca de actividades filtrada por tiempo: "tengo 5 / 15 / 30 min".
- Tres juegos con contenido propio:
  - **Adivinar la palabra**: tipo Wordle, lista de palabras en español con licencia libre.
  - **Crucigrama**: grillas propias.
  - **Acertijo de Einstein**: lógica con pistas, en grilla.
- Cada partida registra el proceso, no solo el resultado: tiempo, intentos, pistas usadas, correcciones, abandono y reintento.
- Señales con regla escrita y honesta. Ejemplos: persistencia (reintenta tras error), uso de información (pistas antes de arriesgar), autocorrección. En la UI se llaman **señales**, nunca "medición validada", porque en la tesis se defienden como hipótesis.
- Encuesta de 1 pregunta al terminar cada partida.

DoD: los 3 juegos jugables en celular de punta a punta, con señales calculadas por tests sobre partidas de ejemplo.

### Fase C — Perfil TIM y outputs (noviembre, semanas 3 y 4)
- Perfil de trazabilidad de habilidades blandas: hackatón + actividades, con evolución.
- CV descargable en PDF.
- QR verificable: página pública `/v/[token]` que se puede revocar.
- Credencial compartible, instalable como PWA.
- Botón "Agregar a LinkedIn".
- Pases reales de Apple y Google Wallet: fuera de alcance, porque requieren cuentas pagas o el alta como emisor.

### Fase D — Lado empresa (B2B, diciembre)
Valida si la evidencia le sirve a la empresa para decidir. Sin pagos.
- Ecosistema con filtros sobre perfiles anónimos (diagrama B2B: "se lo damos sin nombre").
- "Me interesa" sobre un perfil. El estudiante recibe el aviso y decide si acepta el contacto. Recién ahí la empresa ve nombre y datos.
- Propuesta de desafío: la empresa cuenta su problema y TIM lo arma con su rúbrica.
- Experimento CV vs. evidencia con los CV juntados en la fase A: la empresa decide primero solo con el CV y después con la evidencia, y el sistema guarda las dos decisiones. Panel con los criterios del BP:
  - asistencia ≥ 70 %;
  - completitud ≥ 80 %;
  - cambio de evaluación ≥ 25 %, o al menos 1 rescatado.

### Fase E — Habilidades duras (futuro)
Checklists por nivel (ej. Excel básico, intermedio y avanzado) con ejercicios que generan evidencia. Se habilitan después de tener perfil blando (nota roja del diagrama B2C).

### Fase F — Pulido y transferencia (al cerrar la tesis o cuando Sofía lo pida)
- Accesibilidad AA, motion según `emil-design-eng`, términos y privacidad (datos de estudiantes, consentimiento, borrado de cuenta).
- Dominio + Resend.
- Transferencia, con checklist en `docs/transferencia.md`:
  1. Sofía crea GitHub y Vercel.
  2. Se transfiere el repo a su cuenta y se hace público, después de revisar que el historial no tenga secretos.
  3. Se importa en su Vercel con las env vars.
  4. Se actualizan las URLs de redirect en Supabase Auth.
  5. Se verifica que quedó live.
  6. Recién ahí se borra el proyecto viejo.

## Diseño
- Mobile primero de verdad: en la hackatón todo pasa en el celular.
- Barra abajo para el estudiante. Hojas desde abajo. Teclado que no tapa el botón.
- La pantalla del mentor optimizada para evaluar 5 personas en 10 minutos.
- Marca del manual:
  - Colores: Verde TIM #17483F, Violeta #8061EB, Lila #AA8CFA, Lila claro #E8DFFF, Crema #FAF8F4, Verde oscuro #102E28.
  - Tipografías: Manrope en títulos, Inter en texto.
  - Isotipo como ícono de la app.
- Criterio general: skill `diseno-de-la-app` (adaptada) y `emil-design-eng`.

## Harness para el equipo (dentro del repo)
- **`CLAUDE.md`**:
  - qué es TIM;
  - regla "la persona no corre comandos: Claude levanta, migra, verifica y deploya";
  - tabla de ruteo "te piden X → leé Y";
  - reglas duras: RLS siempre, nada de `service_role` en el cliente, nunca datos de prueba como reales, el anonimato se hace cumplir en la base, las señales nunca se presentan como medición validada, no se agrega monetización en esta etapa.
- **`CONTEXT.md`**: el vocabulario de arriba.
- **`docs/`**:
  - `puesta-en-marcha.md`
  - `trabajar-en-local.md`
  - `infraestructura.md`: cuentas, límites, qué pasa si se llena algo o se pausa la base.
  - `modelo-de-datos.md`
  - `senales.md`: regla de cada señal.
  - `decisiones/`: ADR cortos.
  - `roadmap.md`: estas fases, con su estado.
  - `transferencia.md`
- **`.claude/rules/`**: diseño, seguridad, datos y migraciones, textos (rioplatense, botones con verbo).
- **`.claude/skills/`**:
  - `diseno-de-la-app`
  - `emil-design-eng`
  - `nueva-funcionalidad`: spec corta → migración → UI → tests → verificar → deploy.
  - `migracion`: dev → prod.
  - `verificar`
  - `deploy`: push + `vercel inspect` hasta live.
  - `preparar-evento`: equipos, staff, QR, ensayo.
  - `nueva-actividad`: agregar un juego con sus señales.
  - `reporte-tesis`: export y lectura de métricas de interés (landing, encuestas) y del piloto.
  - `content-strategy`: copiada de `~/Projects/skills-kit/`, para cambios de copy en la landing.
  - `grow`
- **`.claude/agents/`**: `code-reviewer` y `debugger`, con modelo actualizado.
- **`.claude/settings.json`**: hooks del kickoff (bloquear comandos destructivos y `push --force`, avisar en `.env`, PreCompact).
- **Bases a copiar**: `~/Projects/claude-project-kickoff/`, `~/Projects/lo-de-gabi/.claude/skills/{diseno-de-la-app,emil-design-eng}` y `~/Projects/sole-30-pueblos/dashboard/`.
- **Dónde vive**:
  - Local: `~/Projects/tim/`.
  - Remoto: repo privado `programon-arg/tim` en el Vercel de Programon, hasta la transferencia.
  - Se suma una línea al mapa `~/Projects/CLAUDE.md`.

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Fecha | Seis días para la fase A. Se recorta sin piedad todo lo que no se usa el sábado. |
| Wifi del lugar | Guardado local del mentor y plan B en papel. |
| Supabase de Sofía no creado | Si el lunes a la noche no está, se crea `tim-prod` en una cuenta nuestra. Para eso hay que pausar un proyecto propio poco usado (los pausados no cuentan para el límite), y te consulto antes cuál. Después se migra a lo de Sofía en la fase F. |
| Datos de menores o sensibles | Consentimiento explícito en el onboarding y CV solo visible para organizadores. |

## Verificación (en cada fase, antes de decir "listo")
1. `pnpm verificar` (tipos + lint + Vitest + build) en verde, con el dev server parado.
2. Playwright sobre los flujos de la fase contra `tim-dev`.
3. Tests de policies de RLS por rol.
4. Cada pantalla nueva mirada en el navegador del panel a 375 y 1280 px.
5. Push → `vercel inspect` hasta `READY` → recorrer el flujo en la URL live.
6. Datos de prueba con prefijo `prueba-`, borrados al cerrar.

## Primer paso al aprobar
Mandarle a Sofía el pedido de hoy:
- crear Supabase e invitar a Joaquín;
- consigna de la hackatón;
- lista de mentores y jurados con sus mails.

En paralelo, arrancar la fase A en `~/Projects/tim/` con Supabase local.
