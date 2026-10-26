# 001 — Supabase y no Neon

Fecha: 25/10/2026 · Estado: aceptada

## Contexto
TIM necesita base relacional, login (mail y Google), almacenamiento de archivos privados (CV) y reglas de acceso por rol. Todo gratis y transferible a la cuenta de Sofía.

## Decisión
Supabase: Postgres + Auth + Storage + RLS en un solo servicio. Dos proyectos en la cuenta de Sofía: `tim-dev` y `tim-prod`.

## Alternativas descartadas
- **Neon** (lo que usa el admin de Programon): es solo base. Faltan Auth y Storage, que habría que sumar con otros dos servicios y otras dos cuentas para transferir.
- **Netlify**: hosting, no resuelve la base.

## Consecuencias
- El Free pausa tras 7 días sin actividad: hace falta el cron diario `/api/cron/salud`.
- 2 proyectos activos por owner: no hay lugar para un tercero sin pausar otro.
- La seguridad vive en la RLS. Cada tabla nueva lleva policies desde la migración que la crea.
