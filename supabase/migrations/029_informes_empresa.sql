-- 029 — Informe entregado por organización para una empresa por su nombre.
-- Sofía pidió asignación automática por nombre, sin mail ni aprobación previa.
-- Esto NO verifica la identidad comercial: cualquier cuenta llamada igual accede.
-- Excepción acotada al documento proporcionado; no abre estudiantes, CV ni evaluaciones.
-- Storage/RLS: https://supabase.com/docs/guides/storage/security/access-control (10/11/2026).
BEGIN;
CREATE TABLE public.informes_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_clave text NOT NULL CHECK (empresa_clave = lower(btrim(empresa_clave)) AND char_length(empresa_clave) BETWEEN 2 AND 120),
  titulo text NOT NULL CHECK (char_length(titulo) BETWEEN 2 AND 160),
  archivo_ruta text NOT NULL UNIQUE CHECK (char_length(archivo_ruta) BETWEEN 5 AND 240),
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.informes_empresa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.informes_empresa FROM anon, authenticated;
GRANT SELECT ON public.informes_empresa TO authenticated;

CREATE FUNCTION public.puede_leer_informe_empresa(p_ruta text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.informes_empresa i
    JOIN public.empresas e ON lower(btrim(e.nombre))=i.empresa_clave
    WHERE i.archivo_ruta=p_ruta AND e.usuario_id=(SELECT auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.puede_leer_informe_empresa(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.puede_leer_informe_empresa(text) TO authenticated;
CREATE POLICY informes_empresa_leer ON public.informes_empresa FOR SELECT TO authenticated
USING(public.puede_leer_informe_empresa(archivo_ruta));

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('informes-empresa','informes-empresa',false,10485760,ARRAY['application/gzip']);
CREATE POLICY informes_empresa_archivo_leer ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='informes-empresa' AND public.puede_leer_informe_empresa(name));

-- El contenido real se carga por separado en Storage privado, nunca en el repositorio.
INSERT INTO public.informes_empresa(empresa_clave,titulo,archivo_ruta)
VALUES('lisa','Devolución de la hackatón','lisa/informe-2026-11.html.gz');
COMMIT;
