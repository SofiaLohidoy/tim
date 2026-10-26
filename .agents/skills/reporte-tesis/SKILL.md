---
name: reporte-tesis
description: Para sacar los números de TIM para la tesis o para una reunión. Se dispara con "¿cómo vienen los números?", "cuántos se anotaron", "qué variante convierte más", "pasame el CSV", "datos para la tesis", "¿cuántos vinieron a la hackatón?", "¿se completaron las evaluaciones?", "¿llegamos a los criterios del BP?", "armá el reporte".
---

# Reporte para la tesis

Dos fuentes: el export CSV desde `/organizador` (lo que Sofía puede bajar sola) y consultas de lectura que hace el agente. Siempre sobre `tim-prod`, **excluyendo todo lo `prueba-`**. Nunca se presentan datos de prueba como reales.

## 1. Interés (landing)
Desde `interesados` y `eventos_landing`. La función `resumen_landing(desde)` ya devuelve casi todo agregado (es lo que usa el panel del organizador):
- **Interesados por audiencia** (estudiante / empresa).
- **Por origen** (`origen`: utm, QR de la hackatón, directo).
- **Por variante** del título (`a` / `b`): visitantes únicos, clics en CTA, formularios iniciados, terminados y con error. Conversión = interesados / visitantes únicos de esa variante.
- **Embudo**: visita → sección vista → clic en CTA → form iniciado → form terminado.
- Del lado estudiante: distribución de arquetipos declarados. Del lado empresa: tamaño, rubro y "¿propondrías un desafío?".

Una diferencia entre variantes con pocos visitantes no es concluyente. Decí el n de cada una y no declares ganadora con menos de unos cientos por variante.

## 2. Piloto (hackatón)
- **Asistencia**: estudiantes con asistencia / inscriptos al evento. Separar `qr` y `organizador`.
- **Completitud de evaluaciones**: evaluaciones `enviada` / evaluaciones esperadas (cada mentor × integrantes de su equipo + cada jurado × sus equipos). Separar carga `directa` y `diferida`.
- **Devoluciones**: publicadas, abiertas (`abierta_en`), tiempo hasta abrirla.
- **Encuesta post devolución**: ¿te sirvió?, ¿querés seguir sumando evidencia?, ¿la compartirías con una empresa?
- Distribución de niveles por dimensión. **Nunca promedios** (ver `docs/decisiones/004-niveles-sin-puntaje.md`).

## 3. Criterios del BP
| Criterio | Umbral | De dónde |
|---|---|---|
| Asistencia | ≥ 70 % | `asistencias` / inscriptos |
| Completitud de evaluaciones | ≥ 80 % | `evaluaciones` enviadas / esperadas |
| Cambio de evaluación (CV vs. evidencia) | ≥ 25 %, o al menos 1 rescatado | Experimento de la fase D. Hasta entonces: "todavía no medible". |

Para cada uno: valor, umbral, si se cumple, y el n.

## 4. Cómo se consulta
- Lectura nada más. Con el organizador logueado (RLS) o con la clave secreta desde un script local que **no** se commitea con resultados.
- Excluir prueba: `where email not ilike 'prueba-%'` (y por perfil, en las tablas que cuelgan de una persona).
- Para landing, `visitante_id` cuenta visitantes, no personas.

## 5. Entregar
- Un resumen corto en castellano llano: los números clave, si se cumplen los criterios, y qué no se puede afirmar todavía.
- Si es largo, a `docs/reportes/AAAA-MM-DD-<tema>.md`.
- Los CSV con mails o datos personales **no** van al repo. Se le pasan a Sofía por un canal privado.
- Las señales (fase B) se reportan como señales, con su regla de `docs/senales.md`, nunca como medición validada.
