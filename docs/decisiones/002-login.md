# 002 — Login con mail y contraseña sin confirmación, más Google

Fecha: 25/10/2026 · Estado: aceptada (revisar en fase F)

## Contexto
En la hackatón, 40 personas se registran desde el celular en un minuto, con un QR en la puerta. Sin dominio propio ni SMTP, Supabase Free manda 2 mails por hora y solo a miembros del equipo.

## Decisión
- Mail + contraseña, con **confirmación de mail apagada**.
- "Entrar con Google" como alternativa (`NEXT_PUBLIC_GOOGLE_HABILITADO=1` cuando está configurado).
- Las invitaciones de staff no dependen del mail: el rol aparece solo cuando la persona entra con ese mail.

## Alternativas descartadas
- **Magic link**: depende de mandar mails. Con el límite de 2 por hora no entra nadie.
- **Confirmación de mail**: mismo problema.
- **SMTP propio con Resend ahora**: exige dominio verificado, que todavía no hay.

## Consecuencias
- Sin confirmación, nadie prueba que el mail es suyo. Riesgo concreto: si alguien se registra con mail y contraseña usando el mail de un mentor o jurado invitado antes que esa persona, el trigger le da el rol. Mitigaciones: el staff entra con Google (Google sí verifica el mail); el organizador carga el staff y les pide entrar antes del evento; si un mail aparece tomado, se revisa en `/organizador`.
- En fase F, con dominio + Resend: se suma magic link y se prende la confirmación.
