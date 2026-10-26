-- 011 — Credencial verificable (fase C).
--
-- Por que asi:
-- - La persona genera un link publico (/v/<token>) con un QR para mostrar su evidencia a quien
--   quiera. Lo puede revocar cuando quiera; un link revocado deja de mostrar nada.
-- - La pagina publica muestra solo evidencia observada por personas (lo que mentores y jurados
--   registraron en devoluciones publicadas) y cuanto jugo. Las senales de los juegos NO salen:
--   son hipotesis de la tesis y no se presentan como prueba ante terceros (docs/senales.md).
-- - Se lee por una funcion SECURITY DEFINER que arma el resumen: la tabla de devoluciones nunca
--   queda abierta al publico.

BEGIN;

CREATE TABLE public.credenciales (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  token        uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  creado_en    timestamptz NOT NULL DEFAULT now(),
  revocada_en  timestamptz
);
CREATE INDEX credenciales_usuario ON public.credenciales (usuario_id);

ALTER TABLE public.credenciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY credenciales_leer ON public.credenciales FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY credenciales_crear ON public.credenciales FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (SELECT auth.uid()));
CREATE POLICY credenciales_revocar ON public.credenciales FOR UPDATE TO authenticated
  USING (usuario_id = (SELECT auth.uid())) WITH CHECK (usuario_id = (SELECT auth.uid()));
REVOKE UPDATE ON public.credenciales FROM authenticated;
GRANT UPDATE (revocada_en) ON public.credenciales TO authenticated;

CREATE OR REPLACE FUNCTION public.credencial_publica(p_token uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'nombre', trim(coalesce(p.nombre, '') || ' ' || coalesce(p.apellido, '')),
    'universidad', e.universidad,
    'carrera', e.carrera,
    'emitida', c.creado_en,
    'eventos', coalesce((
      SELECT jsonb_agg(jsonb_build_object('evento', ev.nombre, 'fecha', ev.fecha, 'contenido', d.contenido) ORDER BY ev.fecha)
      FROM public.devoluciones d JOIN public.eventos ev ON ev.id = d.evento_id
      WHERE d.estudiante_id = c.usuario_id AND d.publicada_en IS NOT NULL
    ), '[]'::jsonb),
    'asistencias', (SELECT count(*) FROM public.asistencias a WHERE a.usuario_id = c.usuario_id),
    'partidas', (SELECT count(*) FROM public.partidas pa WHERE pa.usuario_id = c.usuario_id AND pa.resultado <> 'en_curso'),
    'resueltas', (SELECT count(*) FROM public.partidas pa WHERE pa.usuario_id = c.usuario_id AND pa.resultado = 'resuelta')
  )
  FROM public.credenciales c
  JOIN public.perfiles p ON p.id = c.usuario_id
  LEFT JOIN public.estudiantes e ON e.usuario_id = c.usuario_id
  WHERE c.token = p_token AND c.revocada_en IS NULL
$$;
REVOKE ALL ON FUNCTION public.credencial_publica(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credencial_publica(uuid) TO anon, authenticated;

COMMIT;
