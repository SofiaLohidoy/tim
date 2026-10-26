# CRO Patterns — Patrones universales de conversión para LaunchKit

> Base de conocimiento destilada de análisis de 30+ sitios referentes (Javy, AG1, Ridge, Hims, Dr. Squatch, Slack, Stripe, Canva, etc.), 25+ casos de estudio con datos reales, y benchmarks de industria 2024-2026.
>
> **Leer este archivo antes de:** generar landings, crear flujos de email, auditar un sitio, o construir un sitio web de cliente.
>
> **Archivos relacionados:**
> - `cro-knowledge-base.md` — Checklist operativa (~120 items) para evaluar un sitio. Leer cuando auditas.
> - `cro-audit-reference.md` — Scripts de PinchTab y procedimientos técnicos. Leer cuando ejecutas una auditoría.

---

## Los 12 patrones CRO universales

### 1. Trust stacking above-the-fold
**Regla:** mínimo 3 señales de confianza distintas antes del primer scroll.

Tipos de señales y cómo los mejores las combinan:
- **Logos de prensa/clientes:** Javy muestra 19+ logos (CNN, Fox News, Food Network) en marquee inmediatamente bajo hero. AG1 usa Hugh Jackman + Dr. Huberman.
- **Reviews con datos específicos:** "4.9/5 · 7,685 reviews" > "excelentes reseñas". Ridge tiene 80,000+ reviews visibles en PDP.
- **Garantía prominente:** Ridge: "99-DAY RISK-FREE TRIAL | LIFETIME GUARANTEE" en barra permanente en cada página. Javy menciona su garantía money-back al menos 3 veces en una sola landing.
- **Cifras de autoridad:** "100+ Million Happy Coffees Made", "1.9T procesados por Stripe", "50,000+ verified 5-star reviews" (AG1).

**Aplicación:** en landings y sitios web, la barra de trust (logos + reviews + garantía) va inmediatamente debajo del hero, no en el footer.

---

### 2. Subscription-first, one-time como escape
**Regla:** cuando hay modelo de suscripción, siempre presentar primero y más prominente. La compra única va como texto link más pequeño.

Javy en acción:
- CTA primario grande: "Subscribe & Save · 58% OFF · ~~$140.70~~ $53.90"
- CTA secundario texto: "👉 TRY IT ONCE - NO AUTOSHIP ($39.95)"

El ahorro siempre se calcula y muestra explícitamente. El precio tachado crea anclaje visual.

---

### 3. Tiered pricing con etiquetas de anclaje social
**Regla:** 3-4 tiers máximo. Siempre incluir una etiqueta social en el tier objetivo.

Ejemplo Javy (landing page dedicada):
| Cantidad | Precio/unidad | Etiqueta | Ahorro |
|----------|--------------|----------|--------|
| 4 bolsas | $23.95 | **BEST DEAL** | $44 |
| 3 bolsas | $24.95 | MOST POPULAR | $30 |
| 2 bolsas | $26.95 | — | — |
| 1 bolsa | $34.95 | — | — |

**En SaaS:** 90% de los referentes analizados usan badge "Most Popular" en el tier objetivo. Toggle anual/mensual con ahorro visible en el 80%.

Precio por sub-unidad visible siempre: "$79/mes para AG1" se reencuadra como "menos de $3/día".

---

### 4. Comparación cuantificada contra alternativas
**Regla:** comparar números específicos contra alternativas reales (no competidores directos genéricos).

Tácticas comprobadas:
- Javy vs. Starbucks: $1.25/porción vs. $5.25, <1g azúcar vs. 30.9g, 20g proteína vs. 2g
- AG1 vs. comprar suplementos por separado: $79/mes vs. $225/mes equivalente
- Casper: herramienta de comparación de colchones on-site para evitar que el usuario salga a Google
- Stripe: muestra que Stripe Checkout tuvo "conversion rates 8% higher" en A/B test de una semana

**Por qué funciona:** la comparación específica y cuantificada es infinitamente más persuasiva que "ahorrá dinero" genérico.

---

### 5. Eliminación específica de la objeción #1
**Regla:** identificar LA objeción principal de compra y eliminarla con una solución concreta — no genérica.

