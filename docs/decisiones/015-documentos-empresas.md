# Tarjetas de empresas y documentos de participantes

29/10/2026. Sofía pidió tarjetas de Kankay, V-go, Programon, Fardo y Lisa al inscribirse por QR o código, con los logos proporcionados. V-go es el único documento recibido; el resto muestra Documento próximamente y no se puede tocar.

Las tarjetas aparecen en la guía y en Inicio solo cuando existe asistencia confirmada al evento actual por QR/código. Completar el perfil en TIM no alcanza: Sofía aclaró esta diferencia al revisar Inicio. La tarjeta del evento precede al enlace de la guía.

Los logos se conservan sin editar. El PDF original de V-go se copia sin modificar sus bytes y queda fuera de public; un Route Handler comprueba onboarding y asistencia al evento actual con la sesión de la persona y la RLS existente. El staff conserva acceso de trabajo. Sin sesión se pide ingresar; sin inscripción se responde 403, incluso con enlace directo. Un error de consulta no concede acceso.

El PDF público contiene la guía general sin empresas. La versión completa se guarda fuera de public y se sirve en /hackaton/guia/documento con la misma autorización que V-go y sin caché pública. Ambos archivos privados se incluyen explícitamente en el output tracing de Vercel. No hay tabla ni cambio de permisos de la base; el catálogo está versionado y sumar los próximos documentos requiere una nueva publicación. La RLS de asistencias ya impide a un estudiante darse de alta sin el código válido.
