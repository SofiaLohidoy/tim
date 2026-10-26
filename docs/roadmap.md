# Roadmap

Detalle completo, con DoR y DoD de cada fase: `docs/plan-maestro.md`. Acá va el estado. Actualizalo cuando una fase cambia de estado.

Orden: primero lo que la hackatón necesita, después los juegos, después perfil y outputs, después el lado empresa.

| Fase | Qué | Cuándo | Estado |
|---|---|---|---|
| L | Landing de conversión: registro de interés por audiencia, eventos, dos variantes del título, panel y CSV. | Live jue 29/10 | **Live** (falta que Sofía elija título y confirme textos) |
| A | Hackatón: registro, onboarding, asistencia por QR, evaluación de mentor y jurado, devoluciones, tablero de organizador, encuesta. | Lista jue 29/10, ensayo vie 30/10, evento sáb 31/10 | **En curso** |
| B | Actividades virtuales: crucigrama, adivinar la palabra, acertijo de Einstein, con señales. | Noviembre, semanas 1 y 2 | Hecha en código (26/10): 6 actividades, 3 señales, tests. Catálogo visible con títulos tentativos y Próximamente; juegos deshabilitados. |
| C | Perfil TIM y outputs: perfil con evolución, CV en PDF, QR verificable, credencial, LinkedIn. | Noviembre, semanas 3 y 4 | Hecha en código (26/10): perfil con evidencia y señales en el tiempo, CV en PDF, credencial con QR revocable (`/v/<token>`), app instalable, "Agregar a LinkedIn". |
| D | Lado empresa: perfiles anónimos, interés, contacto aceptado, propuesta de desafío, experimento CV vs. evidencia. | Diciembre | Pendiente |
| E | Habilidades duras por niveles. | Futuro | Pendiente |
| F | Pulido (AA, términos y privacidad, dominio + Resend) y transferencia a Sofía. | Al cerrar la tesis o cuando Sofía lo pida | Pendiente |

## Hecho
- 25/10: cimientos. Next 16.4, Supabase local con esquema y RLS (migraciones 001 a 005), landing con medición propia, harness del repo.
- 25-26/10: fase A completa en código (registro, onboarding, QR, rúbrica sin señal, panel, devoluciones, encuesta, CSV, plan B en papel, cartel). Revisión de código y arreglos (009). Landing live en Vercel.
- 26/10: fase B en código (010). Fase C en código (011, 012).
- 26/10: `tim-prod` conectado en el Supabase de Sofía (ref `xvzkijllizurvmmhmxvl`): 12 migraciones, Auth, límites, claves en Vercel. Verificado live: 11 flujos de Playwright, 45 registros en ~30 s y un registro de la landing; todo lo de prueba borrado. Script para conectar Supabase en la nube en un paso (`scripts/conectar-prod.mjs`).

## Bloqueantes abiertos
- Sofía confirma consigna, equipos, mentores y jurados con sus mails antes del miércoles 28/10.
- Sofía confirma título del hero y promesa a empresas el martes 27/10.
- Sofía confirma los textos de los 4 niveles de la rúbrica (hoy son una propuesta).

### Avance 26/10/2026
Landing principal breve, páginas por público y registro directo implementados para revisión. De fase D se adelanta solo registro, perfil básico y bienvenida de empresa. Catálogo, contactos y propuestas siguen pendientes. Publicado. Migraciones 013–014 aplicadas en producción y perfil de empresa verificado.

Disponibilidad de actividades: todas quedan visibles como propuestas con títulos tentativos y Próximamente, sin descripciones, duraciones, filtros ni acceso al juego. Ninguna admite nuevas partidas. Se conserva el historial y la lógica de prototipos sin presentarlos como actividades disponibles.
