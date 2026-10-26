-- 003 — Evento, asistencia, equipos, asignaciones y desafios.
--
-- Por que asi:
-- - El codigo de asistencia vive en una tabla aparte que solo ve el organizador. Si estuviera
--   en `eventos`, cualquier estudiante logueado podria leerlo y marcar "estuve ahi" desde su
--   casa. El estudiante solo llega a la asistencia por `marcar_asistencia(codigo)`, que valida
--   el codigo vigente o el anterior (gracia de una rotacion, para quien escaneo justo al cambio).
-- - miembros_equipo y asignaciones llevan evento_id con FK compuesta a equipos: asi la base
--   garantiza que una persona este en un solo equipo por evento y que el equipo sea de ese evento.
-- - Mentor y jurado ven a las personas de SUS equipos y a nadie mas. Eso se hace cumplir aca,
--   no en la UI.

BEGIN;

CREATE TABLE public.eventos (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                       text NOT NULL,
  fecha                        date NOT NULL,
  lugar                        text,
  estado                       text NOT NULL DEFAULT 'preparacion'
                                 CHECK (estado IN ('preparacion', 'en_curso', 'cerrado')),
  devoluciones_publicadas_en   timestamptz,
  creado_en                    timestamptz NOT NULL DEFAULT now(),
  actualizado_en               timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER eventos_actualizado BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.poner_actualizado_en();

ALTER TABLE public.roles_usuario
  ADD CONSTRAINT roles_usuario_evento FOREIGN KEY (evento_id) REFERENCES public.eventos (id) ON DELETE CASCADE;
ALTER TABLE public.invitaciones
  ADD CONSTRAINT invitaciones_evento FOREIGN KEY (evento_id) REFERENCES public.eventos (id) ON DELETE CASCADE;

CREATE TABLE public.codigos_asistencia (
  evento_id        uuid PRIMARY KEY REFERENCES public.eventos (id) ON DELETE CASCADE,
  codigo           text NOT NULL,
  codigo_anterior  text,
  rotado_en        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.asistencias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   uuid NOT NULL REFERENCES public.eventos (id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  metodo      text NOT NULL CHECK (metodo IN ('qr', 'organizador')),
  creado_en   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, usuario_id)
);

CREATE TABLE public.desafios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   uuid REFERENCES public.eventos (id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  consigna    text NOT NULL,
  inicio      timestamptz,
  fin         timestamptz,
  estado      text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'cerrado')),
  creado_en   timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER desafios_actualizado BEFORE UPDATE ON public.desafios
  FOR EACH ROW EXECUTE FUNCTION public.poner_actualizado_en();

CREATE TABLE public.equipos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     uuid NOT NULL REFERENCES public.eventos (id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  entrega_url   text,
  entrega_en    timestamptz,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, evento_id),
  UNIQUE (evento_id, nombre)
);

CREATE TABLE public.miembros_equipo (
  equipo_id   uuid NOT NULL,
  evento_id   uuid NOT NULL,
  usuario_id  uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (equipo_id, usuario_id),
  UNIQUE (evento_id, usuario_id),
  FOREIGN KEY (equipo_id, evento_id) REFERENCES public.equipos (id, evento_id) ON DELETE CASCADE
);

CREATE TABLE public.asignaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     uuid NOT NULL,
  equipo_id     uuid NOT NULL,
  evaluador_id  uuid NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  rol           text NOT NULL CHECK (rol IN ('mentor', 'jurado')),
  creado_en     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipo_id, evaluador_id, rol),
  FOREIGN KEY (equipo_id, evento_id) REFERENCES public.equipos (id, evento_id) ON DELETE CASCADE
);
CREATE INDEX asignaciones_evaluador ON public.asignaciones (evaluador_id);

-- Pre-asignacion de estudiantes por mail: si la invitacion trae equipo, al registrarse la
-- persona cae directo en su equipo.
ALTER TABLE public.invitaciones ADD COLUMN equipo_id uuid REFERENCES public.equipos (id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.aplicar_invitaciones(p_usuario uuid, p_email extensions.citext)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.roles_usuario (usuario_id, rol, evento_id)
  SELECT p_usuario, i.rol, i.evento_id
  FROM public.invitaciones i
  WHERE i.email = p_email AND i.rol <> 'estudiante'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.asignaciones (evento_id, equipo_id, evaluador_id, rol)
  SELECT e.evento_id, i.equipo_id, p_usuario, i.rol
  FROM public.invitaciones i JOIN public.equipos e ON e.id = i.equipo_id
  WHERE i.email = p_email AND i.rol IN ('mentor', 'jurado')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.miembros_equipo (equipo_id, evento_id, usuario_id)
  SELECT i.equipo_id, e.evento_id, p_usuario
  FROM public.invitaciones i JOIN public.equipos e ON e.id = i.equipo_id
  WHERE i.email = p_email AND i.rol = 'estudiante'
  ON CONFLICT DO NOTHING;

  UPDATE public.invitaciones SET usada_en = now()
  WHERE email = p_email AND usada_en IS NULL;
END $$;
REVOKE ALL ON FUNCTION public.aplicar_invitaciones(uuid, extensions.citext) FROM PUBLIC, anon, authenticated;

-- Helpers de alcance.
CREATE OR REPLACE FUNCTION public.evalua_equipo(p_equipo uuid, p_rol text DEFAULT NULL) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE equipo_id = p_equipo AND evaluador_id = (SELECT auth.uid())
      AND (p_rol IS NULL OR rol = p_rol)
  )
