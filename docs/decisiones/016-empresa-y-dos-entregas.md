# Empresa elegida y dos entregas por equipo

29/10/2026. Sofía confirmó un desplegable de empresa compartido por el equipo, un documento principal Word/PDF y una presentación opcional PowerPoint/PDF o enlace de Canva. No se elige una empresa por integrante.

Se agrega `equipos.empresa_elegida`. `entregas_equipo` conserva el archivo previo como documento principal; `presentaciones_equipo` guarda el segundo archivo sin cambiar la clave ni trasladar datos existentes. El enlace anterior se conserva como presentación. Un archivo previo PPTX sigue accesible; las nuevas cargas principales admiten PDF/DOCX y las de presentación PDF/PPTX. Canva se comparte mediante su enlace o exportando un PDF, no como formato nativo.

Ambas tablas usan RLS con los mismos lectores: integrantes, organizador y jurado asignado. Mutaciones mediante funciones que validan pertenencia, evento abierto y metadatos del archivo. Rutas de Storage distintas impiden vincular el mismo objeto a ambas entregas y borrarlo al reemplazar la otra. Los autores son nullable para conservar las entregas compartidas si se borra una cuenta. El límite existente sigue siendo 4 MB por archivo.

El formulario permite cargar por pasos; indica el documento principal como obligatorio y la presentación como opcional. No se introduce un nuevo cierre definitivo de entrega. El organizador ve las dos categorías en Entregas y el jurado en su listado y evaluación; ambos ven la empresa elegida. El filtro opcional por UUID de equipo en Entregas permite abrir un único equipo sin cargar los demás.
