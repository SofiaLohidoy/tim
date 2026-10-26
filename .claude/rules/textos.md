# Textos de la app

## Voz
- Español rioplatense, con voseo: "Escaneá el QR", "Tu equipo", "Elegí un nivel".
- Corto y directo. Una idea por oración.
- Sin texto de relleno: nada de bajadas que explican la pantalla.
- Cálido sin ser infantil. Le hablamos a gente de 20 a 25 años, no a chicos.

## Términos
- Los de `CONTEXT.md`, siempre los mismos. "Devolución", no "feedback" ni "resultado". "Desafío", no "reto". "Equipo", no "grupo".
- **"Señal", nunca "medición"**, "puntaje", "score" ni "nota".
- Niveles con su nombre descriptivo ("Se observa con claridad"), nunca un número.
- Nada de precios, planes, "gratis", "premium" ni "por tiempo limitado".

## Botones
- Con verbo: "Enviar evaluación", "Marcar asistencia", "Publicar devoluciones", "Quiero sumarme".
- Nunca "OK", "Aceptar" o "Siguiente" a secas si se puede decir qué pasa.
- La acción destructiva dice qué destruye: "Quitar del equipo", no "Eliminar".

## Errores
Dicen qué pasó y qué hacer, en una línea:
- Bien: "Ese código ya venció. Escaneá el QR de nuevo."
- Mal: "Error 400", "Algo salió mal", "Código inválido".

Los errores con nombre de la base (`codigo_invalido`, `no_es_tu_equipo`, `url_invalida`, `sin_sesion`) se traducen siempre a un texto así.

## Estados vacíos
Una frase útil que dice qué va a aparecer y cuándo: "Tu devolución aparece acá cuando el equipo de TIM la publique."

## Formato
- Fechas cortas: "31/10/2026". Relativas donde ayudan: "hace 5 min".
- Rótulos de una o dos palabras. "(opcional)" alcanza.
- Datos con fuente en la landing: siempre con su fuente al lado (ver `docs/landing-contenido.md`).
