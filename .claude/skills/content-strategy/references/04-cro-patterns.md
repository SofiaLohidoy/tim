# Referencia 04 — Patrones CRO, con naturaleza (y cuáles son tóxicos)

> Aplicá el patrón que corresponde a la naturaleza del proyecto (Paso 0). Un patrón de DTC
> volcado crudo sobre alta confianza no es neutro: **es contraproducente.** Tags: [DTC]
> [Serv] (servicios/B2B) [AC] (alta confianza).

## Patrones que aplican casi siempre

- **Trust stacking above-the-fold** [DTC][Serv][AC] — mínimo 3 señales de confianza distintas
  antes del primer scroll (logos + prueba de resultado + garantía/sello). La barra de trust
  va bajo el hero, no en el footer. **Cuentan solo señales CONFIRMADAS/publicables hoy:** las
  que estén PENDIENTE no suman al mínimo de 3, y la sección no es shippable hasta resolverlas.
- **Prueba pegada al claim** [DTC][Serv][AC] — toda afirmación con su evidencia en la misma
  sección.
- **Reversión de riesgo prominente y repetida** [DTC][Serv][AC] — la garantía no es pie de
  página; es elemento de venta, cerca del CTA, en FAQ y al cierre. En servicios/AC, un modelo
  "pagás solo por resultado" es *propuesta central*, no letra chica.
- **Copy nivel de lectura simple** [DTC][Serv][AC] — ~2x conversión vs copy complejo.
- **Comparación cuantificada vs alternativas** [DTC][Serv] — números específicos, no "ahorrá
  dinero". En AC, comparar con cuidado (evitar sonar agresivo con la competencia).
- **Eliminación de la objeción #1** [DTC][Serv][AC] — identificá LA objeción y disolvela
  explícita y concreta.

## Patrones de social proof por naturaleza

- **DTC:** video UGC con resultado > reviews con nombre > conteo + rating > logos de prensa.
- **Serv:** resultado cuantificado con nombre de cliente > testimonio con cargo/empresa >
  validación de terceros > logos > metodología con nombre propio.
- **AC:** premios/certificaciones de autoridad > estructura real (oficina/equipo/personas) >
  sellos de seguridad > casos. (Los testimonios pueden no estar disponibles por
  confidencialidad — no inventes; apoyate en premios y estructura.)

## Patrones SOLO-DTC (no los uses fuera de DTC)

- Subscription-first, tiered pricing con "más popular", quick-add sin PDP, gamificación de
  umbrales para AOV, precio por sub-unidad ("menos de $3/día"). Son de e-commerce transaccional.

## ⚠️ Tóxicos si se aplican mal — la lista negra de alta confianza

En finanzas, salud, legal, seguros y **cobranzas**, estos "best practices" de DTC **destruyen
confianza**:

- **Urgencia / escasez / countdown / "quedan 3" / "solo hoy".** El lector de AC ya llega con
  miedo a que sea una estafa; la urgencia lo confirma. **OFF.**
- **Descuentos y ofertas agresivas.** Leen como poco serio.
- **Pop-ups de "dejá tu email a cambio de un descuento".** Fuera de lugar.
- **Superlativos sin prueba** ("los mejores", "líderes indiscutidos"). En AC, cada claim
  necesita respaldo verificable o resta.

Regla: en alta confianza, **cada elemento suma o resta legitimidad.** Ante la duda, el que
construye confianza gana al que empuja la conversión.

## Benchmarks (para justificar decisiones, no para copiar)

> Son **órdenes de magnitud / heurísticas de industria** para justificar decisiones
> **internas** — no para citarle números duros a un cliente como si fueran su dato.

| Contexto | Referencia |
|---|---|
| Landing services/B2B (mediana) | ~3.8% conversión |
| Trust signals above-the-fold | mínimo 3 |
| Copy simple vs complejo | ~11% vs ~5% conversión |
| Formularios ≤5 campos | +120% vs formularios largos |
| Mobile | 70-78% del tráfico; cerrar la brecha de conversión es la mayor oportunidad |

Detalle profundo (los 12 patrones con casos y datos, jerarquías completas, uplifts
documentados): `references/appendix-cro-full.md`.
