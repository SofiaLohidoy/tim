# Informe específico por nombre de empresa

10/11/2026. Sofía pidió que el informe que entregó para Lisa aparezca automáticamente al guardar el nombre «Lisa», sin mail predefinido ni aprobación de organización. Confirmó esta regla después de explicar que un nombre autodeclarado no verifica la identidad de una empresa. Se usa coincidencia completa, ignorando mayúsculas y espacios en los extremos; «Lisa AI» o nombres que solo contienen «Lisa» no coinciden.

Es una excepción explícita al anonimato general, limitada al documento proporcionado por Sofía. No permite consultar estudiantes, CV, evaluaciones ni devoluciones individuales en las tablas existentes. Cualquier cuenta que declare exactamente ese nombre tendrá acceso al mismo informe; no se presenta como verificación de identidad.

`informes_empresa` y un bucket privado hacen cumplir la regla en la base. Solo el proceso de publicación carga el informe. La empresa solo lee los metadatos y el objeto autorizado. Cambiar el nombre revoca las siguientes lecturas autenticadas. La aplicación no emite enlaces públicos ni URLs firmadas; como cualquier documento descargable, una copia ya obtenida no se puede revocar.

El HTML original contiene fuentes, imágenes y un mapa interactivo. Se publica una copia en Storage privado, sin incluir datos personales en git. Se retiran los scripts del visor de exportación, se conserva el script propio del mapa y se optimizan imágenes a WebP. Gzip mantiene la respuesta por debajo del límite del proveedor. La ruta autenticada entrega el HTML en un origen aislado mediante CSP sandbox, sin cookies ni conexiones de red, permitiendo mapa, impresión y descarga del documento. El informe no se inserta como HTML en componentes de TIM.