Cómo lo resuelven los referentes:
- Warby Parker: "no puedo probarlas" → AR Virtual Try-On + 5 marcos gratis a casa
- Casper: "no puedo probar el colchón" → 100 noches de prueba
- Ridge: "no entiendo cómo funciona" → página educativa dedicada para cold traffic (resultado: 20x en CTR, +15% conversión, $2.5M adicionales)
- Alo Yoga: "no sé si me quedará" → reviews filtrables por tipo de cuerpo y altura

**En auditorías:** identificar la objeción #1 (se descubre con encuestas a visitantes o análisis de chat de soporte) y verificar si está siendo eliminada explícitamente.

---

### 6. Quick-add sin navegación al PDP
**Regla:** permitir agregar al carrito desde grids de colección/homepage sin abrir la página de producto.

Javy, Ridge y otros implementan botones "Quick Add — $XX.XX" directamente en cada tarjeta de producto. Elimina un paso completo del funnel.

**Especialmente importante en mobile** donde cada tap adicional aumenta la tasa de abandono.

---

### 7. Gamificación de umbrales para AOV
**Regla:** usar un sistema de progreso visual que incentive agregar más al carrito de forma lúdica, no transaccional.

El sistema de Javy:
- Indicador "GIFTS UNLOCKED: 4/4" con umbrales progresivos
- 1+ bolsas = Recipe Booklet gratis + Free Shipping
- 2+ bolsas = Mystery Gift
- 3+ bolsas = Shaker Bottle
- Cada compra = entrada a sorteo diario de hoodie ($69.95)

**En emails:** presentar bundles y umbrales de regalo en lugar de solo descuentos. El objetivo es aumentar ticket promedio, no solo convertir.

---

### 8. Quiz-as-funnel para productos complejos
**Regla:** para productos que requieren diagnóstico (salud, nutrición, skincare, seguros, software), un quiz interactivo convierte mejor que una página de producto tradicional.

Hims convierte con quizzes de 8+ preguntas. Para cuando el usuario llega al checkout, está psicológicamente invertido. Hims: 2.2M+ suscriptores, 90%+ ingresos de suscripciones recurrentes.

Glossier y AG1 usan variantes similares. AG1 tiene variantes de homepage específicas para tráfico de podcasts específicos (Huberman, etc.).

---

### 9. Formularios con máximo 2 campos + OAuth social
**Regla (SaaS/servicios):** máximo 1-2 campos en el signup inicial. Google/social OAuth siempre disponible. Sin tarjeta de crédito para el tier free.

Datos de Baymard Institute: el checkout promedio tiene 23.48 elementos de formulario vs. los 12-14 ideales. Cada simplificación produce ganancias medibles.

- Formularios con ≤5 campos convierten **120% mejor** que formularios más largos
- Eliminar un campo de email junto al CTA: +25.5% en clics (Kommunicate × VWO)
- Reducir ancho de formulario + agregar copy de beneficios + testimonials en misma página: +52% en solicitudes de demo (Truckstop.com)

---

### 10. Urgencia respaldada en comportamiento real del cliente
**Regla:** la urgencia más poderosa se basa en miedos o deseos reales, no en countdowns genéricos.

Casos documentados:
- Bob & Lush encuestó 118 clientes → descubrió que el miedo a quedarse sin comida de mascota era la preocupación #1 → agregaron urgencia de entrega en PDP → **+27.1% ingresos, +9.5% conversión**
- daFlores: "Order in the next N hours for delivery today" → **+27% en pedidos**
- Urgencia genérica sin contexto puede ser contraproducente (Taloon.com mejoró +11.9% al ELIMINAR botones de social sharing, que son una "best practice" universal)

**En copy:** countdown timer solo cuando hay un evento real (fin de oferta, ventana de entrega). La urgencia fabricada destruye confianza si el contador se reinicia.

---

### 11. Reversión de riesgo prominente y repetida
**Regla:** la garantía no es un pie de página — es un elemento de venta principal que debe aparecer múltiples veces.

Cómo lo hacen los mejores:
- Javy: money-back mencionada al menos 3 veces en una landing
- CRE: money-back a 6 semanas como headline de sección
- Spiralyze: modelo pay-for-performance ("pago solo si hay mejora") como propuesta central
- Ridge: "99-DAY RISK-FREE TRIAL | LIFETIME GUARANTEE" en barra permanente en cada página

**Posicionamiento:** siempre cerca del CTA principal, en FAQ, y en el footer (mínimo).

---

### 12. Copy a nivel de lectura 5º-7º grado
**Regla:** simplificar el lenguaje aumenta conversión dramáticamente.

