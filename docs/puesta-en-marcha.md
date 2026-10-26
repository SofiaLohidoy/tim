# Puesta en marcha

Cómo se crean los entornos remotos de TIM desde cero. Lo hace Claude con el CLI y el navegador del panel. La única parte humana es la de las cuentas: Sofía crea su cuenta de Supabase e invita a joaquinberardi@programon.co como owner.

Hay dos entornos remotos:
- **`tim-dev`**: para probar migraciones y flujos antes de prod. Playwright corre contra este.
- **`tim-prod`**: el que usa la gente. La hackatón corre acá.

Los dos viven en la cuenta de Supabase de Sofía (plan Free: 2 proyectos activos por owner, justo los dos). Ver `docs/infraestructura.md`.

## Camino corto: `scripts/conectar-prod.mjs`
Hace los pasos 2, 3, 5 y 7 de una vez, y se puede volver a correr sin romper nada:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_DB_PASSWORD=... node scripts/conectar-prod.mjs <project-ref> --organizadores mail@de.sofia
```

- Aplica las migraciones, apaga la confirmación de mail, pone las URLs del sitio y **sube los límites de tasa de Auth**. Ese último punto no es opcional: el registro corre en el servidor (todas las personas comparten la IP de Vercel) y en la hackatón todos salen por el mismo wifi. Con los 30 registros cada 5 minutos que trae Supabase de fábrica, 40 personas se traban en la puerta.
- Carga las claves en Vercel, redeploya y espera `READY`.
- Imprime el link de invitación de cada organizadora.
- Después, probar la carga en prod: `ENV_ARCHIVO=.env.prod node scripts/carga-registro.mjs 45` (45 altas e ingresos simultáneos) y borrar con `ENV_ARCHIVO=.env.prod pnpm datos:limpiar`.

Los pasos de abajo explican lo mismo a mano.

## 1. Crear los proyectos en Supabase
1. En el dashboard de Supabase de Sofía, crear `tim-dev` y `tim-prod`. Región: São Paulo (`sa-east-1`), la más cercana.
2. Guardar la contraseña de la base de cada uno en el gestor de contraseñas del equipo. No va al repo.
3. Anotar el `project ref` de cada uno (está en la URL del dashboard).

## 2. Aplicar el esquema
Desde la raíz del repo:

```bash
supabase login
supabase link --project-ref <ref de tim-dev>
supabase db push            # aplica supabase/migrations/*.sql en orden
supabase link --project-ref <ref de tim-prod>
supabase db push
```

`db push` solo aplica las migraciones que faltan. Si una ya está aplicada en prod, no se edita: se hace una nueva (skill `migracion`).

Después de cada push, regenerar los tipos si cambió el esquema:

```bash
supabase gen types typescript --linked > src/lib/supabase/tipos.ts
```

## 3. Configurar Auth (en cada proyecto)
En **Authentication → Sign In / Providers**:
- **Email**: habilitado. **Confirm email: APAGADO.** Sin SMTP propio, Supabase manda 2 mails por hora y solo a miembros del equipo. 40 personas se registran en un minuto en la hackatón; con confirmación no entra nadie. Ver `docs/decisiones/002-login.md`.
- **Google**: habilitado, con el Client ID y el Client Secret de Google Cloud (paso 4).

En **Authentication → URL Configuration**:
- **Site URL**: la URL de prod (hoy la de Vercel; cuando haya dominio, el dominio).
- **Redirect URLs**: `https://<url de prod>/auth/callback`. En `tim-dev`, también `http://localhost:3001/auth/callback`.

## 4. Google OAuth
En Google Cloud Console, con la cuenta del equipo:
1. Crear un proyecto `tim`.
2. **Pantalla de consentimiento OAuth**: tipo externo, nombre "TIM", mail de soporte del equipo. Publicarla (si queda en "Testing", solo entran los usuarios de prueba cargados).
3. **Credenciales → Crear ID de cliente OAuth → Aplicación web.**
   - Orígenes autorizados: la URL de prod.
   - URI de redirección: `https://<ref>.supabase.co/auth/v1/callback` (una por proyecto de Supabase).
4. Copiar Client ID y Client Secret en Supabase (paso 3).
5. Poner `NEXT_PUBLIC_GOOGLE_HABILITADO=1` en Vercel. Con `0`, la app esconde el botón de Google.

## 5. Vercel
Proyecto `tim` en el team de Programon, conectado al repo `programon-arg/tim`, rama de producción `main`.

**Variables de entorno = las de `.env.example`**, con estos valores:

| Variable | Valor en prod |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref de tim-prod>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API Keys → Publishable key de `tim-prod` |
| `SUPABASE_SECRET_KEY` | Settings → API Keys → Secret key (`sb_secret_...`). **Solo servidor. Saltea la RLS.** |
| `NEXT_PUBLIC_SITIO_URL` | URL de prod, sin barra final |
| `NEXT_PUBLIC_GOOGLE_HABILITADO` | `1` cuando Google está configurado |
| `LANDING_SAL` | String largo al azar (`openssl rand -hex 32`) |
| `CRON_SECRET` | String largo al azar (`openssl rand -hex 32`) |

Los entornos Preview de Vercel apuntan a `tim-dev`, nunca a `tim-prod`.

## 6. Cron de salud
`/api/cron/salud` hace un `select` real contra la base una vez por día. Evita que Supabase Free pause el proyecto tras 7 días sin actividad. Se declara en `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/salud", "schedule": "0 12 * * *" }] }
```

Vercel manda `Authorization: Bearer <CRON_SECRET>`. Sin ese header, la ruta devuelve 401. Hobby permite un cron por día como máximo.

## 7. Primer organizador
Nadie se autoasigna roles. El primer organizador se carga a mano, una sola vez, por SQL (Studio de Supabase → SQL editor):

```sql
insert into public.invitaciones (email, rol) values ('mail@de.sofia', 'organizador') returning token;
```

Con el `token` que devuelve, el link es `https://<sitio>/invitacion/<token>`. La persona lo abre, entra o crea su cuenta con ese mail, y queda como organizadora. (Si entra con Google, alcanza con entrar.) Desde ahí, el resto del staff se invita desde `/organizador/personas`, que muestra el link de cada invitación para copiar.

## 8. Verificar
Skill `deploy`: push a `main`, `vercel inspect` hasta `READY`, y recorrer en la URL live el registro, `/bienvenida` y `/organizador`. Lo de prueba, con prefijo `prueba-` y borrado después.
