-- 001 — Personas, roles e invitaciones. La base de toda la RLS.
--
-- Por que asi:
-- - `perfiles` es 1:1 con auth.users y lo crea un trigger: la app nunca tiene que acordarse de
--   insertarlo, y un perfil huerfano no puede existir.
-- - Una persona puede tener varios roles (Sofia es organizadora y puede ser jurado). Por eso los
--   roles son filas, no una columna. El rol de staff es por evento; el de organizador es global
--   (evento_id null).
-- - Nadie se autoasigna un rol de staff. El organizador carga una invitacion por mail y el rol
--   aparece solo cuando esa persona se registra (o al instante, si ya tenia cuenta). Asi un
--   mentor entra con Google el sabado y ya ve a su equipo, sin que nadie toque nada.

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.poner_actualizado_en() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END $$;

CREATE TABLE public.perfiles (
  id             uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email          extensions.citext NOT NULL UNIQUE,
  nombre         text,
  apellido       text,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER perfiles_actualizado BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.poner_actualizado_en();

CREATE TABLE public.roles_usuario (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  rol        text NOT NULL CHECK (rol IN ('estudiante', 'mentor', 'jurado', 'organizador', 'empresa')),
  evento_id  uuid,  -- FK en 003, cuando existe la tabla eventos
  creado_en  timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (usuario_id, rol, evento_id)
);
CREATE INDEX roles_usuario_usuario ON public.roles_usuario (usuario_id);

-- Invitaciones de staff (mentor, jurado, organizador) y pre-asignacion de estudiantes a un
-- equipo. `equipo_id` se agrega en 003.
CREATE TABLE public.invitaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       extensions.citext NOT NULL,
  rol         text NOT NULL CHECK (rol IN ('estudiante', 'mentor', 'jurado', 'organizador')),
  evento_id   uuid,
  nombre      text,
  creada_por  uuid REFERENCES public.perfiles (id) ON DELETE SET NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  usada_en    timestamptz,
  UNIQUE NULLS NOT DISTINCT (email, rol, evento_id)
);

-- Helpers de RLS. SECURITY DEFINER para que una policy pueda consultar roles_usuario sin
-- recursion; STABLE para que el planner los evalue una vez por query.
CREATE OR REPLACE FUNCTION public.es_organizador() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles_usuario
    WHERE usuario_id = (SELECT auth.uid()) AND rol = 'organizador'
  )
$$;

CREATE OR REPLACE FUNCTION public.tiene_rol(p_rol text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles_usuario
    WHERE usuario_id = (SELECT auth.uid()) AND rol = p_rol
  )
$$;

-- Convierte las invitaciones pendientes de un mail en roles. La llaman los dos triggers de
-- abajo: el del alta de usuario y el del alta de invitacion.
CREATE OR REPLACE FUNCTION public.aplicar_invitaciones(p_usuario uuid, p_email extensions.citext)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.roles_usuario (usuario_id, rol, evento_id)
  SELECT p_usuario, i.rol, i.evento_id
  FROM public.invitaciones i
  WHERE i.email = p_email AND i.rol <> 'estudiante'
  ON CONFLICT DO NOTHING;

  UPDATE public.invitaciones SET usada_en = now()
  WHERE email = p_email AND usada_en IS NULL AND rol <> 'estudiante';
END $$;

CREATE OR REPLACE FUNCTION public.al_crear_usuario() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  nombre_completo text := coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name');
BEGIN
  INSERT INTO public.perfiles (id, email, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'given_name', split_part(nombre_completo, ' ', 1)),
    coalesce(NEW.raw_user_meta_data ->> 'family_name', nullif(substr(nombre_completo, length(split_part(nombre_completo, ' ', 1)) + 2), ''))
  );
  PERFORM public.aplicar_invitaciones(NEW.id, NEW.email::extensions.citext);
  RETURN NEW;
END $$;

CREATE TRIGGER al_crear_usuario AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.al_crear_usuario();

CREATE OR REPLACE FUNCTION public.al_crear_invitacion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  existente uuid;
BEGIN
  SELECT id INTO existente FROM public.perfiles WHERE email = NEW.email;
  IF existente IS NOT NULL THEN
    PERFORM public.aplicar_invitaciones(existente, NEW.email);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER al_crear_invitacion AFTER INSERT ON public.invitaciones
  FOR EACH ROW EXECUTE FUNCTION public.al_crear_invitacion();

-- Las funciones de trigger no las llama nadie desde afuera. Supabase da EXECUTE a anon y
-- authenticated por nombre (ALTER DEFAULT PRIVILEGES), asi que hay que revocar por nombre.
REVOKE ALL ON FUNCTION public.aplicar_invitaciones(uuid, extensions.citext) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.al_crear_usuario() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.al_crear_invitacion() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

-- perfiles: cada uno el suyo; el organizador todos. Mentor y jurado ven a los integrantes de
-- sus equipos: esa policy va en 003, cuando existen equipos y asignaciones.
CREATE POLICY perfiles_propio_leer ON public.perfiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY perfiles_propio_editar ON public.perfiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY perfiles_organizador_editar ON public.perfiles FOR UPDATE TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

-- El mail de un perfil no se cambia desde la app: lo maneja Auth. Un REVOKE por columna no
-- alcanza si queda el GRANT de tabla, por eso se revoca todo y se concede columna por columna.
REVOKE UPDATE ON public.perfiles FROM authenticated;
GRANT UPDATE (nombre, apellido) ON public.perfiles TO authenticated;

CREATE POLICY roles_leer ON public.roles_usuario FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY roles_organizador ON public.roles_usuario FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY invitaciones_organizador ON public.invitaciones FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

COMMIT;
