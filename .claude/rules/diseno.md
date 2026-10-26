# Diseño

Criterio completo: skill `diseno-de-la-app`. Motion fino: skill `emil-design-eng`. Esto es lo que no se negocia.

## Mobile primero, de verdad
En la hackatón todo pasa en el celular. Se diseña a 375 px y después se agranda.
- **Estudiante: barra de navegación abajo**, fija, con `env(safe-area-inset-bottom)`.
- **Diálogos como hoja desde abajo** (`Sheet` con `side="bottom"`), que se cierra arrastrando. Nunca un modal centrado en el celular.
- **El teclado no tapa el botón.** Con el teclado abierto, el pie con la acción principal queda a la vista.
- Áreas táctiles de 44 px como mínimo.
- **Mentor**: la pantalla de evaluación está pensada para evaluar 5 personas en 10 minutos. Un toque por nivel, observación corta opcional, guardado solo.
- **Organizador**: se usa en compu y en celular. Tablas que en el celular pasan a lista.

## Listas y filas
- La fila entera abre el detalle.
- **Nada destructivo en las filas.** Borrar, quitar de un equipo o revocar va adentro del detalle, con confirmación.

## Marca (manual de TIM)
| Token | Color | Uso |
|---|---|---|
| Verde TIM | `#17483F` | Primario, títulos, barra |
| Violeta | `#8061EB` | Acento, CTA. **Para texto chico usar `#6A4AD9`** (contraste AA sobre crema y blanco) |
| Lila | `#AA8CFA` | Acentos secundarios, ilustración |
| Lila claro | `#E8DFFF` | Fondos de chips, estados seleccionados |
| Crema | `#FAF8F4` | Fondo general |
| Verde oscuro | `#102E28` | Texto principal, fondos oscuros |

- Tipografías: **Manrope** en títulos, **Inter** en texto. Nada de Montserrat ni Calibri (el Anexo 7 del BP las nombra, pero manda el manual).
- Los colores salen de los tokens de `src/app/globals.css` (`bg-violeta`, `text-violeta-texto`, `bg-lila-claro`, `text-verde-oscuro`...). No se escriben hex sueltos en los componentes. Fuentes: `font-heading` (Manrope) y `font-sans` (Inter).
- El isotipo es el ícono de la app.

## Motion
- Solo `transform` y `opacity` (y `grid-template-rows` para plegar).
- Las salidas un poco más rápidas que las entradas. Nunca un corte seco.
- Respeta `prefers-reduced-motion`: sin desplazamientos, a lo sumo un fundido.
- Lo que se ve cien veces por día no se anima.

## Antes de dar una pantalla por terminada
Mirarla a **375 px y 1280 px**, con datos realistas (`prueba-`), y recorrer el flujo de punta a punta. Contraste AA.
