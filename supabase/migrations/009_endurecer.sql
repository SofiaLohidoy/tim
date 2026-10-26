-- 009 — Ajustes de la revision de codigo antes de la hackaton.
--
-- Por que:
-- - Toma de rol por Google: sin confirmacion de mail, alguien podia crear una cuenta con
--   contraseña usando el mail de un mentor. Si despues el mentor entraba con Google, GoTrue
--   enlazaba la identidad a esa cuenta y el rol se aplicaba. Ahora el mail cuenta como verificado
--   solo si la cuenta NO tiene identidad de mail y contraseña (se creo con Google).
-- - Una evaluacion tiene que ser del mismo evento que su equipo. Sin este chequeo, un pedido
--   armado a mano podia usar el evento_id de otro evento sin publicar y esquivar el cierre.
-- - `preparada_en` en devoluciones: publicar exige que no haya evaluaciones cambiadas despues de
--   la ultima preparacion. Asi no se publica una foto vieja.

BEGIN;

CREATE OR REPLACE FUNCTION public.mail_verificado(p_usuario uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = p_usuario AND provider = 'google')
     AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = p_usuario AND provider = 'email')
$$;

CREATE OR REPLACE FUNCTION public.evaluacion_permitida(
  p_evaluador uuid, p_equipo uuid, p_rol text, p_estudiante uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE equipo_id = p_equipo AND evaluador_id = p_evaluador AND rol = p_rol
  ) AND (
    p_estudiante IS NULL OR EXISTS (
      SELECT 1 FROM public.miembros_equipo WHERE equipo_id = p_equipo AND usuario_id = p_estudiante
    )
  )
$$;

ALTER TABLE public.evaluaciones
  ADD CONSTRAINT evaluaciones_evento_del_equipo FOREIGN KEY (equipo_id, evento_id)
  REFERENCES public.equipos (id, evento_id) ON DELETE CASCADE;

ALTER TABLE public.devoluciones ADD COLUMN preparada_en timestamptz NOT NULL DEFAULT now();

COMMIT;
