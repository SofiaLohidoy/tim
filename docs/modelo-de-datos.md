# Modelo de datos

Fuente de verdad: `supabase/migrations/*.sql`. Cada migración explica su porqué arriba. Esto es un mapa para leer rápido; si no coincide con las migraciones, mandan las migraciones y se corrige este archivo.

Todo está en el esquema `public`, con RLS activa en todas las tablas. Abajo, "Org." es el organizador.

## Helpers de RLS
Funciones `security definer` con `search_path = ''`. Las usan las policies para no caer en recursión.

| Función | Devuelve true si... |
|---|---|
| `es_organizador()` | la persona tiene el rol `organizador` |
| `tiene_rol(rol)` | la persona tiene ese rol en algún evento |
| `evalua_equipo(equipo, rol?)` | la persona está asignada a ese equipo (como mentor o jurado) |
| `es_miembro(equipo)` | la persona integra ese equipo |
| `puede_ver_persona(usuario)` | es ella misma, es Org., evalúa su equipo o es compañera de equipo |
| `evaluacion_permitida(...)` | el evaluador está asignado al equipo con ese rol y el estudiante es del equipo |
| `devoluciones_publicadas(evento)` | el evento ya publicó sus devoluciones |

## Funciones que llama la app
| Función | Quién | Qué hace |
|---|---|---|
| `marcar_asistencia(codigo)` | estudiante logueado | Valida el código vigente del QR (o el anterior, hasta 3 min después de rotar) y registra la asistencia. |
| `registrar_entrega(equipo, url)` | integrante del equipo | Guarda el link de la entrega. Solo `http(s)`, máximo 500 caracteres. |
| `marcar_devolucion_abierta(devolucion)` | estudiante | Marca `abierta_en` la primera vez que abre su devolución publicada. |
| `resumen_landing(desde?)` | organizador | Devuelve en jsonb visitas y registros por variante, origen, sección, CTA y formulario (006). Si no es organizador, tira `solo_organizador`. |

## Tablas

### Personas (001, 002)
| Tabla | Qué guarda | Lee | Escribe |
|---|---|---|---|
| `perfiles` | 1:1 con `auth.users`: mail, nombre, apellido. Lo crea un trigger al registrarse. | `puede_ver_persona` | La persona (solo nombre y apellido) y Org. El mail no se cambia desde la app. |
| `roles_usuario` | Persona + rol + evento. Organizador es global (`evento_id` null). | La persona (los suyos) y Org. | Solo Org. y los triggers. |
| `invitaciones` | Mail + rol + evento + equipo. Única por (mail, rol, evento, equipo): un jurado se puede pre-asignar a varios equipos (006). Tiene un `token` para el link personal `/invitacion/<token>` (007). Con Google se aplica sola al entrar; con mail y contraseña, solo abriendo el link con ese mail (`reclamar_invitacion`). La de estudiante (equipo) se aplica por mail al registrarse. | Org. | Org. |
| `estudiantes` | Onboarding: universidad, carrera, año, área buscada, intereses, "por qué estoy acá" (≤ 500), arquetipo y sus respuestas, CV, consentimiento (obligatorio). Al completar el onboarding se agrega el rol `estudiante`. | La persona y Org. Mentores y jurados **no**. | La persona (la suya). |
| `storage.objects` bucket `cvs` | CV en PDF, ≤ 5 MB, ruta `<usuario_id>/cv.pdf`. Privado. | La persona y Org. | La persona. |

### Evento (003)
| Tabla | Qué guarda | Lee | Escribe |
|---|---|---|---|
| `eventos` | Nombre, fecha, lugar, estado, rúbrica, `devoluciones_publicadas_en`. | Cualquier logueado | Org. |
| `codigos_asistencia` | Código vigente y anterior del QR. Aparte de `eventos` para que nadie lo lea y marque asistencia desde la casa. | Org. | Org. |
| `asistencias` | Evento + persona + método (`qr` / `organizador`). Una por persona y evento. | La persona y Org. | Org., o el estudiante vía `marcar_asistencia`. |
| `desafios` | Consigna, fechas, estado. | Logueados, si no es borrador; Org. siempre. | Org. |
| `equipos` | Nombre, entrega (link y hora). | Integrantes, evaluadores asignados, Org. | Org.; la entrega vía `registrar_entrega`. |
| `miembros_equipo` | Equipo + persona. Una persona, un equipo por evento (lo garantiza la base). | Integrantes, evaluadores asignados, Org. | Org. y el trigger de invitaciones. |
| `asignaciones` | Evaluador + equipo + rol (`mentor` / `jurado`). | El evaluador (las suyas) y Org. | Org. y el trigger de invitaciones. |

### Evaluación (004)
| Tabla | Qué guarda | Lee | Escribe |
|---|---|---|---|
| `rubricas` | Nombre, descripción, si es plantilla. La plantilla es la del Anexo 6. | Logueados | Org. |
| `dimensiones` | Las 5 capacidades, con qué observar e instancia (`grupal` / `individual` / `ambas`). | Logueados | Org. |
| `niveles` | 4 niveles descriptivos. Sin valor numérico. **Los textos son una propuesta a confirmar con Sofía.** | Logueados | Org. |
| `evaluaciones` | Evaluador, rol, objetivo (`persona` / `equipo`), respuestas en jsonb `{ "<dimension_id>": { "nivel": <id>, "obs": "" } }`, comentario (≤ 2000), estado (`borrador` / `enviada`), carga (`directa` / `diferida`). Una fila por evaluador y objetivo. | El propio evaluador y Org. **Ningún evaluador ve las de otro.** | El evaluador asignado, solo carga directa, hasta que se publican las devoluciones. Org. siempre (así carga lo diferido). |
| `devoluciones` | Foto armada por Org. (`contenido` jsonb), `publicada_en`, `abierta_en`. | El estudiante, solo si está publicada. Org. siempre. | Org.; el estudiante solo `abierta_en` vía función. |
| `respuestas_encuesta` | Encuesta `post_devolucion`: una respuesta por persona y evento. | La persona y Org. | La persona (la suya). |

