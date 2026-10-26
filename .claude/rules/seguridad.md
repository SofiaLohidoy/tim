# Seguridad

TIM guarda datos de jóvenes: carrera, intereses, CV, cómo trabajaron. La seguridad vive en la base, no en la UI.

## Claves
- `SUPABASE_SECRET_KEY` (la clave secreta, `sb_secret_...`) **saltea la RLS**. Solo se usa en `src/lib/supabase/servicio.ts`, que importa `server-only`. Nunca en un componente cliente, nunca con prefijo `NEXT_PUBLIC_`, nunca en un log.
- Se usa solo cuando no hay sesión y hay validación propia: la medición de la landing (zod + rate limit) y los scripts de datos de prueba. Todo lo demás va con la sesión de la persona (`servidor.ts`) y pasa por la RLS.
- Ningún secreto en el repo. `.env*` está en `.gitignore` salvo `.env.example`, que va sin valores.
- Si un secreto se filtra: rotarlo en el servicio primero, después todo lo demás.

## RLS
- Toda tabla nueva: `ENABLE ROW LEVEL SECURITY` y policies en la misma migración.
- Quién ve qué (resumen; detalle en `docs/modelo-de-datos.md`):
  - El estudiante ve lo suyo y su devolución **solo publicada**.
  - El mentor ve a su equipo. El jurado, a sus equipos asignados. Nadie más.
  - Ningún evaluador ve las evaluaciones de otro.
  - El CV lo ven la persona y el organizador. Mentores y jurados no.
  - La empresa (fase D) nunca lee estudiantes directo: vista anónima + función `security definer` que exige un contacto aceptado.
- Cada cambio de policy lleva su test en `pnpm test:rls`, probando el caso que **no** debe ver.

## Roles
- Nadie se autoasigna un rol de staff. Los roles salen de invitaciones que carga el organizador.
- El chequeo de rol en la UI es comodidad. El que vale es el de la base.

## Entradas
- Todo lo que entra por Server Action o route handler se valida con zod.
- Lo anónimo (landing) lleva rate limit por visitante y por hash de IP. La IP no se guarda.
- Links que carga la gente (entrega): solo `http(s)`, con largo máximo.
- Nada de `dangerouslySetInnerHTML` con contenido de usuarios.

## Datos personales
- Consentimiento explícito en el onboarding (`estudiantes.consentimiento_en` es obligatorio).
- Lo mínimo necesario. No pedir un dato que no se usa.
- Datos de prueba: prefijo `prueba-`, y se borran al terminar. Nunca se mezclan con reales en un reporte.
- Exports CSV: solo el organizador. Para la tesis, preferir agregados o datos sin mail.

## Cron y rutas internas
- `/api/cron/*` exige `Authorization: Bearer $CRON_SECRET`. Sin header, 401.
