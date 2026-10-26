-- 006 — Lo que necesita el panel del organizador.
--
-- Por que asi:
-- - Un jurado evalua varios equipos (4 jurados, 8 equipos). La invitacion unica por
--   (mail, rol, evento) no dejaba pre-asignar a alguien que todavia no se registro a mas de un
--   equipo. Ahora la invitacion es unica por equipo.
-- - El resumen de la landing se calcula en la base y lo devuelve una funcion que exige
--   organizador. Una vista comun correria como su dueño y saltearia la RLS; una funcion
--   SECURITY DEFINER con el chequeo adentro deja el permiso explicito.

BEGIN;

ALTER TABLE public.invitaciones DROP CONSTRAINT invitaciones_email_rol_evento_id_key;
ALTER TABLE public.invitaciones
  ADD CONSTRAINT invitaciones_unica UNIQUE NULLS NOT DISTINCT (email, rol, evento_id, equipo_id);

CREATE OR REPLACE FUNCTION public.resumen_landing(p_desde timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  resultado jsonb;
BEGIN
  IF NOT public.es_organizador() THEN
    RAISE EXCEPTION 'solo_organizador';
  END IF;

  WITH ev AS (
    SELECT * FROM public.eventos_landing WHERE p_desde IS NULL OR creado_en >= p_desde
  ),
  inte AS (
    SELECT * FROM public.interesados WHERE p_desde IS NULL OR creado_en >= p_desde
  ),
  visitas AS (
    SELECT coalesce(variante, 'sin_variante') AS variante, count(DISTINCT visitante_id) AS visitantes
    FROM ev WHERE tipo = 'visita' GROUP BY 1
  ),
  conversiones AS (
    SELECT coalesce(variante, 'sin_variante') AS variante, audiencia, count(*) AS registros
    FROM inte GROUP BY 1, 2
  ),
  origenes AS (
    SELECT coalesce(nullif(origen ->> 'origen', ''), nullif(origen ->> 'utm_source', ''), nullif(origen ->> 'referrer', ''), 'directo') AS origen,
           count(DISTINCT visitante_id) AS visitantes
    FROM ev WHERE tipo = 'visita' GROUP BY 1
  ),
  origenes_reg AS (
    SELECT coalesce(nullif(origen ->> 'origen', ''), nullif(origen ->> 'utm_source', ''), nullif(origen ->> 'referrer', ''), 'directo') AS origen,
           audiencia, count(*) AS registros
    FROM inte GROUP BY 1, 2
  ),
  secciones AS (
    SELECT detalle AS seccion, count(DISTINCT visitante_id) AS visitantes
    FROM ev WHERE tipo = 'seccion' GROUP BY 1
  ),
  ctas AS (
    SELECT detalle AS cta, coalesce(variante, 'sin_variante') AS variante, count(*) AS clics
    FROM ev WHERE tipo = 'clic_cta' GROUP BY 1, 2
  ),
  formularios AS (
    SELECT detalle AS audiencia,
           count(DISTINCT visitante_id) FILTER (WHERE tipo = 'form_inicio') AS iniciaron,
           count(DISTINCT visitante_id) FILTER (WHERE tipo = 'form_fin') AS terminaron,
           count(*) FILTER (WHERE tipo = 'form_error') AS errores
    FROM ev WHERE tipo IN ('form_inicio', 'form_fin', 'form_error') GROUP BY 1
  )
  SELECT jsonb_build_object(
    'visitas', coalesce((SELECT jsonb_agg(v) FROM visitas v), '[]'::jsonb),
    'conversiones', coalesce((SELECT jsonb_agg(c) FROM conversiones c), '[]'::jsonb),
    'origenes', coalesce((SELECT jsonb_agg(o ORDER BY o.visitantes DESC) FROM origenes o), '[]'::jsonb),
    'origenes_registros', coalesce((SELECT jsonb_agg(o) FROM origenes_reg o), '[]'::jsonb),
    'secciones', coalesce((SELECT jsonb_agg(s ORDER BY s.visitantes DESC) FROM secciones s), '[]'::jsonb),
    'ctas', coalesce((SELECT jsonb_agg(c ORDER BY c.clics DESC) FROM ctas c), '[]'::jsonb),
    'formularios', coalesce((SELECT jsonb_agg(f) FROM formularios f), '[]'::jsonb),
    'total_interesados', (SELECT count(*) FROM inte)
  ) INTO resultado;

  RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.resumen_landing(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resumen_landing(timestamptz) TO authenticated;

COMMIT;
