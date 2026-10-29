-- 017 — Empresa elegida y dos entregas independientes por equipo.
-- Se conserva intacto el archivo y el link existentes. El segundo archivo tiene su propia
-- tabla y permisos; actualizarlo nunca reemplaza el documento principal del equipo.
BEGIN;
ALTER TABLE public.equipos ADD COLUMN empresa_elegida text
  CHECK (empresa_elegida IN ('Kankay','V-go','Programon','Fardo','Lisa'));
CREATE FUNCTION public.elegir_empresa_equipo(p_equipo uuid,p_empresa text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF p_empresa IS NULL OR p_empresa NOT IN ('Kankay','V-go','Programon','Fardo','Lisa') THEN RAISE EXCEPTION 'empresa_invalida'; END IF;
  PERFORM 1 FROM public.equipos q JOIN public.eventos e ON e.id=q.evento_id WHERE q.id=p_equipo AND e.estado<>'cerrado' FOR UPDATE OF q;
  IF NOT FOUND THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  UPDATE public.equipos SET empresa_elegida=p_empresa WHERE id=p_equipo;
END $$;
REVOKE ALL ON FUNCTION public.elegir_empresa_equipo(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.elegir_empresa_equipo(uuid,text) TO authenticated;
CREATE TABLE public.presentaciones_equipo (
  equipo_id uuid PRIMARY KEY REFERENCES public.equipos(id) ON DELETE CASCADE,
  archivo_path text NOT NULL CHECK (length(archivo_path) <= 300),
  archivo_nombre text NOT NULL CHECK (length(archivo_nombre) BETWEEN 1 AND 180),
  archivo_tipo text NOT NULL,
  archivo_tamano integer NOT NULL CHECK (archivo_tamano BETWEEN 1 AND 4194304),
  cargado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.presentaciones_equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY presentaciones_leer ON public.presentaciones_equipo FOR SELECT TO authenticated
  USING (public.es_organizador() OR public.es_miembro(equipo_id) OR public.evalua_equipo(equipo_id, 'jurado'));
REVOKE INSERT, UPDATE, DELETE ON public.presentaciones_equipo FROM anon, authenticated;


CREATE OR REPLACE FUNCTION public.puede_leer_archivo_entrega(p_ruta text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT equipo_id,archivo_path FROM public.entregas_equipo
      UNION ALL SELECT equipo_id,archivo_path FROM public.presentaciones_equipo
    ) e WHERE e.archivo_path=p_ruta AND (public.es_organizador() OR public.es_miembro(e.equipo_id) OR public.evalua_equipo(e.equipo_id,'jurado'))
  )
$$;
REVOKE ALL ON FUNCTION public.puede_leer_archivo_entrega(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.puede_leer_archivo_entrega(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.guardar_archivo_entrega(p_equipo uuid,p_ruta text,p_nombre text,p_tipo text,p_tamano integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.equipos q JOIN public.eventos ev ON ev.id=q.evento_id WHERE q.id=p_equipo AND ev.estado<>'cerrado')
    THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  IF p_ruta NOT LIKE p_equipo::text || '/%' OR length(p_nombre) NOT BETWEEN 1 AND 180
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
CREATE FUNCTION public.guardar_presentacion_equipo(p_equipo uuid,p_ruta text,p_nombre text,p_tipo text,p_tamano integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.equipos q JOIN public.eventos ev ON ev.id=q.evento_id WHERE q.id=p_equipo AND ev.estado<>'cerrado')
    THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  IF p_ruta NOT LIKE p_equipo::text || '/%' OR length(p_nombre) NOT BETWEEN 1 AND 180
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
