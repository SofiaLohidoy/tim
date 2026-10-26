import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { equiposAsignados, misEvaluaciones } from "@/lib/staff";

export const metadata: Metadata = { title: "Mentor" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const u = await exigirRol("mentor", "/mentor");
  const db = await clienteServidor();
  const equipos = await equiposAsignados(db, u.id, "mentor");
  const evals = await misEvaluaciones(db, u.id, equipos.map((e) => e.id));

  return (
    <div className="grid gap-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Mentor</p>
        <h1 className="mt-1 text-[1.7rem] leading-tight font-extrabold">Hola, {u.nombre ?? "mentor"}</h1>
        <p className="mt-1 text-muted-foreground">Observá a cada persona de tu equipo con la rúbrica. Se guarda sola.</p>
      </header>
      {equipos.length === 0 && (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="font-heading text-lg font-bold">Todavía no tenés un equipo asignado.</p>
          <p className="mt-1 text-muted-foreground">El equipo TIM te lo asigna antes de que arranque el desafío.</p>
        </div>
      )}
      {equipos.map((e) => {
        const enviadas = e.miembros.filter((m) => evals.get(`${e.id}:${m.id}`)?.estado === "enviada").length;
        return (
          <Link key={e.id} href={`/mentor/${e.id}`} className="flex items-center gap-4 rounded-3xl bg-card p-5 ring-1 ring-border transition-transform active:scale-[0.99]">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{e.eventoNombre}</p>
              <h2 className="text-xl font-extrabold">{e.nombre}</h2>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {enviadas} de {e.miembros.length} personas evaluadas
              </p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
