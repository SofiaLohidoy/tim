-- 010 — Actividades virtuales (fase B): partidas y señales.
--
-- Por que asi:
-- - El contenido de cada juego (palabras, grillas, acertijos) vive versionado en el codigo
--   (src/lib/actividades/), no en la base: asi se revisa en un diff y los tests comprueban que
--   cada crucigrama cierre y cada acertijo tenga una sola solucion. La partida guarda el slug y
--   la version que se jugo.
-- - Las soluciones nunca llegan al navegador. Toda jugada pasa por el servidor, que la corrige y
--   anota el evento. Por eso partidas y senales no tienen policy de escritura: escribe el
--   servidor (service_role) despues de comprobar que la partida es de quien juega.
-- - `objetivo` (por ejemplo, el indice de la palabra a adivinar) no se puede leer desde el
--   cliente: se revoca por columna.
-- - Una senal es una hipotesis de la tesis, no una medicion (docs/senales.md). Se guarda con la
--   version de la regla que la calculo, porque si la regla cambia las viejas no se recalculan.

BEGIN;

CREATE TABLE public.partidas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  actividad      text NOT NULL,
  version        smallint NOT NULL,
  tipo           text NOT NULL CHECK (tipo IN ('palabra', 'crucigrama', 'einstein')),
  objetivo       jsonb,
  numero         smallint NOT NULL DEFAULT 1,
  resultado      text NOT NULL DEFAULT 'en_curso' CHECK (resultado IN ('en_curso', 'resuelta', 'no_resuelta', 'abandonada')),
  eventos        jsonb NOT NULL DEFAULT '[]'::jsonb,
  iniciada_en    timestamptz NOT NULL DEFAULT now(),
  terminada_en   timestamptz
);
CREATE INDEX partidas_usuario ON public.partidas (usuario_id, actividad, iniciada_en DESC);

CREATE TABLE public.senales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id  uuid NOT NULL REFERENCES public.partidas (id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  clave       text NOT NULL CHECK (clave IN ('persistencia', 'uso_de_informacion', 'autocorreccion')),
  valor       numeric(4, 3) NOT NULL CHECK (valor BETWEEN 0 AND 1),
  detalle     jsonb NOT NULL DEFAULT '{}'::jsonb,
  regla       text NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partida_id, clave)
);
CREATE INDEX senales_usuario ON public.senales (usuario_id, clave);

ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senales ENABLE ROW LEVEL SECURITY;

CREATE POLICY partidas_leer ON public.partidas FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY senales_leer ON public.senales FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());

REVOKE SELECT ON public.partidas FROM authenticated, anon;
GRANT SELECT (id, usuario_id, actividad, version, tipo, numero, resultado, eventos, iniciada_en, terminada_en)
  ON public.partidas TO authenticated;

-- Encuesta de una pregunta al terminar cada partida.
ALTER TABLE public.respuestas_encuesta DROP CONSTRAINT respuestas_encuesta_encuesta_check;
ALTER TABLE public.respuestas_encuesta
  ADD CONSTRAINT respuestas_encuesta_encuesta_check CHECK (encuesta IN ('post_devolucion', 'post_partida'));
ALTER TABLE public.respuestas_encuesta ADD COLUMN partida_id uuid REFERENCES public.partidas (id) ON DELETE CASCADE;
ALTER TABLE public.respuestas_encuesta DROP CONSTRAINT respuestas_encuesta_usuario_id_encuesta_evento_id_key;
ALTER TABLE public.respuestas_encuesta
  ADD CONSTRAINT respuestas_encuesta_unica UNIQUE NULLS NOT DISTINCT (usuario_id, encuesta, evento_id, partida_id);

COMMIT;
