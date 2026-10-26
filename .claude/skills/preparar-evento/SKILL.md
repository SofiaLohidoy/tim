---
name: preparar-evento
description: Para dejar lista una hackatón u otro evento presencial de TIM. Se dispara con "preparemos la hackatón", "armá el evento", "cargá los equipos", "invitá a los mentores", "sumá a los jurados", "hay que hacer el ensayo", "¿está todo listo para el sábado?", "cómo proyecto el QR", "¿qué hacemos si no hay wifi?".
---

# Preparar un evento

Todo se hace desde `/organizador` con una cuenta de organizador. Claude lo puede hacer por la persona en el navegador del panel, o guiarla pantalla por pantalla. Nada de SQL a mano salvo el primer organizador (`docs/puesta-en-marcha.md`, paso 7).

Fechas de la primera hackatón: datos de Sofía antes del mié 28/10, todo listo el jue 29/10, ensayo el vie 30/10, evento el sáb 31/10. 40 participantes, 8 equipos de 5, un mentor por equipo, unos 4 jurados.

## 1. Pedir lo que falta (una sola vez, todo junto)
A Sofía, por el canal del proyecto:
- Nombre, fecha y lugar del evento.
- Consigna del desafío (título y texto).
- Lista de equipos con los mails de sus integrantes, si ya están armados.
- Mentores y jurados: nombre, mail (preferentemente Gmail, entran con Google) y a qué equipos va cada uno.
- Confirmación de los textos de los 4 niveles de la rúbrica.

## 2. Cargar en `/organizador`
1. **Evento**: nombre, fecha, lugar. La rúbrica por defecto es la plantilla del Anexo 6.
2. **Desafío**: consigna, en borrador. Se publica al arrancar el evento.
3. **Equipos**: los 8, con nombre.
4. **Staff**: en `/organizador/personas`, crear una invitación por mentor y jurado (rol y equipo). Copiar el **link personal** de cada una y mandárselo (WhatsApp). Al abrirlo y entrar con ese mail, queda con el rol; con Google alcanza con entrar. Pedirles que lo hagan **antes** del evento y verificar en "Staff con rol" que figuran.
5. **Estudiantes**: si hay equipos armados, invitarlos por mail con su equipo; al registrarse caen directo ahí. Si no, se asignan el mismo día.

## 3. QR de asistencia
- `/organizador` → QR: se proyecta a pantalla completa en el lugar. El código rota solo; el anterior sirve 3 minutos más, para quien escaneó justo al cambio.
- El QR lleva a `/a/[codigo]`. Si la persona no tiene cuenta, se registra y vuelve sola.
- Probar el proyector y que se lea desde el fondo de la sala.
- Otro QR, impreso en la puerta, apunta a la landing con `?utm_source=hackaton` para el registro.

## 4. Ensayo (vie 30/10)
1. `pnpm datos:prueba` contra `tim-prod`: 8 cuentas `prueba-` de estudiante en equipos `prueba-`.
2. Los mentores reales entran desde **sus** celulares y evalúan a las cuentas de prueba. Probar también sin señal (modo avión): tiene que guardar en el teléfono y sincronizar al volver.
3. Un jurado evalúa un equipo de prueba.
4. El organizador prepara y publica las devoluciones de prueba. Un estudiante de prueba la abre y responde la encuesta.
5. Mirar el tablero en vivo: asistencia, pendientes, completitud.
6. **Borrar todo lo de prueba**: `pnpm datos:limpiar`. Confirmar con el tablero que quedó en cero. Las evaluaciones que los mentores reales cargaron sobre cuentas de prueba se borran con ellas.

## 5. Plan B en papel
Si se cae el wifi, Vercel o algo de la app:
- Imprimir **una rúbrica por persona y una por equipo** (las 5 dimensiones, los 4 niveles, espacio para observación) y llevarlas al lugar.
- Imprimir la lista de asistencia por equipo.
- Después del evento, el organizador carga lo del papel desde `/organizador`. Queda marcado como **carga diferida** (`evaluaciones.carga = 'diferida'`), así la tesis lo distingue.

## 6. El día
- Abrir el evento (estado `en_curso`) y publicar el desafío.
- Proyectar el QR. Mirar el tablero: ¿todos tienen asistencia?, ¿cada mentor ve a su equipo?
- Al final: evaluaciones pendientes por mentor y jurado. Avisar a quien falte.
- Cerrar el evento.

## 7. Después
- Preparar las devoluciones, revisarlas, **publicar**. Recién ahí el estudiante las ve; después ya no se editan evaluaciones.
- Skill `reporte-tesis` para los números.

## Antes de decir "listo para el evento"
- [ ] Staff completo y con rol visible en el tablero.
- [ ] Ensayo hecho con los mentores reales en sus celulares.
- [ ] Datos `prueba-` borrados (verificado en el tablero).
- [ ] Rúbricas impresas.
- [ ] Deploy live verificado (skill `deploy`).
