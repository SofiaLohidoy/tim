-- 013 — Registro y perfil básico de empresa.
-- Cada cuenta gestiona su propia empresa. Este alta no habilita lectura de participantes.
-- El rol empresa se asigna en la misma transacción que el perfil, nunca desde el cliente.
BEGIN;
CREATE TABLE public.empresas (
  usuario_id uuid PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
  nombre text NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 2 AND 120),
  rubro text NOT NULL CHECK (char_length(trim(rubro)) BETWEEN 2 AND 120),
  tamano text NOT NULL CHECK (tamano IN ('1-9', '10-49', '50+')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER empresas_actualizado BEFORE UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.poner_actualizado_en();
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY empresas_propias_leer ON public.empresas FOR SELECT TO authenticated
USING (usuario_id = (SELECT auth.uid()));
-- Las escrituras se validan en guardar_empresa; no hay INSERT/UPDATE directo por API.
REVOKE INSERT, UPDATE, DELETE ON public.empresas FROM anon, authenticated;
GRANT SELECT ON public.empresas TO authenticated;
CREATE FUNCTION public.guardar_empresa(p_nombre text, p_rubro text, p_tamano text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_usuario uuid := (SELECT auth.uid());
BEGIN
  IF v_usuario IS NULL THEN RAISE EXCEPTION 'sin_sesion'; END IF;
  IF p_nombre IS NULL OR char_length(trim(p_nombre)) NOT BETWEEN 2 AND 120
     OR p_rubro IS NULL OR char_length(trim(p_rubro)) NOT BETWEEN 2 AND 120
     OR p_tamano IS NULL OR p_tamano NOT IN ('1-9', '10-49', '50+') THEN
    RAISE EXCEPTION 'datos_empresa_invalidos';
  END IF;
  INSERT INTO public.empresas(usuario_id, nombre, rubro, tamano)
  VALUES(v_usuario, trim(p_nombre), trim(p_rubro), p_tamano)
  ON CONFLICT(usuario_id) DO UPDATE SET nombre = EXCLUDED.nombre, rubro = EXCLUDED.rubro, tamano = EXCLUDED.tamano;
  INSERT INTO public.roles_usuario(usuario_id, rol, evento_id)
  VALUES(v_usuario, 'empresa', NULL) ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.guardar_empresa(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_empresa(text, text, text) TO authenticated;
COMMIT;
