-- 012 — "Preparada" y "cambiada despues" se comparan con el mismo reloj.
--
-- Por que: preparada_en lo ponia el servidor de la app y actualizado_en lo pone la base. Con
-- relojes distintos (unos milisegundos alcanzan), publicar decia que habia evaluaciones nuevas
-- cuando no las habia. Ahora las dos marcas salen de now() de la base.

BEGIN;

CREATE OR REPLACE FUNCTION public.marcar_preparadas(p_evento uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
  UPDATE public.devoluciones SET preparada_en = now() WHERE evento_id = p_evento AND publicada_en IS NULL;
END $$;
REVOKE ALL ON FUNCTION public.marcar_preparadas(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_preparadas(uuid) TO authenticated;

-- true si alguna evaluacion del evento cambio despues de la preparacion mas vieja.
CREATE OR REPLACE FUNCTION public.devoluciones_desactualizadas(p_evento uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.evaluaciones ev
    WHERE ev.evento_id = p_evento
      AND ev.actualizado_en > (SELECT min(preparada_en) FROM public.devoluciones WHERE evento_id = p_evento)
  )
$$;
REVOKE ALL ON FUNCTION public.devoluciones_desactualizadas(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.devoluciones_desactualizadas(uuid) TO authenticated;

COMMIT;