$$;

CREATE OR REPLACE FUNCTION public.es_miembro(p_equipo uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.miembros_equipo
    WHERE equipo_id = p_equipo AND usuario_id = (SELECT auth.uid())
  )
$$;

-- ¿Puedo ver a esta persona? Yo mismo, el organizador, o quien evalua su equipo.
CREATE OR REPLACE FUNCTION public.puede_ver_persona(p_usuario uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_usuario = (SELECT auth.uid())
    OR public.es_organizador()
    OR EXISTS (
      SELECT 1 FROM public.miembros_equipo m
      JOIN public.asignaciones a ON a.equipo_id = m.equipo_id
      WHERE m.usuario_id = p_usuario AND a.evaluador_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.miembros_equipo yo
      JOIN public.miembros_equipo otro ON otro.equipo_id = yo.equipo_id
      WHERE yo.usuario_id = (SELECT auth.uid()) AND otro.usuario_id = p_usuario
    )
$$;

DROP POLICY perfiles_propio_leer ON public.perfiles;
CREATE POLICY perfiles_leer ON public.perfiles FOR SELECT TO authenticated
  USING (public.puede_ver_persona(id));

-- El estudiante marca "estuve ahi" con el codigo del QR.
CREATE OR REPLACE FUNCTION public.marcar_asistencia(p_codigo text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_evento uuid;
  v_codigo text := upper(trim(p_codigo));
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'sin_sesion';
  END IF;

  SELECT c.evento_id INTO v_evento
  FROM public.codigos_asistencia c JOIN public.eventos e ON e.id = c.evento_id
  WHERE e.estado <> 'cerrado'
    AND (c.codigo = v_codigo OR (c.codigo_anterior = v_codigo AND c.rotado_en > now() - interval '3 minutes'))
  LIMIT 1;

  IF v_evento IS NULL THEN
    RAISE EXCEPTION 'codigo_invalido';
  END IF;

  INSERT INTO public.asistencias (evento_id, usuario_id, metodo)
  VALUES (v_evento, (SELECT auth.uid()), 'qr')
  ON CONFLICT (evento_id, usuario_id) DO NOTHING;

  RETURN v_evento;
END $$;
REVOKE ALL ON FUNCTION public.marcar_asistencia(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_asistencia(text) TO authenticated;

-- Cualquier integrante registra el link de la entrega de su equipo.
CREATE OR REPLACE FUNCTION public.registrar_entrega(p_equipo uuid, p_url text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.es_miembro(p_equipo) THEN
    RAISE EXCEPTION 'no_es_tu_equipo';
  END IF;
  IF p_url !~ '^https?://' OR char_length(p_url) > 500 THEN
    RAISE EXCEPTION 'url_invalida';
  END IF;
  UPDATE public.equipos SET entrega_url = p_url, entrega_en = now() WHERE id = p_equipo;
END $$;
REVOKE ALL ON FUNCTION public.registrar_entrega(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_entrega(uuid, text) TO authenticated;

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;

-- Nombre, fecha y lugar del evento no son sensibles.
CREATE POLICY eventos_leer ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY eventos_organizador ON public.eventos FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY codigos_organizador ON public.codigos_asistencia FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY asistencias_leer ON public.asistencias FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY asistencias_organizador ON public.asistencias FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY desafios_leer ON public.desafios FOR SELECT TO authenticated
  USING (estado <> 'borrador' OR public.es_organizador());
CREATE POLICY desafios_organizador ON public.desafios FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY equipos_leer ON public.equipos FOR SELECT TO authenticated
  USING (public.es_miembro(id) OR public.evalua_equipo(id) OR public.es_organizador());
CREATE POLICY equipos_organizador ON public.equipos FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY miembros_leer ON public.miembros_equipo FOR SELECT TO authenticated
  USING (public.es_miembro(equipo_id) OR public.evalua_equipo(equipo_id) OR public.es_organizador());
CREATE POLICY miembros_organizador ON public.miembros_equipo FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

CREATE POLICY asignaciones_leer ON public.asignaciones FOR SELECT TO authenticated
  USING (evaluador_id = (SELECT auth.uid()) OR public.es_organizador());
CREATE POLICY asignaciones_organizador ON public.asignaciones FOR ALL TO authenticated
  USING (public.es_organizador()) WITH CHECK (public.es_organizador());

COMMIT;
