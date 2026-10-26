import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { Vacio } from "@/components/org/ui";
import { Proyector } from "./proyector";

export const metadata: Metadata = { title: "QR de asistencia" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador/qr");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) return <Vacio>Primero creá el evento.</Vacio>;
  return <Proyector eventoId={evento.id} eventoNombre={evento.nombre} />;
}
