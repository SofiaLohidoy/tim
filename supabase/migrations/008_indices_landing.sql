-- 008 — Índices para el rate limit de la landing.
--
-- Por que: el limite ahora cuenta por visitante y por IP en la ultima hora o minuto. Sin estos
-- indices, cada evento de la landing haria un recorrido completo de la tabla cuando crezca.

BEGIN;

CREATE INDEX IF NOT EXISTS eventos_landing_ip ON public.eventos_landing (ip_hash, creado_en DESC);
CREATE INDEX IF NOT EXISTS interesados_visitante ON public.interesados (visitante_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS interesados_ip ON public.interesados (ip_hash, creado_en DESC);

COMMIT;
