-- 019 — Preparar otra versión sin tocar las devoluciones visibles.
-- Borradores solo para organización; publicación atómica. La revisión del evento cambia
-- con cada evaluación: una preparación vieja no se puede publicar por accidente.
BEGIN;
ALTER TABLE public.eventos ADD COLUMN revision_evaluaciones bigint NOT NULL DEFAULT 0;
CREATE TABLE public.devoluciones_borrador (
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  estudiante_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  contenido jsonb NOT NULL,
  revision_evaluaciones bigint NOT NULL,
  preparada_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(evento_id,estudiante_id)
);
ALTER TABLE public.devoluciones_borrador ENABLE ROW LEVEL SECURITY;
CREATE POLICY borradores_devolucion_leer ON public.devoluciones_borrador FOR SELECT TO authenticated USING(public.es_organizador());
REVOKE ALL ON public.devoluciones_borrador FROM anon,authenticated;
GRANT SELECT ON public.devoluciones_borrador TO authenticated;

CREATE FUNCTION public.revisar_evaluaciones_evento() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  UPDATE public.eventos SET revision_evaluaciones=revision_evaluaciones+1 WHERE id=coalesce(NEW.evento_id,OLD.evento_id);
  RETURN coalesce(NEW,OLD);
END $$;
REVOKE ALL ON FUNCTION public.revisar_evaluaciones_evento() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER evaluaciones_revision AFTER INSERT OR UPDATE OR DELETE ON public.evaluaciones
FOR EACH ROW EXECUTE FUNCTION public.revisar_evaluaciones_evento();

CREATE FUNCTION public.evaluaciones_abiertas(p_evento uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.eventos WHERE id=p_evento AND estado<>'cerrado')
$$;
REVOKE ALL ON FUNCTION public.evaluaciones_abiertas(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.evaluaciones_abiertas(uuid) TO authenticated;
ALTER POLICY evaluaciones_crear ON public.evaluaciones WITH CHECK (
  evaluador_id=(SELECT auth.uid()) AND carga='directa'
  AND public.evaluacion_permitida(evaluador_id,equipo_id,rol_evaluador,estudiante_id)
  AND public.evaluaciones_abiertas(evento_id)
);
ALTER POLICY evaluaciones_editar ON public.evaluaciones
USING(evaluador_id=(SELECT auth.uid()) AND public.evaluaciones_abiertas(evento_id))
WITH CHECK(evaluador_id=(SELECT auth.uid()) AND public.evaluacion_permitida(evaluador_id,equipo_id,rol_evaluador,estudiante_id) AND public.evaluaciones_abiertas(evento_id));

CREATE FUNCTION public.guardar_preparacion_devoluciones(p_evento uuid,p_revision bigint,p_filas jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE revision bigint; cantidad integer;
BEGIN
  IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
  SELECT revision_evaluaciones INTO revision FROM public.eventos WHERE id=p_evento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'evento_inexistente'; END IF;
  IF p_revision IS DISTINCT FROM revision THEN RAISE EXCEPTION 'evaluaciones_cambiadas'; END IF;
  IF p_filas IS NULL OR jsonb_typeof(p_filas)<>'array' THEN RAISE EXCEPTION 'preparacion_invalida'; END IF;
  IF jsonb_array_length(p_filas)=0 OR jsonb_array_length(p_filas)>5000 THEN RAISE EXCEPTION 'preparacion_invalida'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_filas) AS f(estudiante_id uuid,contenido jsonb)
    WHERE f.contenido IS NULL OR jsonb_typeof(f.contenido)<>'object' OR NOT EXISTS(
      SELECT 1 FROM public.miembros_equipo m WHERE m.evento_id=p_evento AND m.usuario_id=f.estudiante_id
    )) THEN RAISE EXCEPTION 'preparacion_invalida'; END IF;
  DELETE FROM public.devoluciones_borrador WHERE evento_id=p_evento;
  INSERT INTO public.devoluciones_borrador(evento_id,estudiante_id,contenido,revision_evaluaciones)
    SELECT p_evento,f.estudiante_id,f.contenido,revision FROM jsonb_to_recordset(p_filas) AS f(estudiante_id uuid,contenido jsonb);
  GET DIAGNOSTICS cantidad=ROW_COUNT;
  RETURN cantidad;
END $$;
REVOKE ALL ON FUNCTION public.guardar_preparacion_devoluciones(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_preparacion_devoluciones(uuid,bigint,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.devoluciones_desactualizadas(p_evento uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT public.es_organizador() AND EXISTS(
    SELECT 1 FROM public.devoluciones_borrador b JOIN public.eventos e ON e.id=b.evento_id
    WHERE b.evento_id=p_evento AND b.revision_evaluaciones<>e.revision_evaluaciones
  )
$$;
REVOKE ALL ON FUNCTION public.devoluciones_desactualizadas(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.devoluciones_desactualizadas(uuid) TO authenticated;

CREATE FUNCTION public.publicar_preparacion_devoluciones(p_evento uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE revision bigint; cantidad integer; momento timestamptz=clock_timestamp();
BEGIN
  IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
  SELECT revision_evaluaciones INTO revision FROM public.eventos WHERE id=p_evento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'evento_inexistente'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.devoluciones_borrador WHERE evento_id=p_evento) THEN RAISE EXCEPTION 'sin_preparacion'; END IF;
  IF EXISTS(SELECT 1 FROM public.devoluciones_borrador WHERE evento_id=p_evento AND revision_evaluaciones<>revision) THEN RAISE EXCEPTION 'evaluaciones_cambiadas'; END IF;
  INSERT INTO public.devoluciones(evento_id,estudiante_id,contenido,publicada_en,preparada_en)
    SELECT evento_id,estudiante_id,contenido,momento,preparada_en FROM public.devoluciones_borrador WHERE evento_id=p_evento
    ON CONFLICT(evento_id,estudiante_id) DO UPDATE SET contenido=EXCLUDED.contenido,publicada_en=EXCLUDED.publicada_en,preparada_en=EXCLUDED.preparada_en;
  GET DIAGNOSTICS cantidad=ROW_COUNT;
  UPDATE public.eventos SET devoluciones_publicadas_en=momento WHERE id=p_evento;
  DELETE FROM public.devoluciones_borrador WHERE evento_id=p_evento;
  RETURN cantidad;
END $$;
REVOKE ALL ON FUNCTION public.publicar_preparacion_devoluciones(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_preparacion_devoluciones(uuid) TO authenticated;
COMMIT;
