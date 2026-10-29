# 003 — Devoluciones como foto preparada y publicada por el organizador

Fecha: 25/10/2026 · Actualizada: 29/10/2026 · Estado: aceptada

## Contexto
La devolución es lo que ve cada estudiante sobre cómo trabajó. Junta evaluaciones de su mentor (individuales) y del jurado (de equipo). Si se calculara en vivo, el estudiante podría ver evaluaciones a medio cargar o cambiar mientras las lee.

## Decisión
- El organizador **prepara**: el sistema arma una foto privada (`devoluciones_borrador.contenido`, jsonb) con las evaluaciones enviadas. No modifica la versión publicada.
- El organizador la revisa y **publica** (`publicada_en`, y `eventos.devoluciones_publicadas_en`).
- La RLS solo deja al estudiante ver su devolución publicada; los borradores solo los ve organización. Sofía confirmó que las versiones anteriores deben seguir visibles hasta confirmar una nueva publicación.
- Se puede preparar y publicar varias veces. Publicar reemplaza las fotos de esa preparación en una transacción y conserva IDs, aperturas y encuestas previas. No cierra las evaluaciones: se cierran con el estado Cerrado del evento.
- Cada mutación de evaluaciones incrementa una revisión del evento. Preparar comprueba que no cambió durante la lectura; publicar verifica esa misma revisión con bloqueo del evento. Si cambió, pide volver a preparar.

## Alternativas descartadas
- **Cálculo en vivo desde `evaluaciones`**: el estudiante vería borradores o cambios; y habría que abrir la lectura de evaluaciones al estudiante.
- **Publicación automática al cerrar el evento**: nadie revisa lo que llega.

## Consecuencias
- Si se corrige una evaluación antes de publicar, hay que volver a preparar.
- Al publicar se dispara la encuesta de 3 preguntas y se mide la apertura (`abierta_en`).
