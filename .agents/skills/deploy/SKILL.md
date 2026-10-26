---
name: deploy
description: Para publicar TIM en producción. Se dispara con "subilo", "publicalo", "deployá", "que quede online", "mandalo a prod", "ya está, subilo", "¿ya está en la web?".
---

# Deploy

Publicar = push a `main`. Vercel deploya solo por la integración con GitHub. Lo hace el agente, nunca la persona. En este proyecto se pushea directo a `main`.

## Antes
1. Skill `verificar` completa y en verde.
2. Si hay migración nueva: aplicada a `tim-dev` y a `tim-prod` **antes** de pushear (skill `migracion`).
3. Si hay variable de entorno nueva: cargada en Vercel (`vercel env add <NOMBRE> production`) y sumada a `.env.example`.

## Publicar
```bash
git status                      # solo lo que corresponde
git add <archivos>
git commit -m "<qué cambia, en castellano>"
git push origin main
```
Nunca `git push --force` (el hook lo bloquea). Si `main` remoto avanzó: `git pull --rebase origin main`, resolver, verificar de nuevo, pushear.

## Esperar a que esté live
Preguntarle el estado a Vercel, **nunca un loop de curl a ciegas**:
```bash
vercel ls tim --prod | head -5            # la URL del deploy recién creado
vercel inspect <url-del-deploy> --wait --timeout 5m   # espera hasta READY o ERROR
```
- `READY`: seguir.
- `ERROR`: `vercel inspect <url> --logs`, encontrar la causa, arreglar, verificar, pushear de nuevo. No reportar nada como publicado.

## Recorrer en la URL live
Sobre la URL de producción (navegador, o `pnpm capturas` con `CAPTURAS_URL`):
- El flujo que cambió, de punta a punta, a 375 px.
- La landing carga y registra un evento (si se tocó la landing).
- Con datos `prueba-`, que se borran al terminar (`pnpm datos:limpiar` contra prod).

## Reportar
A la persona: "Ya está online en <URL>", qué cambió en una línea, y lo que quede pendiente. Sin jerga. Si algo no se pudo verificar en live, decirlo.

## Si producción se rompe
1. Volver al deploy anterior en el acto: `vercel rollback <url-del-deploy-anterior>`.
2. Después, buscar la causa con calma (agente `debugger`).
3. Si el problema es una migración, no se revierte borrando: se corrige con una migración nueva.
