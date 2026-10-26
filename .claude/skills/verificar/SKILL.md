---
name: verificar
description: Para probar que TIM anda antes de decir "listo" o de publicar. Se dispara con "fijate si anda", "probalo", "¿está bien?", "verificá", "¿se rompió algo?", "antes de subirlo revisá", y siempre antes de la skill deploy.
---

# Verificar

Nada se da por terminado sin esto. Lo corre Claude; a la persona se le cuenta el resultado.

## 1. Parar el dev server
`pnpm verificar` hace `next build`, que pisa `.next` y rompe un `next dev` levantado. Si hay preview corriendo, pararlo con `preview_stop` antes.

## 2. Chequeos automáticos
```bash
pnpm verificar      # tipos + lint + Vitest + build. Tiene que quedar en verde.
pnpm test:rls       # policies por rol contra la base local (supabase start + db reset antes)
pnpm e2e            # Playwright sobre los flujos: registro, asistencia, evaluación de mentor, publicación
```
Si algo falla: arreglar la causa, no el síntoma. No se apaga un test ni una regla de lint para pasar.

## 3. Mirarlo de verdad
Levantar el preview (`preview_start` con `tim`) y, en el navegador del panel:
- Cada pantalla tocada a **375 px** (`resize_window` preset `mobile`) y a **1280 px**. Volver a `desktop` al terminar.
- Recorrer el flujo de punta a punta con cuentas `prueba-` (`pnpm datos:prueba`): tipear, elegir, guardar, cancelar, error.
- Revisar la consola (`read_console_messages`, solo errores).
- Checklist de `diseno-de-la-app`: rótulos en una línea, nada desborda, nada de relleno, nada destructivo en filas, contraste AA.
- Si el navegador del panel está oculto, las animaciones no corren: verificar con `getComputedStyle`.

## 4. Permisos, mirados con otro rol
Si el cambio toca datos: entrar con una cuenta `prueba-` de **otro** rol y confirmar que no ve lo que no debe (otro equipo, una devolución sin publicar, el CV ajeno).

## 5. Limpiar
`pnpm datos:limpiar` si se usó una base remota. En local da igual.

## 6. Reportar
En una o dos líneas: qué se verificó y cómo quedó. Si algo no se pudo verificar (por ejemplo, Google en local), decirlo explícito. Nunca "listo" sin haber pasado por 2 y 3.