Dato: landing pages con copy a nivel 5º-7º grado convierten al **11.1%** vs. **5.3%** para copy universitario (Unbounce/Backlinko).

Principios de Javy:
- "Keep the Flavor, Skip the Sugar" (no: "contiene edulcorantes no calóricos")
- "Guilt-free indulgence" (no: "bajo en calorías")
- "Feel Your Best & Build Strength" (no: "contiene proteína de suero de leche")
- Framework problema-solución: *"Your current coffee is packed with sugar... that always ends up putting you in a depressing crash."* → solución

**Regla de CTA:** verbos de recibir > verbos de esfuerzo. "Conseguí" / "Obtené" / "Recibí" > "Reservá" / "Anotate" / "Completá".

---

## Benchmarks de conversión por industria (2024-2025)

| Vertical | Rango conversión | Nota |
|----------|-----------------|------|
| Food & Beverage | 4.6–6.0% | Líder en e-commerce |
| Beauty & Personal Care | 3.3–6.8% | Alta varianza |
| Fashion & Apparel | 1.9–2.7% | Presión de talla/fit |
| Electronics | 1.5–2.8% | Alta comparación de precios |
| Luxury | 0.9–1.0% | Intencional (exclusividad) |
| Tiendas Shopify promedio | 2.5–3.0% | Referencia general |
| Top performers cross-industria | 4.7%+ | Objetivo CRO avanzado |
| Amazon | 10–13% | Referencia extrema (intención de compra muy alta) |
| SaaS landing pages (mediana) | 3.8% | Dato Unbounce 2024 |
| Landing pages cross-industria | 6.6% | Promedio general |

---

## La brecha mobile — la mayor oportunidad CRO

- Mobile genera **70–78% del tráfico** e-commerce pero solo **40–50% de los ingresos**
- Desktop convierte a **3.9–4.8%**; mobile convierte a **1.2–2.9%** (aproximadamente la mitad)
- Abandono de carrito en mobile: **73–75%** vs. **65–68%** en desktop
- Sitios con Good Core Web Vitals: **24% más conversión móvil** que sitios con Poor Core Web Vitals
- Un retraso de solo **0.1 segundos** en load time → **+8.4% conversión** en retail (Deloitte/Google)

**Implicación para auditorías:** el delta mobile/desktop es el indicador más importante de potencial de optimización sin cambio de producto.

---

## Velocidad de página

| Dato | Fuente |
|------|--------|
| Cada segundo adicional de carga: −7% conversión | Industria |
| 1 segundo de carga = 3× más conversión que 5 segundos | Industria |
| Vodafone optimizó Core Web Vitals → +8% ventas | Caso real |
| eBay mejoró 0.1s → +0.5% Add to Cart | Caso real |
| Yelp optimizó FCP → +15% conversión | Caso real |

---

## Abandono de carrito

- Promedio global: **70.19%** (Baymard Institute, 50 estudios agregados)
- Cada razón de abandono es una oportunidad de optimización específica:

| Razón de abandono | % de usuarios que lo citan |
|-------------------|--------------------------|
| Costos extra inesperados (envío, impuestos) | 48% |
| Obligatorio crear cuenta | 26% |
| Preocupaciones de seguridad | 25% |
| Entrega muy lenta | 23% |
| Checkout largo o complicado | 22% |
| No ver costo total por adelantado | 21% |

Mejorar el diseño de checkout puede incrementar conversiones en **35.26%** (Baymard Institute).

---

## Casos de estudio: uplifts cuantificados

| Empresa | Cambio | Uplift |
|---------|--------|--------|
| Crazy Egg × CRE | Reescritura de homepage con lenguaje de clientes | +363% conversión |
| Ridge Wallet | Página educativa para cold traffic | 20x CTR, +15% conversión, $2.5M adicionales |
| Dr. Squatch × SplitBase | Cambiar cantidad predeterminada de 1 a 2 en PDP | +54% revenue per user |
| Dr. Squatch × SplitBase | Programa completo de optimización | +$800K/mes ($9.6M anualizados) |
| Moz × CRE | Landing 6x más larga con objeciones del pitch de ventas | +52% ventas, $1M anual adicional |
| Voices.com × CRE | Análisis de 510 encuestas + rediseño | +400% conversión |
| ADT UK × VWO | CTA "Book a Free Survey" → "Get a Free Quote" | +60% conversión |
| Walmart Canada | Rediseño responsive completo | +20% conversiones, +98% pedidos móviles |
| Bob & Lush × Speero | Urgencia de entrega en PDP (basada en encuesta) | +27.1% ingresos, +9.5% conversión |
| daFlores × CRE | Countdown "Order in next N hours" | +27% pedidos |
| Movexa × VWO | Una sola palabra agregada al headline | +90% ventas |
| Kommunicate × VWO | Eliminar campo email junto al CTA | +25.5% clics en CTA |
| Truckstop.com × VWO | Formulario simplificado + copy de beneficios | +52% solicitudes de demo |
| On (running) × Dynamic Yield | Personalización AI en PDPs | 348× ROI |
| Campaign Monitor × Unbounce | Dynamic Text Replacement en headline | +31.4% sign-ups de trial |