### Landing (005)
| Tabla | Qué guarda | Lee | Escribe |
|---|---|---|---|
| `interesados` | Audiencia, mail, datos del formulario, variante, origen, visitante, hash de IP. Uno por audiencia y mail. | Org. | **Nadie desde el navegador.** Solo el servidor, con zod + rate limit, usando la clave secreta. |
| `eventos_landing` | Visitante, tipo (`visita`, `seccion`, `clic_cta`, `form_inicio`, `form_fin`, `form_error`), detalle, variante, origen. | Org. | Igual que `interesados`. |

La IP no se guarda: solo un hash con sal (`LANDING_SAL`) para el rate limit.

### Actividades virtuales (010)
El contenido de los juegos no está en la base: vive versionado en `src/lib/actividades/` (`catalogo.ts` lo público, `soluciones.ts` las respuestas, solo servidor). Los tests comprueban que cada crucigrama cierre y cada acertijo tenga una sola solución.

| Tabla | Qué guarda | Lee | Escribe |
|---|---|---|---|
| `partidas` | Persona, actividad (slug) y versión jugada, número de partida, resultado (`en_curso` / `resuelta` / `no_resuelta` / `abandonada`), `eventos` (cada intento, comprobación, pista, abandono, con su momento), `objetivo` (ej. qué palabra tocó). | La persona y Org. **`objetivo` no se puede leer desde el navegador** (revocado por columna). | Solo el servidor (clave secreta), que corrige cada jugada. |
| `senales` | Partida, clave (`persistencia`, `uso_de_informacion`, `autocorreccion`), valor 0–1, detalle y versión de la regla. | La persona y Org. | Solo el servidor, al terminar la partida. Reglas en `docs/senales.md`. |
| `respuestas_encuesta` (ampliada) | Suma `post_partida` (una pregunta al terminar cada partida) con `partida_id`. | La persona y Org. | La persona / el servidor. |

### Credencial verificable (011, 012)
| Tabla | Qué guarda | Lee | Escribe |
|---|---|---|---|
| `credenciales` | Persona, `token` del link público `/v/<token>`, `revocada_en`. | La persona y Org. | La persona: crear y revocar (solo `revocada_en`). |

La página pública la arma `credencial_publica(token)` (SECURITY DEFINER, la puede llamar cualquiera con el token): nombre, carrera, universidad, niveles observados en devoluciones publicadas, cantidad de eventos y partidas. **No** muestra observaciones textuales ni señales de juegos. Un link revocado no devuelve nada.

`marcar_preparadas` y `devoluciones_desactualizadas` (012) comparan "preparada" contra "evaluación cambiada" con el reloj de la base.

## Lo que todavía no existe
Según el plan: `intereses`, `contactos`, `propuestas_desafio` (fase D); `habilidades_duras` (fase E). Cuando se creen, se suman acá en la misma migración que los crea. El perfil básico de `empresas` está implementado en desarrollo según la sección siguiente.

## Perfil básico de empresa (migraciones 013–014)
Tabla empresas: usuario_id, nombre, rubro, tamano, creado_en y actualizado_en. Cada usuario lee solo su empresa. guardar_empresa valida y guarda el perfil propio y asigna exclusivamente el rol empresa; iniciar_registro_empresa recuerda el recorrido antes de completar el perfil. No habilitan lectura de estudiantes ni perfiles ajenos. Las escrituras directas están revocadas. Aplicado en tim-dev y producción; registro, guardado, edición y reingreso verificados en producción el 26/10/2026 con una cuenta prueba- eliminada al terminar.

## Eliminación de estudiantes (015)
`respaldos_eliminacion` guarda una foto de las filas personales, invitaciones y CV antes de borrar una cuenta. RLS activa, sin acceso para anon ni authenticated; acceso técnico con service_role. No guarda contraseñas ni sesiones. `respaldar_estudiante` exige organizador, coincidencia de mail y estudiante sin otros roles ni invitaciones de staff; rechaza la cuenta propia. La acción del servidor elimina CV mediante Storage API y cuenta mediante Auth Admin, después del respaldo. Los datos con FK a la cuenta se borran en cascada; se conservan equipos y sus entregas compartidas. Si falla Auth, se intenta restaurar el CV. Los respaldos de las verificaciones se eliminan por ID exacto.

## Entregas de equipo (016)
`equipos.entrega_url` conserva los links ya cargados. `entregas_equipo` agrega un archivo compartido por equipo, con nombre, tipo, tamaño, autor y fecha. PDF, PPTX o DOCX hasta 4 MB, bucket privado `entregas`. La carga del servidor exige sesión y pertenencia; `guardar_archivo_entrega` revalida pertenencia, evento abierto, tipo y existencia del objeto. No hay escritura directa de clientes. Lectura por integrantes, organizadores y jurados asignados, nunca por empresas, anónimos ni mentores sin rol de jurado asignado. El objeto se crea con service_role para que una eliminación individual no borre ni bloquee una entrega grupal. El autor pasa a null al borrar su cuenta; el archivo se conserva. Abrir `/entregas/[equipo]` usa la sesión y RLS y firma una URL privada por 120 segundos. CV personales permanecen en otro bucket y no se convierten en entregas.
