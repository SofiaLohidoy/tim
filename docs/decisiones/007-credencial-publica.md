# 007 — Qué muestra la credencial pública

Fecha: 26/10/2026 · Estado: aceptada

## Contexto
La fase C suma un link con QR (`/v/<token>`) para que la persona muestre su evidencia a quien quiera: una empresa, LinkedIn, un CV.

## Decisión
- Muestra solo **evidencia observada por personas**: los niveles que mentores y jurados registraron en devoluciones publicadas, más cuántos eventos y actividades hizo.
- **No** muestra las observaciones textuales: son devoluciones para la persona, pueden ser críticas y no se escribieron para terceros.
- **No** muestra señales de juegos: son hipótesis de la tesis (`docs/senales.md`), no prueba ante terceros.
- La persona crea el link y lo puede revocar; revocado, no muestra nada. La página no se indexa.

## Alternativas descartadas
- Mostrar todo el perfil: expone feedback privado y presenta señales como si fueran medición.
- Un PDF firmado en lugar de una página: no se puede revocar una vez enviado.

## Consecuencias
- Si más adelante se quiere mostrar una señal, primero tiene que dejar de ser hipótesis (validación en la tesis) y cambiar esta decisión.
