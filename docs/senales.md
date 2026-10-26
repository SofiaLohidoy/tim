# Señales

**Estado: 3 señales (regla `v1-2026-10-26`)**, calculadas en las actividades virtuales de la fase B: adivinar la palabra, mini crucigramas y acertijos de Einstein. Código: `src/lib/actividades/senales.ts`.

## Qué es una señal
Algo que se deriva del proceso de una partida (tiempos, intentos, pistas, correcciones, abandono) con una regla explícita. Por ejemplo: "persistencia: reintenta después de un error".

Una señal es una **hipótesis** de la tesis, no una medición validada. Por eso:
- En la UI se llama **señal**. Nunca "medición", "puntaje", "score" ni "nivel de habilidad".
- Nunca se promedia con la rúbrica de un evento ni se presenta como nota.
- Cada señal dice qué observa y qué **no** puede afirmar.

## Formato de cada regla
Cada señal se agrega acá, con este formato, en el mismo cambio que la implementa (skill `nueva-actividad`):

```md
### <nombre de la señal>
- Actividades: <en qué juegos se calcula>
- Qué observa: <una oración>
- Datos de la partida que usa: <campos de `partidas.eventos`>
- Regla: <cálculo exacto, con umbrales>
- Qué NO dice: <el límite honesto>
- Cómo se muestra: <texto en la UI>
- Test: <archivo del test con partidas de ejemplo>
- Desde: <fecha> · Cambios: <fecha y motivo>
```

Si una regla cambia, no se pisa: se anota el cambio con fecha, porque las señales viejas se calcularon con la regla vieja.

## Señales

### Persistencia
- Actividades: todas.
- Qué observa: si después de equivocarse la persona sigue intentando, y si llega a resolverlo.
- Datos de la partida que usa: eventos `intento` (con `acierto`), `comprobar` (con `errores`), y el `resultado`.
- Regla: un error es un intento fallido o una comprobación con al menos un casillero mal. Si no hubo errores, no hay señal. Si hubo: **1** si la partida terminó resuelta; **0,5** si hubo al menos una jugada más después del primer error pero no la resolvió; **0** si no hubo ninguna jugada después del primer error.
- Qué NO dice: no distingue abandonar por frustración de abandonar porque se terminó el tiempo o sonó el celular. Una partida sola dice muy poco: cuenta la tendencia en varias.
- Cómo se muestra: "Te equivocaste y seguiste hasta resolverlo." / "Después de un error seguiste intentando." / "Después del primer error dejaste la partida."
- Test: `src/lib/__tests__/senales.test.ts`.
- Desde: 26/10/2026.

### Uso de la información
- Actividades: adivinar la palabra.
- Qué observa: si cada intento tiene en cuenta lo que dijeron los intentos anteriores (letras que están, que no están, y dónde).
- Datos de la partida que usa: eventos `intento` (palabra y marcas) y `pista`.
- Regla: desde el segundo intento, se cuenta cuántos podrían ser la respuesta según todas las marcas anteriores. Valor = consistentes / evaluados. Con un solo intento, no hay señal. Las pistas pedidas se guardan en el detalle, no cambian el valor.
- Qué NO dice: un intento "inconsistente" puede ser una estrategia válida (probar letras nuevas a propósito). No mide vocabulario.
- Cómo se muestra: "N de M intentos tuvieron en cuenta lo que ya sabías."
- Test: `src/lib/__tests__/senales.test.ts`.
- Desde: 26/10/2026.

### Autocorrección
- Actividades: mini crucigramas y acertijos de Einstein.
- Qué observa: si después de comprobar y ver que hay errores, la persona los reduce.
- Datos de la partida que usa: eventos `comprobar` (cantidad de `errores`).
- Regla: se miran las comprobaciones consecutivas en las que la primera tenía errores. Valor = veces que la siguiente tuvo menos errores / esos pares. Sin pares, no hay señal.
- Qué NO dice: no sabe si corrigió razonando o probando al azar. En el acertijo, la comprobación dice cuántos casilleros están mal pero no cuáles.
- Cómo se muestra: "Después de comprobar con errores, corregiste N de M veces."
- Test: `src/lib/__tests__/senales.test.ts`.
- Desde: 26/10/2026.
