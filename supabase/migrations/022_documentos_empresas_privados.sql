-- 022 — Los PDF no se guardan en el repositorio público de código.
-- Storage privado, solo inscripción confirmada al evento actual o staff.
-- Fuente RLS Storage: https://supabase.com/docs/guides/storage/security/access-control
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('desafios-empresas','desafios-empresas',false,10485760,ARRAY['application/pdf']);
CREATE FUNCTION public.puede_leer_desafios() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.roles_usuario WHERE usuario_id=(SELECT auth.uid()) AND rol IN ('organizador','mentor','jurado'))
  OR EXISTS(
    SELECT 1 FROM public.asistencias a JOIN public.estudiantes e ON e.usuario_id=a.usuario_id
    WHERE a.usuario_id=(SELECT auth.uid()) AND e.onboarding_completo_en IS NOT NULL
      AND a.evento_id=(SELECT id FROM public.eventos ORDER BY CASE estado WHEN 'en_curso' THEN 0 WHEN 'preparacion' THEN 1 ELSE 2 END,fecha DESC LIMIT 1)
  )
$$;
REVOKE ALL ON FUNCTION public.puede_leer_desafios() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.puede_leer_desafios() TO authenticated;
CREATE POLICY desafios_archivos_leer ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='desafios-empresas' AND name IN ('kankay.pdf','v-go.pdf','fardo.pdf','lisa.pdf','bienvenida-completa.pdf') AND public.puede_leer_desafios());
COMMIT;
