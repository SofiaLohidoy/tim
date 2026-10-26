-- 014 — Recordar el recorrido de empresa aunque el perfil quede incompleto.
BEGIN;
CREATE FUNCTION public.iniciar_registro_empresa() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'sin_sesion'; END IF;
  INSERT INTO public.roles_usuario(usuario_id, rol, evento_id)
  VALUES((SELECT auth.uid()), 'empresa', NULL) ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.iniciar_registro_empresa() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.iniciar_registro_empresa() TO authenticated;
COMMIT;
