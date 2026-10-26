-- 005 — Medicion de la landing: interesados y eventos.
--
-- Por que asi:
-- - Es el instrumento de la tesis para medir interes, de los dos lados. Todo queda en la base
--   propia: nada de herramientas pagas ni de terceros que se queden con los datos.
-- - Ninguna de las dos tablas tiene policy de INSERT. Desde el browser no se escribe directo:
--   entra por el servidor (Server Action / route handler), que valida con zod y aplica un rate
--   limit por visitante, y escribe con service_role. Asi un script no llena la tabla de basura.
-- - Lectura: solo el organizador.
-- - `visitante_id` es un id aleatorio en cookie, no una persona. `ip_hash` es un hash con sal,
--   solo para el rate limit; la IP no se guarda.

BEGIN;

CREATE TABLE public.interesados (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audiencia     text NOT NULL CHECK (audiencia IN ('estudiante', 'empresa')),
  email         extensions.citext NOT NULL,
  datos         jsonb NOT NULL DEFAULT '{}'::jsonb,
  variante      text,
  origen        jsonb NOT NULL DEFAULT '{}'::jsonb,
  visitante_id  text,
  ip_hash       text,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audiencia, email)
);

CREATE TABLE public.eventos_landing (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitante_id  text NOT NULL,
  tipo          text NOT NULL CHECK (tipo IN (
                  'visita', 'seccion', 'clic_cta', 'form_inicio', 'form_fin', 'form_error')),
  detalle       text,
  variante      text,
  origen        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash       text,
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX eventos_landing_visitante ON public.eventos_landing (visitante_id, creado_en DESC);
CREATE INDEX eventos_landing_tipo ON public.eventos_landing (tipo, creado_en DESC);

ALTER TABLE public.interesados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_landing ENABLE ROW LEVEL SECURITY;

CREATE POLICY interesados_organizador ON public.interesados FOR SELECT TO authenticated
  USING (public.es_organizador());
CREATE POLICY eventos_landing_organizador ON public.eventos_landing FOR SELECT TO authenticated
  USING (public.es_organizador());

COMMIT;
