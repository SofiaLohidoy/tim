-- 024 — Síntesis colectiva aportada por organización, sin inventar evaluaciones ni niveles.
-- Privada hasta preparar/publicar la devolución. Una corrección invalida la preparación anterior.
BEGIN;
CREATE TABLE public.devoluciones_jurado_general (
  equipo_id uuid PRIMARY KEY REFERENCES public.equipos(id) ON DELETE CASCADE,
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  texto text NOT NULL CHECK(char_length(texto) BETWEEN 20 AND 30000),
  fuente text NOT NULL CHECK(char_length(fuente) BETWEEN 1 AND 200),
  cargada_por uuid NOT NULL REFERENCES public.perfiles(id),
  actualizada_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devoluciones_jurado_general ENABLE ROW LEVEL SECURITY;
CREATE POLICY jurado_general_organizacion ON public.devoluciones_jurado_general
FOR SELECT TO authenticated USING(public.es_organizador());
REVOKE ALL ON public.devoluciones_jurado_general FROM anon,authenticated;
GRANT SELECT ON public.devoluciones_jurado_general TO authenticated;
CREATE TRIGGER jurado_general_revision AFTER INSERT OR UPDATE OR DELETE ON public.devoluciones_jurado_general
FOR EACH ROW EXECUTE FUNCTION public.revisar_evaluaciones_evento();
CREATE FUNCTION public.guardar_devolucion_jurado_general(p_equipo uuid,p_texto text,p_fuente text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evento uuid;
BEGIN
  IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
  IF p_texto IS NULL OR char_length(btrim(p_texto)) NOT BETWEEN 20 AND 30000
    OR p_fuente IS NULL OR char_length(btrim(p_fuente)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'devolucion_invalida';
  END IF;
  SELECT evento_id INTO evento FROM public.equipos WHERE id=p_equipo;
  IF NOT FOUND THEN RAISE EXCEPTION 'equipo_inexistente'; END IF;
  PERFORM 1 FROM public.eventos WHERE id=evento FOR UPDATE;
  INSERT INTO public.devoluciones_jurado_general(equipo_id,evento_id,texto,fuente,cargada_por)
  VALUES(p_equipo,evento,btrim(p_texto),btrim(p_fuente),auth.uid())
  ON CONFLICT(equipo_id) DO UPDATE SET texto=EXCLUDED.texto,fuente=EXCLUDED.fuente,
    cargada_por=EXCLUDED.cargada_por,actualizada_en=clock_timestamp()
  WHERE devoluciones_jurado_general.texto IS DISTINCT FROM EXCLUDED.texto
     OR devoluciones_jurado_general.fuente IS DISTINCT FROM EXCLUDED.fuente;
END $$;
REVOKE ALL ON FUNCTION public.guardar_devolucion_jurado_general(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_devolucion_jurado_general(uuid,text,text) TO authenticated;
COMMIT;
