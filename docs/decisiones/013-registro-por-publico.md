# Registro por público

Pedido de Sofía y equipo, 26/10/2026. Alcance: implementación local.

La principal conserva dos acciones directas: «Quiero demostrar mi talento» y «Quiero contratar talento». `/estudiantes` y `/empresas` explican cada propuesta y se alcanzan desde el menú y las tarjetas de la principal. Se retiran los formularios de interés; se conservan sus registros históricos.

El registro reutiliza autenticación y distingue el destino con `tipo=empresa` o `tipo=estudiante`. `modo=entrar` abre las cuentas existentes. El alta de empresa recuerda su recorrido en `roles_usuario`; `empresas` guarda nombre, rubro y tamaño. Las funciones con sesión validan esos datos y solo asignan el rol empresa. Cada empresa puede leer y actualizar su perfil propio.

Se adelanta de fase D únicamente registro, perfil y bienvenida. Catálogo, contactos y propuestas continúan pendientes. El rol empresa no permite leer estudiantes, CV, evaluaciones ni perfiles ajenos. No cambia la rúbrica ni se habilita monetización.

La misma web se adapta a celular y computadora. Se muestra el logo completo junto al saludo. Se conserva la barra lateral de organización. Esta etapa no publica código ni migra producción.