---

## Jerarquía de prueba social por efectividad

**E-commerce DTC:**
1. Video testimonials UGC con resultado específico
2. Reviews verificadas con nombre real + "Verified Buyer"
3. Conteo total con rating ("7,685 reviews · 4.9/5")
4. Logos de prensa/medios
5. Cifras de uso ("100M+ coffees made")

**SaaS:**
1. Métricas específicas de clientes ("6,700 horas ahorradas" — Uber en Gong)
2. Citas con nombre y cargo real
3. Logos enterprise reconocibles
4. Conteos de usuarios/clientes
5. Premios y certificaciones (Forrester Wave, G2)

**Agencias/servicios:**
1. Resultados cuantificados con nombre de cliente ("Vodafone +300%")
2. Testimonios con nombre/título/empresa
3. Validación de terceros (Clutch, G2, Gartner)
4. Logos de clientes bajo el hero
5. Metodología propia con nombre registrado (crea diferenciación)

---

## Patrones de copy para CTAs

| Contexto | Copy que funciona | Copy que no funciona |
|----------|------------------|---------------------|
| E-commerce principal | "Conseguí tu kit", "Obtené X% de descuento" | "Comprar ahora", "Agregar al carrito" |
| Suscripción | "Suscribite y ahorrá 58%" | "Subscribe" |
| Servicios/B2B | "Agendá tu sesión gratis" | "Contactanos", "Enviar mensaje" |
| SaaS free trial | "Empezar gratis", "Probá 14 días sin tarjeta" | "Registrarse", "Sign up" |
| CTA secundario | siempre texto link, más pequeño | mismo tamaño/jerarquía que CTA primario |

**Anclar el CTA secundario:** "Otros cobran $500 por esto" antes de "Agendá tu sesión gratis".

---

## Orden de secciones recomendado para landings

Para **e-commerce DTC:**
1. Hero: propuesta + trust bar (logos + reviews + garantía)
2. Urgencia/oferta (countdown o beneficio temporal)
3. Producto: beneficios sobre características
4. Prueba social específica (reviews con nombres reales)
5. Comparación contra alternativas (cuantificada)
6. Eliminación de objeción #1
7. CTA + Reversión de riesgo (garantía prominente)
8. FAQ (objeciones secundarias)
9. CTA final + trust bar repetida

Para **sitios de servicios/agencias:**
1. Hero: problema del cliente primero (no descripción de la empresa)
2. Logos de clientes/prensa (inmediatamente bajo hero)
3. Metodología/proceso
4. Casos de estudio con resultados cuantificados
5. Testimonios con nombre/cargo/empresa
6. CTA: consulta/demo gratis + anclaje de precio
7. FAQ
8. CTA final + garantía de riesgo-cero

---

## Frameworks de copy recomendados

**PAS (Problema → Agitación → Solución):**
> Mejor para: e-commerce, suplementos, productos lifestyle
> Ejemplo Javy: "Your current coffee is packed with sugar [Problema], high-calories, and artificial ingredients that always end up putting you in a depressing crash [Agitación]. [Producto] es la solución [Solución]."

**BAB (Before → After → Bridge):**
> Mejor para: servicios, SaaS, transformación
> "Antes de [producto], tu equipo perdía 6 horas por semana en [tarea]. Con [producto], ese tiempo se eliminó por completo. [Prueba: Uber reportó 6,700 horas ahorradas]."

**SPIN (Situation → Problem → Implication → Need-payoff):**
> Mejor para: ventas B2B, demos, páginas de consulta
> Útil para copy de landing pages de agencias y servicios complejos.
