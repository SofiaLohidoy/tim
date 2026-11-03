-- 026 — Pilotos individuales por invitación. Consigna, entregas y devolución privadas.
-- Reloj y cierre controlados en la base; no ejecuta código ni mide habilidades automáticamente.
-- Storage: INSERT sin upsert; descargas autenticadas con SELECT y RLS.
-- Fuente oficial verificada 03/11/2026: https://supabase.com/docs/guides/storage/security/access-control
BEGIN;
CREATE TABLE public.desafios_virtuales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 titulo text NOT NULL CHECK(char_length(titulo) BETWEEN 3 AND 160),
 consigna text NOT NULL CHECK(char_length(consigna) BETWEEN 20 AND 30000),
 duracion_horas integer NOT NULL DEFAULT 72 CHECK(duracion_horas BETWEEN 1 AND 168),
 estado text NOT NULL DEFAULT 'borrador' CHECK(estado IN ('borrador','disponible','cerrado')),
 creado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
 creado_en timestamptz NOT NULL DEFAULT now(), actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.accesos_desafios_virtuales (
 desafio_id uuid NOT NULL REFERENCES public.desafios_virtuales(id) ON DELETE CASCADE,
 usuario_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
 habilitado boolean NOT NULL DEFAULT true,
 defensa_en timestamptz, defensa_url text CHECK(defensa_url IS NULL OR (char_length(defensa_url)<=2000 AND defensa_url ~ '^https://[^[:space:]]+$')),
 actualizado_en timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(desafio_id,usuario_id)
);
CREATE TABLE public.archivos_desafios_virtuales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), desafio_id uuid NOT NULL REFERENCES public.desafios_virtuales(id) ON DELETE CASCADE,
 usuario_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE,
 tipo text NOT NULL CHECK(tipo IN ('consigna','investigacion')),
 ruta text UNIQUE NOT NULL, nombre text NOT NULL CHECK(char_length(nombre) BETWEEN 1 AND 200),
 mime text NOT NULL, tamano integer NOT NULL CHECK(tamano BETWEEN 1 AND 4194304), creado_en timestamptz NOT NULL DEFAULT now(),
 CHECK((tipo='consigna' AND usuario_id IS NULL) OR (tipo='investigacion' AND usuario_id IS NOT NULL))
);
CREATE TABLE public.participaciones_virtuales (
 desafio_id uuid NOT NULL, usuario_id uuid NOT NULL,
 iniciada_en timestamptz NOT NULL DEFAULT now(), vence_en timestamptz NOT NULL,
 borrador jsonb NOT NULL DEFAULT '{}', investigacion_id uuid REFERENCES public.archivos_desafios_virtuales(id) ON DELETE SET NULL,
 enviada_en timestamptz, actualizado_en timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(desafio_id,usuario_id), FOREIGN KEY(desafio_id,usuario_id) REFERENCES public.accesos_desafios_virtuales(desafio_id,usuario_id) ON DELETE CASCADE
);
CREATE TABLE public.revisiones_virtuales (
 desafio_id uuid NOT NULL, usuario_id uuid NOT NULL,
 borrador jsonb NOT NULL DEFAULT '{}', publicada jsonb, publicada_en timestamptz,
 actualizado_en timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(desafio_id,usuario_id), FOREIGN KEY(desafio_id,usuario_id) REFERENCES public.participaciones_virtuales(desafio_id,usuario_id) ON DELETE CASCADE
);
ALTER TABLE public.desafios_virtuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accesos_desafios_virtuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos_desafios_virtuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participaciones_virtuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisiones_virtuales ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.puede_ver_virtual(p_desafio uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.es_organizador() OR EXISTS(SELECT 1 FROM public.accesos_desafios_virtuales a JOIN public.desafios_virtuales d ON d.id=a.desafio_id
 WHERE a.desafio_id=p_desafio AND a.usuario_id=(SELECT auth.uid()) AND a.habilitado AND d.estado<>'borrador')
$$;
REVOKE ALL ON FUNCTION public.puede_ver_virtual(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_virtual(uuid) TO authenticated;
CREATE POLICY virtuales_leer ON public.desafios_virtuales FOR SELECT TO authenticated USING(public.puede_ver_virtual(id));
CREATE POLICY accesos_virtuales_leer ON public.accesos_desafios_virtuales FOR SELECT TO authenticated USING(public.es_organizador() OR usuario_id=(SELECT auth.uid()));
CREATE POLICY archivos_virtuales_leer ON public.archivos_desafios_virtuales FOR SELECT TO authenticated
 USING(public.es_organizador() OR (public.puede_ver_virtual(desafio_id) AND (tipo='consigna' OR usuario_id=(SELECT auth.uid()))));
CREATE POLICY participaciones_virtuales_leer ON public.participaciones_virtuales FOR SELECT TO authenticated
 USING(public.es_organizador() OR (usuario_id=(SELECT auth.uid()) AND public.puede_ver_virtual(desafio_id)));
CREATE POLICY revisiones_virtuales_leer ON public.revisiones_virtuales FOR SELECT TO authenticated USING(public.es_organizador());
REVOKE ALL ON public.desafios_virtuales,public.accesos_desafios_virtuales,public.archivos_desafios_virtuales,public.participaciones_virtuales,public.revisiones_virtuales FROM anon,authenticated;
GRANT SELECT ON public.desafios_virtuales,public.accesos_desafios_virtuales,public.archivos_desafios_virtuales,public.participaciones_virtuales,public.revisiones_virtuales TO authenticated;

CREATE FUNCTION public.guardar_desafio_virtual(p_id uuid,p_titulo text,p_consigna text,p_horas integer) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE id_final uuid;
BEGIN
 IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
 IF p_titulo IS NULL OR char_length(btrim(p_titulo)) NOT BETWEEN 3 AND 160 OR p_consigna IS NULL OR char_length(btrim(p_consigna)) NOT BETWEEN 20 AND 30000 OR p_horas IS NULL OR p_horas NOT BETWEEN 1 AND 168 THEN RAISE EXCEPTION 'datos_invalidos'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.desafios_virtuales(titulo,consigna,duracion_horas,creado_por) VALUES(btrim(p_titulo),btrim(p_consigna),p_horas,auth.uid()) RETURNING id INTO id_final;
 ELSE
  PERFORM 1 FROM public.desafios_virtuales WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'desafio_inexistente'; END IF;
  IF EXISTS(SELECT 1 FROM public.participaciones_virtuales WHERE desafio_id=p_id) THEN RAISE EXCEPTION 'consigna_en_uso'; END IF;
  UPDATE public.desafios_virtuales SET titulo=btrim(p_titulo),consigna=btrim(p_consigna),duracion_horas=p_horas,actualizado_en=now() WHERE id=p_id;
  id_final=p_id;
 END IF;
 RETURN id_final;
END $$;
CREATE FUNCTION public.estado_desafio_virtual(p_desafio uuid,p_estado text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
 IF p_estado IS NULL OR p_estado NOT IN ('borrador','disponible','cerrado') THEN RAISE EXCEPTION 'estado_invalido'; END IF;
 PERFORM 1 FROM public.desafios_virtuales WHERE id=p_desafio FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'desafio_inexistente'; END IF;
 IF p_estado='disponible' AND NOT EXISTS(SELECT 1 FROM public.archivos_desafios_virtuales WHERE desafio_id=p_desafio AND tipo='consigna') THEN RAISE EXCEPTION 'falta_consigna'; END IF;
 UPDATE public.desafios_virtuales SET estado=p_estado,actualizado_en=now() WHERE id=p_desafio;
END $$;
CREATE FUNCTION public.acceso_desafio_virtual(p_desafio uuid,p_usuario uuid,p_habilitar boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
 IF p_habilitar IS NULL OR NOT EXISTS(SELECT 1 FROM public.estudiantes WHERE usuario_id=p_usuario) THEN RAISE EXCEPTION 'persona_invalida'; END IF;
 PERFORM 1 FROM public.desafios_virtuales WHERE id=p_desafio FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'desafio_inexistente'; END IF;
 INSERT INTO public.accesos_desafios_virtuales(desafio_id,usuario_id,habilitado) VALUES(p_desafio,p_usuario,p_habilitar)
 ON CONFLICT(desafio_id,usuario_id) DO UPDATE SET habilitado=EXCLUDED.habilitado,actualizado_en=now();
END $$;
CREATE FUNCTION public.comenzar_virtual(p_desafio uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE horas integer;
BEGIN
 SELECT d.duracion_horas INTO horas FROM public.desafios_virtuales d JOIN public.accesos_desafios_virtuales a ON a.desafio_id=d.id
 WHERE d.id=p_desafio AND d.estado='disponible' AND a.usuario_id=auth.uid() AND a.habilitado FOR UPDATE OF d,a;
 IF NOT FOUND THEN RAISE EXCEPTION 'acceso_no_disponible'; END IF;
 INSERT INTO public.participaciones_virtuales(desafio_id,usuario_id,vence_en) VALUES(p_desafio,auth.uid(),now()+make_interval(hours=>horas)) ON CONFLICT DO NOTHING;
END $$;
CREATE FUNCTION public.guardar_entrega_virtual(p_desafio uuid,p_datos jsonb,p_enviar boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE fila public.participaciones_virtuales; campo text; valor text;
BEGIN
 PERFORM 1 FROM public.desafios_virtuales d JOIN public.accesos_desafios_virtuales a ON a.desafio_id=d.id
 WHERE d.id=p_desafio AND d.estado='disponible' AND a.usuario_id=auth.uid() AND a.habilitado FOR UPDATE OF d,a;
 IF NOT FOUND THEN RAISE EXCEPTION 'acceso_no_disponible'; END IF;
 SELECT * INTO fila FROM public.participaciones_virtuales WHERE desafio_id=p_desafio AND usuario_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'primero_comenza'; END IF;
 IF fila.enviada_en IS NOT NULL OR now()>fila.vence_en THEN RAISE EXCEPTION 'entrega_cerrada'; END IF;
 IF p_datos IS NULL OR jsonb_typeof(p_datos)<>'object' OR octet_length(p_datos::text)>20000 OR p_enviar IS NULL THEN RAISE EXCEPTION 'datos_invalidos'; END IF;
 FOR campo IN SELECT jsonb_object_keys(p_datos) LOOP
  IF campo NOT IN ('via','investigacion_url','repo_url','demo_url','video_url','decisiones') OR jsonb_typeof(p_datos->campo)<>'string' THEN RAISE EXCEPTION 'datos_invalidos'; END IF;
 END LOOP;
 FOREACH campo IN ARRAY ARRAY['investigacion_url','repo_url','demo_url','video_url'] LOOP
  valor=coalesce(p_datos->>campo,'');
  IF char_length(valor)>2000 OR (valor<>'' AND valor !~ '^https://[^[:space:]]+$') THEN RAISE EXCEPTION 'enlace_invalido'; END IF;
 END LOOP;
 IF char_length(coalesce(p_datos->>'decisiones',''))>6000 OR coalesce(p_datos->>'via','') NOT IN ('','B1','B2','B3') THEN RAISE EXCEPTION 'datos_invalidos'; END IF;
 IF p_enviar AND (coalesce(p_datos->>'repo_url','')='' OR coalesce(p_datos->>'video_url','')='' OR coalesce(p_datos->>'via','')='' OR char_length(btrim(coalesce(p_datos->>'decisiones','')))<20 OR (fila.investigacion_id IS NULL AND coalesce(p_datos->>'investigacion_url','')='')) THEN RAISE EXCEPTION 'entrega_incompleta'; END IF;
 UPDATE public.participaciones_virtuales SET borrador=p_datos,enviada_en=CASE WHEN p_enviar THEN now() ELSE NULL END,actualizado_en=now() WHERE desafio_id=p_desafio AND usuario_id=auth.uid();
END $$;

CREATE FUNCTION public.puede_subir_virtual(p_ruta text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE d uuid; persona uuid;
BEGIN
 IF p_ruta !~ '^[0-9a-f-]{36}/(consigna|[0-9a-f-]{36})/[0-9a-f-]{36}\.(pdf|docx|md)$' THEN RETURN false; END IF;
 d=split_part(p_ruta,'/',1)::uuid;
 IF split_part(p_ruta,'/',2)='consigna' THEN
  RETURN public.es_organizador() AND EXISTS(SELECT 1 FROM public.desafios_virtuales WHERE id=d) AND NOT EXISTS(SELECT 1 FROM public.participaciones_virtuales WHERE desafio_id=d) AND p_ruta ~ '\.pdf$';
 END IF;
 persona=split_part(p_ruta,'/',2)::uuid;
 RETURN persona=auth.uid() AND EXISTS(SELECT 1 FROM public.participaciones_virtuales p JOIN public.accesos_desafios_virtuales a USING(desafio_id,usuario_id) JOIN public.desafios_virtuales v ON v.id=p.desafio_id
 WHERE p.desafio_id=d AND p.usuario_id=auth.uid() AND a.habilitado AND v.estado='disponible' AND p.enviada_en IS NULL AND now()<=p.vence_en);
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END $$;
CREATE FUNCTION public.puede_leer_archivo_virtual(p_ruta text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.archivos_desafios_virtuales a WHERE a.ruta=p_ruta AND (public.es_organizador() OR (public.puede_ver_virtual(a.desafio_id) AND (a.tipo='consigna' OR a.usuario_id=auth.uid()))))
$$;
CREATE FUNCTION public.puede_limpiar_virtual(p_ruta text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.archivos_desafios_virtuales WHERE ruta=p_ruta)
$$;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('desafios-virtuales','desafios-virtuales',false,4194304,ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain']);
CREATE POLICY virtual_archivo_subir ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='desafios-virtuales' AND public.puede_subir_virtual(name));
CREATE POLICY virtual_archivo_leer ON storage.objects FOR SELECT TO authenticated USING(bucket_id='desafios-virtuales' AND public.puede_leer_archivo_virtual(name));
CREATE POLICY virtual_archivo_limpiar ON storage.objects FOR DELETE TO authenticated USING(bucket_id='desafios-virtuales' AND owner_id=(SELECT auth.uid())::text AND public.puede_limpiar_virtual(name));
CREATE FUNCTION public.registrar_archivo_virtual(p_desafio uuid,p_ruta text,p_nombre text,p_mime text,p_tamano integer,p_tipo text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE nuevo uuid;
BEGIN
 PERFORM 1 FROM public.desafios_virtuales WHERE id=p_desafio FOR UPDATE;
 IF NOT FOUND OR split_part(p_ruta,'/',1)<>p_desafio::text OR NOT public.puede_subir_virtual(p_ruta) THEN RAISE EXCEPTION 'acceso_no_disponible'; END IF;
 IF p_tipo IS NULL OR p_tipo NOT IN ('consigna','investigacion') OR (p_tipo='consigna') IS DISTINCT FROM (split_part(p_ruta,'/',2)='consigna') OR p_nombre IS NULL OR char_length(p_nombre) NOT BETWEEN 1 AND 200 OR p_tamano IS NULL OR p_tamano NOT BETWEEN 1 AND 4194304 OR p_mime IS NULL OR p_mime NOT IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain') THEN RAISE EXCEPTION 'archivo_invalido'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='desafios-virtuales' AND name=p_ruta AND (metadata->>'size')::bigint=p_tamano AND metadata->>'mimetype'=p_mime) THEN RAISE EXCEPTION 'archivo_invalido'; END IF;
 IF p_tipo='consigna' AND p_mime<>'application/pdf' THEN RAISE EXCEPTION 'archivo_invalido'; END IF;
 INSERT INTO public.archivos_desafios_virtuales(desafio_id,usuario_id,tipo,ruta,nombre,mime,tamano) VALUES(p_desafio,CASE WHEN p_tipo='consigna' THEN NULL ELSE auth.uid() END,p_tipo,p_ruta,p_nombre,p_mime,p_tamano) RETURNING id INTO nuevo;
 IF p_tipo='investigacion' THEN
  PERFORM 1 FROM public.participaciones_virtuales WHERE desafio_id=p_desafio AND usuario_id=auth.uid() FOR UPDATE;
  IF NOT public.puede_subir_virtual(p_ruta) THEN RAISE EXCEPTION 'entrega_cerrada'; END IF;
  UPDATE public.participaciones_virtuales SET investigacion_id=nuevo,actualizado_en=now() WHERE desafio_id=p_desafio AND usuario_id=auth.uid();
 END IF;
 RETURN nuevo;
END $$;
CREATE FUNCTION public.defensa_virtual(p_desafio uuid,p_usuario uuid,p_fecha timestamptz,p_url text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
 IF p_url IS NOT NULL AND (char_length(p_url)>2000 OR p_url !~ '^https://[^[:space:]]+$') THEN RAISE EXCEPTION 'enlace_invalido'; END IF;
 UPDATE public.accesos_desafios_virtuales SET defensa_en=p_fecha,defensa_url=p_url,actualizado_en=now() WHERE desafio_id=p_desafio AND usuario_id=p_usuario;
 IF NOT FOUND THEN RAISE EXCEPTION 'persona_invalida'; END IF;
END $$;
CREATE FUNCTION public.revisar_entrega_virtual(p_desafio uuid,p_usuario uuid,p_datos jsonb,p_publicar boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE k text;
BEGIN
 IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.participaciones_virtuales WHERE desafio_id=p_desafio AND usuario_id=p_usuario AND enviada_en IS NOT NULL) THEN RAISE EXCEPTION 'sin_entrega'; END IF;
 IF p_datos IS NULL OR jsonb_typeof(p_datos)<>'object' OR octet_length(p_datos::text)>30000 OR p_publicar IS NULL THEN RAISE EXCEPTION 'datos_invalidos'; END IF;
 FOR k IN SELECT jsonb_object_keys(p_datos) LOOP
  IF k NOT IN ('research','build','integracion','claridad','juicio','autonomia','comentario') OR jsonb_typeof(p_datos->k)<>'string' OR char_length(p_datos->>k)>3000 THEN RAISE EXCEPTION 'datos_invalidos'; END IF;
 END LOOP;
 IF p_publicar AND NOT EXISTS(SELECT 1 FROM jsonb_each_text(p_datos) v WHERE char_length(btrim(v.value))>0) THEN RAISE EXCEPTION 'revision_vacia'; END IF;
 INSERT INTO public.revisiones_virtuales(desafio_id,usuario_id,borrador,publicada,publicada_en) VALUES(p_desafio,p_usuario,p_datos,CASE WHEN p_publicar THEN p_datos ELSE NULL END,CASE WHEN p_publicar THEN now() ELSE NULL END)
 ON CONFLICT(desafio_id,usuario_id) DO UPDATE SET borrador=p_datos,publicada=CASE WHEN p_publicar THEN p_datos ELSE revisiones_virtuales.publicada END,publicada_en=CASE WHEN p_publicar THEN now() ELSE revisiones_virtuales.publicada_en END,actualizado_en=now();
END $$;
CREATE FUNCTION public.mi_revision_virtual(p_desafio uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN public.puede_ver_virtual(p_desafio) THEN (SELECT jsonb_build_object('contenido',publicada,'publicada_en',publicada_en) FROM public.revisiones_virtuales WHERE desafio_id=p_desafio AND usuario_id=auth.uid()) ELSE NULL END
$$;

REVOKE ALL ON FUNCTION public.guardar_desafio_virtual(uuid,text,text,integer),public.estado_desafio_virtual(uuid,text),public.acceso_desafio_virtual(uuid,uuid,boolean),public.comenzar_virtual(uuid),public.guardar_entrega_virtual(uuid,jsonb,boolean),public.puede_subir_virtual(text),public.puede_leer_archivo_virtual(text),public.puede_limpiar_virtual(text),public.registrar_archivo_virtual(uuid,text,text,text,integer,text),public.defensa_virtual(uuid,uuid,timestamptz,text),public.revisar_entrega_virtual(uuid,uuid,jsonb,boolean),public.mi_revision_virtual(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_desafio_virtual(uuid,text,text,integer),public.estado_desafio_virtual(uuid,text),public.acceso_desafio_virtual(uuid,uuid,boolean),public.comenzar_virtual(uuid),public.guardar_entrega_virtual(uuid,jsonb,boolean),public.puede_subir_virtual(text),public.puede_leer_archivo_virtual(text),public.puede_limpiar_virtual(text),public.registrar_archivo_virtual(uuid,text,text,text,integer,text),public.defensa_virtual(uuid,uuid,timestamptz,text),public.revisar_entrega_virtual(uuid,uuid,jsonb,boolean),public.mi_revision_virtual(uuid) TO authenticated;
COMMIT;
