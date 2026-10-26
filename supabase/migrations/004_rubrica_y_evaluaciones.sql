-- 004 — Rubrica, evaluaciones, devoluciones y encuestas.
--
-- Por que asi:
-- - La rubrica plantilla es la del Anexo 6 del BP: 5 dimensiones, cada una con su instancia
--   (grupal, individual o ambas). El BP aclara que no hay puntajes ni ponderaciones: los niveles
--   son descriptivos ("se observa con claridad"), nunca una nota. Por eso `niveles` no tiene un
--   valor numerico que alguien pueda promediar; `orden` es solo para dibujarlos.
-- - Quien evalua que sale de la instancia de cada dimension: el mentor observa a las personas
--   (dimensiones `individual` y `ambas`); el jurado evalua la entrega del equipo (`grupal` y
--   `ambas`). No hay otra configuracion que mantener sincronizada.
-- - Las respuestas de una evaluacion van en un jsonb { "<dimension_id>": { "nivel": <id>, "obs": "" } }.
--   Una sola fila por evaluador y objetivo: el guardado sin señal del mentor sube un documento
--   entero, sin merge de filas sueltas.
-- - Una evaluacion no la ve ningun otro evaluador, para no sesgar. Solo el organizador.
-- - La devolucion es una foto que arma el organizador al "preparar" y que el estudiante recien
--   ve cuando se publica. Asi lo que llega es exactamente lo que el organizador reviso.

BEGIN;

CREATE TABLE public.rubricas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id    uuid REFERENCES public.eventos (id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  descripcion  text,
  es_plantilla boolean NOT NULL DEFAULT false,
  creado_en    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dimensiones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubrica_id     uuid NOT NULL REFERENCES public.rubricas (id) ON DELETE CASCADE,
  orden          smallint NOT NULL,
  nombre         text NOT NULL,
  que_observar   text NOT NULL,
  instancia      text NOT NULL CHECK (instancia IN ('grupal', 'individual', 'ambas')),
  UNIQUE (rubrica_id, orden)
);

CREATE TABLE public.niveles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubrica_id   uuid NOT NULL REFERENCES public.rubricas (id) ON DELETE CASCADE,
  orden        smallint NOT NULL,
  nombre       text NOT NULL,
  descripcion  text NOT NULL,
  UNIQUE (rubrica_id, orden)
);

ALTER TABLE public.eventos ADD COLUMN rubrica_id uuid REFERENCES public.rubricas (id);

CREATE TABLE public.evaluaciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid NOT NULL REFERENCES public.eventos (id) ON DELETE CASCADE,
  equipo_id       uuid NOT NULL REFERENCES public.equipos (id) ON DELETE CASCADE,
  rubrica_id      uuid NOT NULL REFERENCES public.rubricas (id),
  evaluador_id    uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  rol_evaluador   text NOT NULL CHECK (rol_evaluador IN ('mentor', 'jurado')),
  objetivo        text NOT NULL CHECK (objetivo IN ('persona', 'equipo')),
  estudiante_id   uuid REFERENCES public.perfiles (id) ON DELETE CASCADE,
  respuestas      jsonb NOT NULL DEFAULT '{}'::jsonb,
  comentario      text,
  estado          text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada')),
  -- `diferida` = la cargo el organizador despues, desde la rubrica en papel (plan B sin wifi).
  carga           text NOT NULL DEFAULT 'directa' CHECK (carga IN ('directa', 'diferida')),
  cargada_por     uuid REFERENCES public.perfiles (id) ON DELETE SET NULL,
  enviada_en      timestamptz,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT objetivo_coherente CHECK ((objetivo = 'persona') = (estudiante_id IS NOT NULL)),
  CONSTRAINT comentario_corto CHECK (char_length(comentario) <= 2000),
  UNIQUE NULLS NOT DISTINCT (evaluador_id, equipo_id, objetivo, estudiante_id)
);
CREATE TRIGGER evaluaciones_actualizado BEFORE UPDATE ON public.evaluaciones
  FOR EACH ROW EXECUTE FUNCTION public.poner_actualizado_en();
CREATE INDEX evaluaciones_evento ON public.evaluaciones (evento_id);

CREATE OR REPLACE FUNCTION public.devoluciones_publicadas(p_evento uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT devoluciones_publicadas_en IS NOT NULL FROM public.eventos WHERE id = p_evento
$$;

-- La evaluacion es valida si el evaluador esta asignado a ese equipo con ese rol y, cuando el
-- objetivo es una persona, esa persona integra el equipo.
CREATE OR REPLACE FUNCTION public.evaluacion_permitida(
  p_evaluador uuid, p_equipo uuid, p_rol text, p_estudiante uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE equipo_id = p_equipo AND evaluador_id = p_evaluador AND rol = p_rol
  ) AND (
    p_estudiante IS NULL OR EXISTS (
      SELECT 1 FROM public.miembros_equipo WHERE equipo_id = p_equipo AND usuario_id = p_estudiante
    )
  )
$$;

CREATE TABLE public.devoluciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      uuid NOT NULL REFERENCES public.eventos (id) ON DELETE CASCADE,
  estudiante_id  uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  contenido      jsonb NOT NULL,
  publicada_en   timestamptz,
  abierta_en     timestamptz,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, estudiante_id)
);

