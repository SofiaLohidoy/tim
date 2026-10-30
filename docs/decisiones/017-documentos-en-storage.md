# Documentos de empresas fuera del repositorio público

30/10/2026. El repositorio es público. Guardar PDF bajo src y exigir sesión en una ruta no protege los bytes que se suben a GitHub. Los cuatro documentos recibidos por Sofía y la guía completa se almacenan en el bucket privado desafios-empresas, y las copias de trabajo quedan ignoradas por Git. No se reescribe el historial publicado; la versión anterior de V-go permanece en ese historial, y los documentos nuevos nunca se suben al código.

Las rutas de la app mantienen sus URL y la misma validación de sesión/inscripción. Además Storage aplica RLS: staff o persona con onboarding completo y asistencia al evento actual. No hay cargas de usuarios a este bucket. La clave secreta solo se usa en el script de publicación; las descargas del servidor usan la sesión de la persona. Un catálogo cerrado contiene nombres de archivo y hashes SHA-256, nunca los documentos.

La guía general sin documentos de empresas sigue siendo pública. Al regenerar la guía completa se actualiza su manifiesto; antes de desplegar se ejecuta scripts/publicar-documentos.mjs en dev y prod. Verifica el hash local, sube y vuelve a descargar para comparar bytes. En un checkout nuevo puede recuperar del bucket una copia de trabajo ya publicada y verificarla; si falta un documento nuevo, hace falta el original proporcionado por Sofía.

Las migraciones 021–022 solo amplían una restricción de catálogo y agregan el almacenamiento privado. No borran ni transforman filas de usuarios o entregas. La definición anterior del CHECK está versionada en 017/020; no se exportan datos personales para respaldar un cambio de estructura.
