# Infraestructura

Todo corre en planes gratis. Límites verificados el 25/10/2026; si pasaron meses, volvé a mirarlos en la página de precios de cada servicio antes de decidir algo.

## Cuentas
| Servicio | De quién | Para qué |
|---|---|---|
| Supabase | Sofía (Joaquín invitado como owner) | Base, Auth, Storage (CV) |
| Vercel | Programon durante el desarrollo; Hobby de Sofía después de la transferencia | Hosting y cron |
| GitHub | `programon-arg/tim` (privado) hasta la transferencia | Código |
| Google Cloud | Equipo TIM | OAuth de "Entrar con Google" |
| Resend | Todavía no (fase F, con dominio propio) | Mails |

## Límites que importan
| Servicio | Plan | Límite |
|---|---|---|
| Supabase | Free | 2 proyectos activos por owner (`tim-dev` y `tim-prod`, justo). 500 MB de base. 1 GB de storage. 50.000 usuarios activos por mes. **Pausa el proyecto tras 7 días sin actividad.** Mail por defecto: solo a miembros del equipo y 2 por hora. |
| Vercel | Hobby | Uso no comercial. Cron como máximo 1 vez por día. En repos privados bloquea deploys de commits de terceros: al transferir, el repo pasa a público. |
| Resend | Free | 3.000 mails por mes, 100 por día. Exige dominio propio verificado. |

Cuentas para la escala de la tesis: 40 personas en la hackatón, cientos de interesados en la landing. Muy lejos de los topes de base y usuarios.

## Qué pasa si...

### Supabase pausa la base
Pasa si no hay actividad en 7 días. La app deja de andar: login y pantallas fallan.
- **Prevención**: el cron diario `/api/cron/salud` hace un `select` real. Mientras corra, no se pausa.
- **Si igual se pausó**: se reactiva desde el dashboard de Supabase (Restore project). Tarda unos minutos y no pierde datos. Después, revisar en Vercel por qué no corrió el cron (`CRON_SECRET` mal cargado, `vercel.json` sin el cron, deploy roto).

### Se llena el storage (1 GB)
Solo hay CV en PDF, con tope de 5 MB cada uno (bucket `cvs`). Hacen falta más de 200 CV al tope para llenarlo.
- **Síntoma**: falla la subida del CV en `/bienvenida`. El resto anda.
- **Qué hacer**: mirar el uso en Supabase → Storage. Si se llena de verdad, bajar el tope por archivo o pasar a Pro. No borrar CV de nadie sin consentimiento.

### Se llena la base (500 MB)
Lo que más crece es `eventos_landing` (una fila por visita y por sección vista). Para llegar a 500 MB harían falta millones de filas.
- **Qué hacer**: exportar `eventos_landing` viejos a CSV (skill `reporte-tesis`) y recién ahí borrarlos, con backup.

### Supabase no manda mails
Esperado: sin SMTP propio, Supabase Free manda 2 por hora y solo a miembros del equipo. Por eso el login es mail + contraseña sin confirmación, más Google (ver `docs/decisiones/002-login.md`). Las invitaciones de staff no dependen del mail: el rol aparece solo cuando la persona entra con ese mail.

### Se cae Vercel o el wifi del lugar en la hackatón
Plan B en papel: la rúbrica impresa, y el organizador carga después como **carga diferida**. Skill `preparar-evento`.

### Hace falta un tercer proyecto en Supabase
El Free permite 2 activos por owner. Los pausados no cuentan. Antes de pausar uno, preguntarle a Sofía.
