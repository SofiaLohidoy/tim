-- 025 — Reconocimiento del evento informado por organización, separado de la rúbrica.
-- Los estudiantes solo pueden consultar si su propio equipo fue reconocido, sin leer
-- identificadores ni registros de otros equipos. No altera ni publica devoluciones.
BEGIN;
CREATE TABLE public.ganadores_evento (
  evento_id uuid PRIMARY KEY REFERENCES public.eventos(id) ON DELETE CASCADE,
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  registrado_por uuid NOT NULL REFERENCES public.perfiles(id),
  registrado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ganadores_evento ENABLE ROW LEVEL SECURITY;
CREATE POLICY ganadores_organizacion ON public.ganadores_evento FOR SELECT TO authenticated USING(public.es_organizador());
REVOKE ALL ON public.ganadores_evento FROM anon,authenticated;
GRANT SELECT ON public.ganadores_evento TO authenticated;
CREATE FUNCTION public.registrar_equipo_ganador(p_evento uuid,p_equipo uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actual uuid;
BEGIN
  IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
  PERFORM 1 FROM public.eventos WHERE id=p_evento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'evento_inexistente'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.equipos WHERE id=p_equipo AND evento_id=p_evento) THEN RAISE EXCEPTION 'equipo_invalido'; END IF;
  SELECT equipo_id INTO actual FROM public.ganadores_evento WHERE evento_id=p_evento;
  IF actual IS NOT NULL AND actual<>p_equipo THEN RAISE EXCEPTION 'ganador_ya_registrado'; END IF;
  INSERT INTO public.ganadores_evento(evento_id,equipo_id,registrado_por)
    VALUES(p_evento,p_equipo,auth.uid()) ON CONFLICT(evento_id) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.registrar_equipo_ganador(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_equipo_ganador(uuid,uuid) TO authenticated;
CREATE FUNCTION public.mi_equipo_ganador(p_evento uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.ganadores_evento g JOIN public.miembros_equipo m
    ON m.equipo_id=g.equipo_id AND m.evento_id=g.evento_id
    WHERE g.evento_id=p_evento AND m.usuario_id=(SELECT auth.uid()))
$$;
REVOKE ALL ON FUNCTION public.mi_equipo_ganador(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mi_equipo_ganador(uuid) TO authenticated;
COMMIT;
