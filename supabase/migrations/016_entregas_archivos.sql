-- 016 — Entregas compartidas, separadas del CV privado de cada estudiante.
-- El servidor sube con service_role para que el archivo pertenezca al equipo, no a una cuenta
-- individual. La base exige pertenencia, evento abierto y archivo existente antes de registrar.
BEGIN;
CREATE TABLE public.entregas_equipo (
  equipo_id uuid PRIMARY KEY REFERENCES public.equipos(id) ON DELETE CASCADE,
  archivo_path text NOT NULL CHECK (length(archivo_path) <= 300),
  archivo_nombre text NOT NULL CHECK (length(archivo_nombre) BETWEEN 1 AND 180),
  archivo_tipo text NOT NULL,
  archivo_tamano integer NOT NULL CHECK (archivo_tamano BETWEEN 1 AND 4194304),
  cargado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entregas_equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY entregas_leer ON public.entregas_equipo FOR SELECT TO authenticated
  USING (public.es_organizador() OR public.es_miembro(equipo_id) OR public.evalua_equipo(equipo_id, 'jurado'));
REVOKE INSERT, UPDATE, DELETE ON public.entregas_equipo FROM anon, authenticated;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('entregas','entregas',false,4194304,ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
CREATE FUNCTION public.puede_leer_archivo_entrega(p_ruta text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.entregas_equipo e WHERE e.archivo_path = p_ruta
    AND (public.es_organizador() OR public.es_miembro(e.equipo_id) OR public.evalua_equipo(e.equipo_id,'jurado')))
$$;
REVOKE ALL ON FUNCTION public.puede_leer_archivo_entrega(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.puede_leer_archivo_entrega(text) TO authenticated;
CREATE POLICY entregas_archivo_leer ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'entregas' AND public.puede_leer_archivo_entrega(name));

CREATE FUNCTION public.guardar_archivo_entrega(p_equipo uuid,p_ruta text,p_nombre text,p_tipo text,p_tamano integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.equipos q JOIN public.eventos ev ON ev.id=q.evento_id WHERE q.id=p_equipo AND ev.estado<>'cerrado')
    THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  IF p_ruta NOT LIKE p_equipo::text || '/%' OR length(p_nombre) NOT BETWEEN 1 AND 180
    OR p_tamano NOT BETWEEN 1 AND 4194304
    OR p_tipo NOT IN ('application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
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
COMMIT;
