# 002 — Login con mail y contraseña sin confirmación, más Google

Fecha: 25/10/2026 · Estado: aceptada (revisar en fase F)

## Contexto
En la hackatón, 40 personas se registran desde el celular en un minuto, con un QR en la puerta. Sin dominio propio ni SMTP, Supabase Free manda 2 mails por hora y solo a miembros del equipo.

## Decisión
- Mail + contraseña, con **confirmación de mail apagada**.
- "Entrar con Google" como alternativa (`NEXT_PUBLIC_GOOGLE_HABILITADO=1` cuando está configurado).
- Las invitaciones de staff se reclaman con un **link personal** (`/invitacion/<token>`) que el organizador copia desde Personas y manda por WhatsApp. Con Google (mail verificado) el rol se aplica solo al entrar con ese mail.

## Alternativas descartadas
- **Magic link**: depende de mandar mails. Con el límite de 2 por hora no entra nadie.
- **Confirmación de mail**: mismo problema.
- **SMTP propio con Resend ahora**: exige dominio verificado, que todavía no hay.

## Consecuencias
- Sin confirmación, nadie prueba que el mail es suyo. Por eso (migración 007) con mail y contraseña el rol de staff **no** se aplica por coincidencia de mail: hace falta abrir el link personal estando logueado con ese mail. Así, quien se registre con el mail de un mentor no obtiene el rol. Lo cubre un test de RLS.
- La pre-asignación de estudiantes a un equipo sí se aplica por mail: no da acceso a datos que la persona no vería igual.
- En fase F, con dominio + Resend: se suma magic link y se prende la confirmación.
