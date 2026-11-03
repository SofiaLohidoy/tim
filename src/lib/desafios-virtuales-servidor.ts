import "server-only";

// Hora de esta solicitud, sin caché. Solo orienta la pantalla: las RPC vuelven a
// verificar el plazo con el reloj de Postgres al guardar o enviar la entrega.
export async function horaSolicitudVirtual(){return Date.now();}
