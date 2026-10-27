-- 015 — Respaldo privado antes de eliminar una cuenta desde Personas.
-- El servidor verifica organizador y usa Auth Admin para borrar la cuenta (y sus FK CASCADE).
-- La base vuelve a validar destinatario, mail y rol antes de respaldar. Los respaldos no son
-- accesibles desde el navegador, ni siquiera por el organizador; recuperación técnica solamente.
BEGIN;

CREATE TABLE public.respaldos_eliminacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  solicitado_por uuid NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  datos jsonb NOT NULL,
  cv_base64 text CHECK (octet_length(cv_base64) <= 7100000)
);
ALTER TABLE public.respaldos_eliminacion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.respaldos_eliminacion FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.respaldos_eliminacion TO service_role;

CREATE FUNCTION public.respaldar_estudiante(p_usuario uuid, p_email text, p_cv_base64 text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_perfil public.perfiles;
  v_respaldo uuid;
  v_datos jsonb;
  v_tabla text;
  v_filas jsonb;
BEGIN
  IF NOT public.es_organizador() THEN RAISE EXCEPTION 'solo_organizador'; END IF;
  IF p_usuario = (SELECT auth.uid()) THEN RAISE EXCEPTION 'cuenta_protegida'; END IF;
  SELECT * INTO v_perfil FROM public.perfiles WHERE id = p_usuario FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'persona_inexistente'; END IF;
  IF lower(trim(p_email)) <> lower(v_perfil.email::text) OR p_email IS NULL THEN
    RAISE EXCEPTION 'mail_no_coincide';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.estudiantes WHERE usuario_id = p_usuario)
    OR EXISTS (SELECT 1 FROM public.roles_usuario WHERE usuario_id = p_usuario AND rol <> 'estudiante')
    OR EXISTS (SELECT 1 FROM public.invitaciones WHERE email = v_perfil.email AND rol <> 'estudiante')
    THEN RAISE EXCEPTION 'cuenta_protegida'; END IF;
  IF EXISTS (SELECT 1 FROM public.estudiantes WHERE usuario_id = p_usuario AND cv_path IS NOT NULL)
    AND coalesce(length(p_cv_base64), 0) = 0 THEN RAISE EXCEPTION 'falta_respaldo_cv'; END IF;

  v_datos := jsonb_build_object('perfiles', jsonb_build_array(to_jsonb(v_perfil)));
  FOREACH v_tabla IN ARRAY ARRAY['estudiantes','roles_usuario','asistencias','miembros_equipo',
    'respuestas_encuesta','partidas','senales','credenciales'] LOOP
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) FROM public.%I t WHERE usuario_id = $1', v_tabla)
      INTO v_filas USING p_usuario;
    v_datos := v_datos || jsonb_build_object(v_tabla, v_filas);
  END LOOP;
  SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_filas
    FROM public.evaluaciones t WHERE estudiante_id = p_usuario;
  v_datos := v_datos || jsonb_build_object('evaluaciones', v_filas);
  SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_filas
    FROM public.devoluciones t WHERE estudiante_id = p_usuario;
  v_datos := v_datos || jsonb_build_object('devoluciones', v_filas);
  SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_filas
    FROM public.invitaciones t WHERE email = v_perfil.email;
  v_datos := v_datos || jsonb_build_object('invitaciones', v_filas);
  -- No se respaldan contraseñas ni sesiones: una recuperación requiere nueva invitación.
  INSERT INTO public.respaldos_eliminacion(usuario_id, solicitado_por, datos, cv_base64)
    VALUES (p_usuario, (SELECT auth.uid()), v_datos, p_cv_base64) RETURNING id INTO v_respaldo;
  RETURN v_respaldo;
END $$;
REVOKE ALL ON FUNCTION public.respaldar_estudiante(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respaldar_estudiante(uuid,text,text) TO authenticated;
COMMIT;
