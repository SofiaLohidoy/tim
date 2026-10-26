-- 002 — Estudiantes: lo que cuenta el onboarding, el arquetipo y el CV opcional.
--
-- Por que asi:
-- - El arquetipo sale del arbol del Anexo 2 del BP (4 preguntas de si/no). Se guarda el
--   resultado y tambien las respuestas, para poder re-clasificar si el arbol cambia.
--   `accede` = la persona dice que ya accede a trabajos: el arbol termina ahi sin arquetipo.
-- - El CV es opcional y sirve para correr despues la comparacion "CV vs. evidencia" del BP.
--   Vive en un bucket privado. Lo ven la persona y el organizador; mentores y jurados no, para
--   que evaluen lo que ven en la hackaton y no el papel.
-- - `consentimiento_en` es obligatorio: sin consentimiento no hay fila.

BEGIN;

CREATE TABLE public.estudiantes (
  usuario_id              uuid PRIMARY KEY REFERENCES public.perfiles (id) ON DELETE CASCADE,
  universidad             text,
  carrera                 text,
  anio_carrera            text,
  area_buscada            text,
  intereses               text[] NOT NULL DEFAULT '{}',
  por_que                 text,
  arquetipo               text CHECK (arquetipo IN (
                            'no_sabe_que_quiere', 'no_identifica_fortalezas', 'no_sabe_demostrar',
                            'hace_todo_bien', 'reorientacion', 'accede')),
  arquetipo_respuestas    jsonb,
  cv_path                 text,
  consentimiento_en       timestamptz NOT NULL,
  onboarding_completo_en  timestamptz,
  creado_en               timestamptz NOT NULL DEFAULT now(),
  actualizado_en          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT por_que_corto CHECK (char_length(por_que) <= 500)
);
CREATE TRIGGER estudiantes_actualizado BEFORE UPDATE ON public.estudiantes
  FOR EACH ROW EXECUTE FUNCTION public.poner_actualizado_en();

ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY estudiantes_leer ON public.estudiantes FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY estudiantes_crear ON public.estudiantes FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (SELECT auth.uid()));
CREATE POLICY estudiantes_editar ON public.estudiantes FOR UPDATE TO authenticated
  USING (usuario_id = (SELECT auth.uid())) WITH CHECK (usuario_id = (SELECT auth.uid()));

-- Al completar el onboarding la persona pasa a tener el rol estudiante.
CREATE OR REPLACE FUNCTION public.al_completar_onboarding() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.onboarding_completo_en IS NOT NULL THEN
    INSERT INTO public.roles_usuario (usuario_id, rol) VALUES (NEW.usuario_id, 'estudiante')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.al_completar_onboarding() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER estudiantes_rol AFTER INSERT OR UPDATE OF onboarding_completo_en ON public.estudiantes
  FOR EACH ROW EXECUTE FUNCTION public.al_completar_onboarding();

-- Bucket privado de CV. La ruta es `<usuario_id>/cv.pdf`: la primera carpeta es el dueño.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY cvs_propio_leer ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cvs' AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text OR public.es_organizador()));
CREATE POLICY cvs_propio_subir ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY cvs_propio_reemplazar ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY cvs_propio_borrar ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

COMMIT;
