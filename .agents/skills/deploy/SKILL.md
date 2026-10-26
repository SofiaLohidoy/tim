---
name: deploy
description: Para publicar TIM en producción. Se dispara con "subilo", "publicalo", "deployá", "que quede online", "mandalo a prod", "ya está, subilo", "¿ya está en la web?".
---

# Deploy

Publicar = push a `main`. Lo hace el agente, nunca la persona. En este proyecto se pushea directo a `main`.

Cómo funciona por dentro (no hace falta tocarlo): cada push a `main` dispara la acción de GitHub `Publicar` (`.github/workflows/publicar.yml`), que le pide a Vercel que publique con un Deploy Hook. Así publica cualquiera que tenga acceso al repo, sin cuenta de Vercel. Vercel no publica solo por el push (`vercel.json`, `git.deploymentEnabled`).

## Antes
1. Skill `verificar` completa y en verde.
2. Si hay migración nueva: `pnpm migrar dev`, probar, y `pnpm migrar prod` **antes** de pushear (skill `migracion`).
3. Si hay una variable de entorno nueva: no se puede cargar sin acceso a Vercel. Avisale a Joaquín qué variable y para qué, y sumala a `.env.example`.

## Publicar
```bash
git status                      # solo lo que corresponde
git add <archivos>
git commit -m "<qué cambia, en castellano>"
git pull --rebase origin main   # por si alguien más subió algo
git push origin main
pnpm esperar-publicacion        # espera hasta que el commit esté live (máximo 10 min)
```
Nunca reescribir la historia de `main` ni forzar un push.

- `pnpm esperar-publicacion` termina con "Publicado: ... está live": seguir.
- Si falla: `gh run list -w Publicar -L 3` muestra si la acción corrió. Si la acción anduvo y igual no se publicó, el build falló en Vercel: corré `pnpm verificar` en local para ver el mismo error, arreglalo y publicá de nuevo. Si no se encuentra la causa, avisale a Joaquín con el mensaje de error.

## Recorrer en la URL live
Sobre https://tim-alpha-eight.vercel.app:
- El flujo que cambió, de punta a punta, a 375 px: `CAPTURAS_URL=https://tim-alpha-eight.vercel.app ENV_ARCHIVO=.env.prod pnpm capturas <rutas>` (`.env.prod` sale de `pnpm preparar prod`).
- Si hacen falta cuentas: `ENV_ARCHIVO=.env.prod pnpm datos:prueba` y al terminar `ENV_ARCHIVO=.env.prod pnpm datos:limpiar`. Nunca dejar datos `prueba-` en producción.

## Reportar
A la persona: "Ya está online en https://tim-alpha-eight.vercel.app", qué cambió en una línea, y lo que quede pendiente. Sin jerga. Si algo no se pudo verificar en live, decirlo.

## Si producción se rompe
1. Volver atrás el último cambio: `git revert <commit> && git push origin main && pnpm esperar-publicacion`.
2. Después, buscar la causa con calma.
3. Si el problema es una migración, no se revierte borrando: se corrige con una migración nueva.
