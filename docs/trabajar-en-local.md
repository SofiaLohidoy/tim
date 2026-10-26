# Trabajar en local

> **Camino normal: `pnpm preparar`** (base de práctica `tim-dev` en la nube, sin Docker). Ver `docs/empezar-con-codex.md`. Lo de abajo es la alternativa con Supabase local en Docker, para quien lo prefiera.


**No hace falta acceso a Vercel ni a Supabase de producción para desarrollar.** Es como corresponde: un entorno de desarrollo no tiene por qué tener las claves que leen los datos reales de los estudiantes.

Todo lo que hace falta está en el repo: las migraciones y la configuración que levanta Supabase con el CLI. Necesitás Docker andando.

Esto lo corre el agente, no la persona del equipo.

## Levantar todo

```bash
pnpm install
supabase start          # levanta Postgres, Auth, Storage y el buzón de mails locales
supabase db reset       # aplica TODAS las migraciones desde cero
```

**El `db reset` no es opcional, aunque parezca redundante.** `supabase start` reusa el volumen de Docker que haya quedado de antes. Si alguien lo levantó en otro momento, la base arranca con el esquema viejo y sin las migraciones nuevas. El síntoma es difícil de diagnosticar: la app compila, levanta, y una pantalla tira error por una función o columna que no existe. Pasa cada vez que alguien suma una migración.

Ante cualquier cosa rara en local, el primer reflejo es `supabase db reset`. Borra los datos locales, que son descartables.

## Puertos de este proyecto
Están corridos de los de fábrica para no chocar con otros proyectos de Supabase en la misma máquina (`supabase/config.toml`):

| Servicio | Puerto |
|---|---|
| API (lo que usa la app) | 54421 |
| Base de datos (Postgres) | 54422 |
| Studio (ver tablas) | http://127.0.0.1:54423 |
| Inbucket (buzón de mails locales) | http://127.0.0.1:54424 |
| App (`pnpm dev`) | el de `.claude/launch.json` (hoy 3001) |

Si cambia el puerto de la app, cambialo también en `site_url` y `additional_redirect_urls` de `supabase/config.toml` y volvé a correr `supabase start`. Si no, Supabase ignora el redirect del login.

## `.env.local`
Copiá `.env.example` a `.env.local`. Los valores de Supabase salen de `supabase status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key>
SUPABASE_SECRET_KEY=<Secret key>

# Inventados, solo valen en local. Cualquier string sirve.
NEXT_PUBLIC_SITIO_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_HABILITADO=0
LANDING_SAL=local-sal
CRON_SECRET=local
```

Y a andar:

```bash
pnpm dev
```

Para verla en el navegador del panel, usá `preview_start` con el nombre `tim` (de `.claude/launch.json`), no `pnpm dev` a mano.

## Entrar en local
En local la confirmación de mail está apagada, igual que en prod: te registrás en `/ingresar` con mail y contraseña y entrás directo. Google no anda en local (`NEXT_PUBLIC_GOOGLE_HABILITADO=0`).

Si algún flujo manda mail, no sale a internet: queda en Inbucket (http://127.0.0.1:54424).

**Para ser organizador en local**, lo más rápido es `pnpm datos:prueba` y entrar como `prueba-organizador@tim.test` (clave: `PRUEBA_CLAVE` de `.env.local`). Para usar tu propio mail, creá la invitación y abrí su link:

```bash
docker exec -i supabase_db_tim psql -U postgres -d postgres -tA -c \
  "insert into public.invitaciones (email, rol) values ('vos@programon.co', 'organizador') on conflict do nothing returning token"
# → abrí http://localhost:3001/invitacion/<token> y entrá con ese mail
```

## Datos de prueba
- `pnpm datos:prueba` crea cuentas `prueba-` (estudiantes, mentor, jurado, equipos) para recorrer los flujos.
- `pnpm datos:limpiar` borra todo lo `prueba-`.

En local da igual, porque `db reset` borra todo. En `tim-dev` y `tim-prod`, **siempre** se limpia al terminar.

## Tests
- `pnpm verificar`: tipos + lint + Vitest + build. **Con el dev server parado**: el build pisa `.next` y rompe el server levantado.
- `pnpm test`: solo Vitest.
- `pnpm test:rls`: tests de las policies por rol, contra la base local.
- `pnpm e2e`: Playwright sobre los flujos.

Detalle en la skill `verificar`.

## Crons en local
Vercel no los dispara en local. Se llaman a mano con el secreto del `.env.local`:

```bash
curl -H "Authorization: Bearer local" http://localhost:3001/api/cron/salud
```

Sin el header tiene que devolver 401. Es lo primero a chequear si se toca el guard.

## Deployar
**No se deploya a mano.** Cada push a `main` publica solo, por la integración de Vercel con GitHub. Skill `deploy`.

## Por qué no `vercel env pull`
Porque bajaría los secretos de producción a una máquina de desarrollo, y no hacen falta. La `SUPABASE_SECRET_KEY` de prod saltea la RLS y lee datos de estudiantes reales. Cuantas menos copias existan, mejor. Si hace falta tocar una variable de prod, se toca en Vercel, no se baja a una laptop.
