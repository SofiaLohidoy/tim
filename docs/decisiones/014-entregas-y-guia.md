# Entregas compartidas y guía de bienvenida

27/10/2026. Sofía aprobó implementar y publicar el plan completo.

Los archivos de hackatón se cargan en el bloque del equipo, separados del CV individual. La sección Entregas muestra todos los equipos y eventos al organizador, incluidos archivos y links anteriores; el jurado solo accede a sus equipos. Una entrega no desaparece cuando se elimina una persona: el archivo pertenece al equipo y conserva su contenido. El servidor sube el objeto, la función de la base valida los metadatos y la lectura se hace cumplir con RLS. Formatos iniciales PDF/PPTX/DOCX y límite de 4 MB para admitir la carga vía servidor en Vercel. No se trasladan documentos personales existentes a entregas automáticamente.

Al completar el onboarding se presenta la guía antes de continuar al destino original (incluida asistencia por QR). También se consulta desde Inicio. Pantalla y PDF comparten `src/lib/hackaton/guia.json`; regenerar el PDF con `scripts/generar-guia.py` al editar el contenido. Montserrat y la paleta del brief aplican solo al documento; el resto conserva el manual de marca. Reglas, qué traer y empresas son pendientes visibles hasta confirmación. No se envían correos ni se inventa una casilla de soporte.

Personas es una lista global y no depende de que haya evento activo. Delete pide el mail y respalda los datos antes de eliminar. Las cuentas propias o con roles distintos de estudiante están protegidas. El respaldo no contiene contraseñas ni sesiones y solo se puede recuperar técnicamente.
