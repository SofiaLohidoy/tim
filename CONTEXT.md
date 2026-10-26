# Vocabulario de TIM

Un término por concepto. Usá estos, en la UI, en el código y en los docs. Si un concepto nuevo no está acá, se agrega acá antes de usarlo.

## Personas y roles
Una persona puede tener más de un rol. Los roles viven como filas en `roles_usuario`. Los de staff los asigna el organizador por invitación; nadie se autoasigna.

| Término | Qué es | En la base |
|---|---|---|
| Estudiante | Joven que resuelve desafíos y construye su perfil. El usuario final. | rol `estudiante`; datos en `estudiantes` |
| Mentor | Acompaña a un equipo en el evento y observa a cada persona. | rol `mentor`; `asignaciones.rol = 'mentor'` |
| Jurado | Evalúa la entrega y el pitch de los equipos que tiene asignados. | rol `jurado`; `asignaciones.rol = 'jurado'` |
| Organizador | Equipo TIM. Arma el evento, carga staff, publica devoluciones. Rol global. | rol `organizador`, `evento_id` null |
| Empresa | PyME o startup que mira perfiles anónimos y propone desafíos. Fase D. | rol `empresa` (sin tablas todavía) |
| Invitación | Alta anticipada de una persona por mail con su rol y, si corresponde, su equipo. | `invitaciones` |

## Evento y trabajo
| Término | Qué es | En la base |
|---|---|---|
| Evento | Una instancia presencial. La primera es la hackatón del 31/10/2026. | `eventos` (`preparacion` / `en_curso` / `cerrado`) |
| Asistencia | El "estuve ahí": la persona escanea el QR del lugar o la marca el organizador. | `asistencias` (`metodo`: `qr` / `organizador`); código en `codigos_asistencia` |
| Equipo | Grupo de estudiantes de un evento. Una persona, un equipo por evento. | `equipos`, `miembros_equipo` |
| Asignación | Qué mentor o jurado evalúa qué equipo. | `asignaciones` |
| Desafío | El problema a resolver. Es solo evaluación, nunca trabajo gratis. | `desafios` (`borrador` / `publicado` / `cerrado`) |
| Entrega | Lo que el equipo presenta, como link. | `equipos.entrega_url`, `entrega_en` |

## Evaluación
| Término | Qué es | En la base |
|---|---|---|
| Rúbrica | Conjunto de dimensiones y niveles. La plantilla es la del Anexo 6 del BP. | `rubricas` (`es_plantilla`) |
| Dimensión | Una capacidad observable (ej. "Comprensión del problema"). Son 5. | `dimensiones` |
| Nivel | Descripción de cuánto se observa una dimensión. Descriptivo, nunca una nota. | `niveles` (`orden` solo para dibujar) |
| Instancia | A quién mira una dimensión: `grupal` (el equipo, lo evalúa el jurado), `individual` (la persona, lo evalúa el mentor) o `ambas`. | `dimensiones.instancia` |
| Evaluación | Lo que carga un evaluador sobre una persona (`objetivo = 'persona'`) o sobre un equipo (`objetivo = 'equipo'`). Una fila por evaluador y objetivo. | `evaluaciones` |
| Borrador / enviada | Estado de una evaluación. Se corrige hasta que se publican las devoluciones. | `evaluaciones.estado` |
| Carga directa / diferida | Directa: la carga el evaluador en la app. Diferida: la pasa el organizador desde la rúbrica en papel (plan B). | `evaluaciones.carga`, `cargada_por` |
| Devolución | Lo que ve cada estudiante: sus evaluaciones individuales más las de su equipo. **Preparada**: foto que arma el organizador, el estudiante no la ve. **Publicada**: el estudiante ya la ve. | `devoluciones` (`publicada_en`, `abierta_en`) |
| Encuesta | Preguntas cortas de interés, por ejemplo al abrir la devolución. | `respuestas_encuesta` (`post_devolucion`) |

## Landing
| Término | Qué es | En la base |
|---|---|---|
| Interesado | Persona o empresa que dejó su mail en la landing. | `interesados` (`audiencia`: `estudiante` / `empresa`) |
| Evento de landing | Algo que pasó en la landing: visita, sección vista, clic en CTA, inicio, fin o error del formulario. | `eventos_landing` (`tipo`) |
| Variante | Versión del título del hero, fija por visitante (`a` o `b`). | `variante` en ambas tablas; cookie `tim_var` |
| Visitante | Id aleatorio en cookie. No es una persona. | `visitante_id`; cookie `tim_vid` |
| Origen | De dónde vino: `utm`, QR de la hackatón. | `origen` (jsonb) |

## Actividades (fase B en adelante)
| Término | Qué es | En la base |
|---|---|---|
| Actividad | Un juego virtual: crucigrama, adivinar la palabra, acertijo de Einstein. | `actividades` (todavía no existe) |
| Partida | Una jugada de una actividad, con su proceso: tiempos, intentos, pistas, correcciones, abandono. | `partidas` (todavía no existe) |
| Señal | Lo que se deriva de una partida con una regla escrita (ej. persistencia). Es una hipótesis, **nunca "medición"**. | `senales` (todavía no existe); reglas en `docs/senales.md` |

## Perfil y lado empresa (fases C y D)
| Término | Qué es | En la base |
|---|---|---|
| Perfil TIM | La trazabilidad de habilidades blandas de una persona: eventos + actividades, con evolución. | (fase C) |
| Habilidad blanda | Capacidad observable en cómo se trabaja (las 5 dimensiones). El foco de esta etapa. | dimensiones de la rúbrica |
| Habilidad dura | Conocimiento técnico por niveles (ej. Excel básico / intermedio / avanzado). Fase E. | `habilidades_duras` (futuro) |
| Interés | Una empresa marca "me interesa" sobre un perfil anónimo. | `intereses` (futuro) |
| Contacto | El estudiante acepta que esa empresa vea su nombre y datos. Recién ahí deja de ser anónimo. | `contactos` (futuro) |
| Credencial verificable | Página pública `/v/[token]` que muestra la evidencia y se puede revocar. | `credenciales` (futuro) |

## Arquetipo
De dónde aparece la principal barrera de la persona. Sale del árbol del Anexo 2 del BP. No es una identidad fija: la persona se mueve entre arquetipos. TIM prioriza el 3.

| Valor en `estudiantes.arquetipo` | Arquetipo |
|---|---|
| `no_sabe_que_quiere` | 1. No sabe qué quiere hacer. |
| `no_identifica_fortalezas` | 2. Sabe qué quiere, pero no identifica qué puede ofrecer. |
| `no_sabe_demostrar` | 3. Sabe qué quiere y qué ofrece, pero no cómo demostrarlo. **Prioritario.** |
| `hace_todo_bien` | 4. Hace todo "bien", pero igual no consigue. |
| `reorientacion` | 5. Busca reorientarse profesionalmente (más de 25, cambio de área). |
| `accede` | Ya accede a trabajos: el árbol termina sin arquetipo. |

Las respuestas al árbol se guardan en `estudiantes.arquetipo_respuestas` para poder reclasificar.
