-- 020 — Programon no participa. No borrar elecciones históricas ni archivos:
-- la app muestra las retiradas sin elección y exige elegir entre las cuatro activas.
BEGIN;
CREATE OR REPLACE FUNCTION public.elegir_empresa_equipo(p_equipo uuid,p_empresa text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN RAISE EXCEPTION 'no_es_tu_equipo'; END IF;
  IF p_empresa IS NULL OR p_empresa NOT IN ('Kankay','V-go','Fardo','Lisa') THEN RAISE EXCEPTION 'empresa_invalida'; END IF;
  PERFORM 1 FROM public.equipos q JOIN public.eventos e ON e.id=q.evento_id WHERE q.id=p_equipo AND e.estado<>'cerrado' FOR UPDATE OF q;
  IF NOT FOUND THEN RAISE EXCEPTION 'evento_cerrado'; END IF;
  UPDATE public.equipos SET empresa_elegida=p_empresa WHERE id=p_equipo;
END $$;
REVOKE ALL ON FUNCTION public.elegir_empresa_equipo(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.elegir_empresa_equipo(uuid,text) TO authenticated;
COMMIT;
