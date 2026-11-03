-- 027 — El organizador puede retirar una versión completa, respaldándola antes.
-- Los archivos se conservan privados para recuperación; no se borran cuentas.
BEGIN;
CREATE TABLE public.respaldos_desafios_virtuales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), desafio_id uuid NOT NULL UNIQUE,
 titulo text NOT NULL, datos jsonb NOT NULL, creado_en timestamptz NOT NULL DEFAULT now(),
 creado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL
);
ALTER TABLE public.respaldos_desafios_virtuales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.respaldos_desafios_virtuales FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.puede_limpiar_virtual(p_ruta text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.archivos_desafios_virtuales WHERE ruta=p_ruta)
 AND NOT EXISTS(SELECT 1 FROM public.respaldos_desafios_virtuales r CROSS JOIN LATERAL jsonb_array_elements(r.datos->'archivos') a WHERE a->>'ruta'=p_ruta)
$$;
REVOKE ALL ON FUNCTION public.puede_limpiar_virtual(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.puede_limpiar_virtual(text) TO authenticated;

CREATE FUNCTION public.eliminar_desafio_virtual(p_desafio uuid,p_titulo text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d public.desafios_virtuales; respaldo uuid;
BEGIN
 IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
 SELECT * INTO d FROM public.desafios_virtuales WHERE id=p_desafio FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'desafio_inexistente'; END IF;
 IF p_titulo IS DISTINCT FROM d.titulo THEN RAISE EXCEPTION 'confirmacion_incorrecta'; END IF;
 PERFORM 1 FROM public.accesos_desafios_virtuales WHERE desafio_id=p_desafio FOR UPDATE;
 PERFORM 1 FROM public.participaciones_virtuales WHERE desafio_id=p_desafio FOR UPDATE;
 PERFORM 1 FROM public.revisiones_virtuales WHERE desafio_id=p_desafio FOR UPDATE;
 PERFORM 1 FROM public.archivos_desafios_virtuales WHERE desafio_id=p_desafio FOR UPDATE;
 INSERT INTO public.respaldos_desafios_virtuales(desafio_id,titulo,creado_por,datos) VALUES(p_desafio,d.titulo,auth.uid(),jsonb_build_object(
  'desafio',to_jsonb(d),
  'accesos',(SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) FROM public.accesos_desafios_virtuales a WHERE desafio_id=p_desafio),
  'participaciones',(SELECT coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) FROM public.participaciones_virtuales p WHERE desafio_id=p_desafio),
  'revisiones',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.revisiones_virtuales r WHERE desafio_id=p_desafio),
  'archivos',(SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) FROM public.archivos_desafios_virtuales a WHERE desafio_id=p_desafio)
 )) RETURNING id INTO respaldo;
 DELETE FROM public.desafios_virtuales WHERE id=p_desafio;
 RETURN respaldo;
END $$;
REVOKE ALL ON FUNCTION public.eliminar_desafio_virtual(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_desafio_virtual(uuid,text) TO authenticated;
COMMIT;