-- El estudiante solo puede tocar `abierta_en`, y solo la primera vez.
CREATE OR REPLACE FUNCTION public.marcar_devolucion_abierta(p_devolucion uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.devoluciones SET abierta_en = now()
  WHERE id = p_devolucion AND estudiante_id = (SELECT auth.uid())
    AND publicada_en IS NOT NULL AND abierta_en IS NULL
$$;
REVOKE ALL ON FUNCTION public.marcar_devolucion_abierta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_devolucion_abierta(uuid) TO authenticated;

CREATE TABLE public.respuestas_encuesta (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES public.perfiles (id) ON DELETE CASCADE,
  encuesta    text NOT NULL CHECK (encuesta IN ('post_devolucion')),
  evento_id   uuid REFERENCES public.eventos (id) ON DELETE CASCADE,
  respuestas  jsonb NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (usuario_id, encuesta, evento_id)
);

ALTER TABLE public.rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_encuesta ENABLE ROW LEVEL SECURITY;

CREATE POLICY rubricas_leer ON public.rubricas FOR SELECT TO authenticated USING (true);
CREATE POLICY rubricas_organizador ON public.rubricas FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());
CREATE POLICY dimensiones_leer ON public.dimensiones FOR SELECT TO authenticated USING (true);
CREATE POLICY dimensiones_organizador ON public.dimensiones FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());
CREATE POLICY niveles_leer ON public.niveles FOR SELECT TO authenticated USING (true);
CREATE POLICY niveles_organizador ON public.niveles FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY evaluaciones_leer ON public.evaluaciones FOR SELECT TO authenticated
  USING (evaluador_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY evaluaciones_crear ON public.evaluaciones FOR INSERT TO authenticated
  WITH CHECK (
    evaluador_id = (SELECT auth.uid()) AND carga = 'directa'
    AND public.evaluacion_permitida(evaluador_id, equipo_id, rol_evaluador, estudiante_id)
    AND NOT public.devoluciones_publicadas(evento_id)
  );
-- Se puede corregir hasta que el organizador publica las devoluciones.
CREATE POLICY evaluaciones_editar ON public.evaluaciones FOR UPDATE TO authenticated
  USING (evaluador_id = (SELECT auth.uid()) AND NOT public.devoluciones_publicadas(evento_id))
  WITH CHECK (
    evaluador_id = (SELECT auth.uid())
    AND public.evaluacion_permitida(evaluador_id, equipo_id, rol_evaluador, estudiante_id)
  );
CREATE POLICY evaluaciones_organizador ON public.evaluaciones FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY devoluciones_leer ON public.devoluciones FOR SELECT TO authenticated
  USING ((estudiante_id = (SELECT auth.uid()) AND publicada_en IS NOT NULL) OR public.es_organizador());
CREATE POLICY devoluciones_organizador ON public.devoluciones FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY encuesta_leer ON public.respuestas_encuesta FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY encuesta_responder ON public.respuestas_encuesta FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (SELECT auth.uid()));

-- Plantilla del Anexo 6. Los textos de "que observar" son los del BP, tal cual.
DO $$
DECLARE
  r uuid;
BEGIN
  INSERT INTO public.rubricas (nombre, descripcion, es_plantilla)
  VALUES ('Rúbrica exploratoria de capacidades observables',
          'Primera aproximación para un desafío o hackatón TIM (Anexo 6 del BP). Ilustrativa y adaptable: sin puntajes ni ponderaciones.',
          true)
  RETURNING id INTO r;

  INSERT INTO public.dimensiones (rubrica_id, orden, nombre, que_observar, instancia) VALUES
    (r, 1, 'Comprensión del problema',    'Identificación de variables, restricciones y necesidades principales.', 'ambas'),
    (r, 2, 'Análisis y fundamentación',   'Uso de información, razonamiento y explicación de las decisiones.',      'individual'),
    (r, 3, 'Resolución',                  'Coherencia, creatividad y viabilidad de la propuesta.',                   'ambas'),
    (r, 4, 'Comunicación y colaboración', 'Claridad para transmitir ideas, escucha e integración de aportes.',      'grupal'),
    (r, 5, 'Iniciativa y adaptación',     'Autonomía, preguntas relevantes e incorporación de nueva información.',   'ambas');

  -- Los niveles NO estan en el BP: son una propuesta descriptiva a confirmar con Sofia.
  INSERT INTO public.niveles (rubrica_id, orden, nombre, descripcion) VALUES
    (r, 1, 'Todavía no se observa',   'No apareció durante el desafío, o apareció muy poco.'),
    (r, 2, 'Se observa a veces',      'Aparece en algunos momentos, sin sostenerse.'),
    (r, 3, 'Se observa con claridad', 'Aparece de forma consistente durante el desafío.'),
    (r, 4, 'Se destaca',              'Aparece con fuerza y además eleva el trabajo del equipo.');
END $$;

COMMIT;
