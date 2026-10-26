-- 007 — Las invitaciones de staff se reclaman con un link personal.
--
-- Por que asi: sin confirmacion de mail (decision de la hackaton, ADR 002), cualquiera puede
-- crear una cuenta con contraseña usando el mail de un mentor invitado. Si el rol se aplicara
-- solo por coincidencia de mail, esa persona se quedaria con el rol y veria a un equipo.
-- Ahora:
-- - Con Google (el mail esta verificado por Google), la invitacion se aplica sola, como antes.
-- - Con mail y contraseña, el rol de staff se aplica solo al abrir el link de la invitacion
--   (/invitacion/<token>) estando logueado con ESE mail. El link lo manda el organizador.
-- - La pre-asignacion de estudiantes a un equipo sigue aplicandose por mail: no da acceso a
--   datos de nadie que el estudiante no veria igual al entrar a su equipo.

BEGIN;

ALTER TABLE public.invitaciones ADD COLUMN token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE;

CREATE OR REPLACE FUNCTION public.mail_verificado(p_usuario uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = p_usuario AND provider = 'google'
  )
$$;
REVOKE ALL ON FUNCTION public.mail_verificado(uuid) FROM PUBLIC, anon, authenticated;

-- p_token NULL = aplicar por mail (solo lo seguro). p_token = aplicar esa invitacion puntual.
CREATE OR REPLACE FUNCTION public.aplicar_invitaciones(p_usuario uuid, p_email extensions.citext, p_token uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  verificado boolean := public.mail_verificado(p_usuario);
  i record;
BEGIN
  FOR i IN
    SELECT inv.id, inv.rol, inv.evento_id, inv.equipo_id, eq.evento_id AS evento_equipo
    FROM public.invitaciones inv
    LEFT JOIN public.equipos eq ON eq.id = inv.equipo_id
    WHERE inv.email = p_email
      AND (
        (p_token IS NOT NULL AND inv.token = p_token)
        OR (p_token IS NULL AND (inv.rol = 'estudiante' OR verificado))
      )
  LOOP
    IF i.rol <> 'estudiante' THEN
      INSERT INTO public.roles_usuario (usuario_id, rol, evento_id)
      VALUES (p_usuario, i.rol, i.evento_id) ON CONFLICT DO NOTHING;
    END IF;
    IF i.equipo_id IS NOT NULL AND i.rol IN ('mentor', 'jurado') THEN
      INSERT INTO public.asignaciones (evento_id, equipo_id, evaluador_id, rol)
      VALUES (i.evento_equipo, i.equipo_id, p_usuario, i.rol) ON CONFLICT DO NOTHING;
    END IF;
    IF i.equipo_id IS NOT NULL AND i.rol = 'estudiante' THEN
      INSERT INTO public.miembros_equipo (equipo_id, evento_id, usuario_id)
      VALUES (i.equipo_id, i.evento_equipo, p_usuario) ON CONFLICT DO NOTHING;
    END IF;
    UPDATE public.invitaciones SET usada_en = now() WHERE id = i.id AND usada_en IS NULL;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.aplicar_invitaciones(uuid, extensions.citext, uuid) FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.aplicar_invitaciones(uuid, extensions.citext);

-- El trigger de alta de usuario corre antes de que exista la identidad de Google en algunos
-- flujos; por eso tambien se aplica al crear la identidad.
CREATE OR REPLACE FUNCTION public.al_crear_identidad() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_email extensions.citext;
BEGIN
  SELECT email INTO v_email FROM public.perfiles WHERE id = NEW.user_id;
  IF v_email IS NOT NULL THEN
    PERFORM public.aplicar_invitaciones(NEW.user_id, v_email);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.al_crear_identidad() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER al_crear_identidad AFTER INSERT ON auth.identities
  FOR EACH ROW EXECUTE FUNCTION public.al_crear_identidad();

CREATE OR REPLACE FUNCTION public.reclamar_invitacion(p_token uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_email extensions.citext;
  v_inv public.invitaciones%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'sin_sesion';
  END IF;
  SELECT * INTO v_inv FROM public.invitaciones WHERE token = p_token;
  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'invitacion_inexistente';
  END IF;
  SELECT email INTO v_email FROM public.perfiles WHERE id = (SELECT auth.uid());
  IF v_email IS DISTINCT FROM v_inv.email THEN
    RAISE EXCEPTION 'otro_mail';
  END IF;
  PERFORM public.aplicar_invitaciones((SELECT auth.uid()), v_email, p_token);
  RETURN v_inv.rol;
END $$;
REVOKE ALL ON FUNCTION public.reclamar_invitacion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamar_invitacion(uuid) TO authenticated;

-- Para mostrar a quien abre el link a que mail corresponde, sin exponer la tabla.
CREATE OR REPLACE FUNCTION public.mail_de_invitacion(p_token uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT email::text FROM public.invitaciones WHERE token = p_token
$$;
REVOKE ALL ON FUNCTION public.mail_de_invitacion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mail_de_invitacion(uuid) TO anon, authenticated;

COMMIT;
