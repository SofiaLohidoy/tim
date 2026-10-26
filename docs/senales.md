# Señales

**Estado: todavía no hay señales.** Llegan en la fase B, con las actividades virtuales (crucigrama, adivinar la palabra, acertijo de Einstein). Este archivo existe para que cada señal nazca con su regla escrita.

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
Ninguna todavía.
