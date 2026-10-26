# 003 — Devoluciones como foto preparada y publicada por el organizador

Fecha: 25/10/2026 · Estado: aceptada

## Contexto
La devolución es lo que ve cada estudiante sobre cómo trabajó. Junta evaluaciones de su mentor (individuales) y del jurado (de equipo). Si se calculara en vivo, el estudiante podría ver evaluaciones a medio cargar o cambiar mientras las lee.

## Decisión
- El organizador **prepara**: el sistema arma una foto (`devoluciones.contenido`, jsonb) con las evaluaciones enviadas.
- El organizador la revisa y **publica** (`publicada_en`, y `eventos.devoluciones_publicadas_en`).
- La RLS solo deja ver una devolución publicada. Después de publicar, los evaluadores ya no pueden editar sus evaluaciones.

## Alternativas descartadas
- **Cálculo en vivo desde `evaluaciones`**: el estudiante vería borradores o cambios; y habría que abrir la lectura de evaluaciones al estudiante.
- **Publicación automática al cerrar el evento**: nadie revisa lo que llega.

## Consecuencias
- Si se corrige una evaluación antes de publicar, hay que volver a preparar.
- Al publicar se dispara la encuesta de 3 preguntas y se mide la apertura (`abierta_en`).
