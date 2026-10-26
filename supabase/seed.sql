-- Solo local. Joaquín entra como organizador apenas se registra con su mail.
-- En producción la primera organizadora se carga a mano (docs/puesta-en-marcha.md).
INSERT INTO public.invitaciones (email, rol) VALUES ('joaquinberardi@programon.co', 'organizador')
ON CONFLICT DO NOTHING;
