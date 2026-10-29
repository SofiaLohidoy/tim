-- 018 — Cada entrega usa un espacio de archivos distinto.
-- Impide vincular el mismo objeto a ambos tipos y borrarlo accidentalmente al reemplazar uno.
-- Los documentos anteriores conservan sus rutas y su acceso.
BEGIN;
CREATE OR REPLACE FUNCTION public.guardar_archivo_entrega(p_equipo uuid,p_ruta text,p_nombre text,p_tipo text,p_tamano integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.equipos q JOIN public.eventos ev ON ev.id=q.evento_id WHERE q.id=p_equipo AND ev.estado<>'cerrado')
    THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  IF p_ruta LIKE p_equipo::text || '/presentacion/%' OR p_ruta NOT LIKE p_equipo::text || '/%' OR length(p_nombre) NOT BETWEEN 1 AND 180
    OR p_tamano NOT BETWEEN 1 AND 4194304
    OR p_tipo NOT IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    OR NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id='entregas' AND o.name=p_ruta
      AND (o.metadata->>'size')::integer=p_tamano AND o.metadata->>'mimetype'=p_tipo)
    THEN RAISE EXCEPTION 'archivo_invalido'; END IF;
  INSERT INTO public.entregas_equipo(equipo_id,archivo_path,archivo_nombre,archivo_tipo,archivo_tamano,cargado_por)
    VALUES(p_equipo,p_ruta,p_nombre,p_tipo,p_tamano,(SELECT auth.uid()))
    ON CONFLICT(equipo_id) DO UPDATE SET archivo_path=EXCLUDED.archivo_path,archivo_nombre=EXCLUDED.archivo_nombre,
      archivo_tipo=EXCLUDED.archivo_tipo,archivo_tamano=EXCLUDED.archivo_tamano,cargado_por=EXCLUDED.cargado_por,actualizado_en=now();
END $$;
REVOKE ALL ON FUNCTION public.guardar_archivo_entrega(uuid,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_archivo_entrega(uuid,text,text,text,integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.guardar_presentacion_equipo(p_equipo uuid,p_ruta text,p_nombre text,p_tipo text,p_tamano integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.equipos q JOIN public.eventos ev ON ev.id=q.evento_id WHERE q.id=p_equipo AND ev.estado<>'cerrado')
    THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  IF p_ruta NOT LIKE p_equipo::text || '/presentacion/%' OR length(p_nombre) NOT BETWEEN 1 AND 180
    OR p_tamano NOT BETWEEN 1 AND 4194304
    OR p_tipo NOT IN ('application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation')
    OR NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id='entregas' AND o.name=p_ruta
      AND (o.metadata->>'size')::integer=p_tamano AND o.metadata->>'mimetype'=p_tipo)
    THEN RAISE EXCEPTION 'archivo_invalido'; END IF;
  INSERT INTO public.presentaciones_equipo(equipo_id,archivo_path,archivo_nombre,archivo_tipo,archivo_tamano,cargado_por)
    VALUES(p_equipo,p_ruta,p_nombre,p_tipo,p_tamano,(SELECT auth.uid()))
    ON CONFLICT(equipo_id) DO UPDATE SET archivo_path=EXCLUDED.archivo_path,archivo_nombre=EXCLUDED.archivo_nombre,
      archivo_tipo=EXCLUDED.archivo_tipo,archivo_tamano=EXCLUDED.archivo_tamano,cargado_por=EXCLUDED.cargado_por,actualizado_en=now();
END $$;
REVOKE ALL ON FUNCTION public.guardar_presentacion_equipo(uuid,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_presentacion_equipo(uuid,text,text,text,integer) TO authenticated;
COMMIT;
