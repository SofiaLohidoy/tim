-- 028 — Cuatro entregables: informe (archivo o enlace), repositorio, dashboard y video.
-- No altera entregas enviadas ni borra integración/decisiones históricas.
BEGIN;
CREATE OR REPLACE FUNCTION public.guardar_entrega_virtual(p_desafio uuid,p_datos jsonb,p_enviar boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 IF p_enviar THEN
  IF fila.investigacion_id IS NULL AND btrim(coalesce(p_datos->>'investigacion_url',''))='' THEN RAISE EXCEPTION 'entrega_incompleta_informe'; END IF;
  IF btrim(coalesce(p_datos->>'repo_url',''))='' THEN RAISE EXCEPTION 'entrega_incompleta_repositorio'; END IF;
  IF btrim(coalesce(p_datos->>'demo_url',''))='' THEN RAISE EXCEPTION 'entrega_incompleta_plataforma'; END IF;
  IF btrim(coalesce(p_datos->>'video_url',''))='' THEN RAISE EXCEPTION 'entrega_incompleta_video'; END IF;
 END IF;
 UPDATE public.participaciones_virtuales SET borrador=fila.borrador||p_datos,enviada_en=CASE WHEN p_enviar THEN now() ELSE NULL END,actualizado_en=now() WHERE desafio_id=p_desafio AND usuario_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.guardar_entrega_virtual(uuid,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_entrega_virtual(uuid,jsonb,boolean) TO authenticated;
COMMIT;
