import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import type { ContenidoDevolucion, Observacion } from "@/lib/devoluciones";
import { Encuesta, MarcarAbierta } from "./encuesta";

export const metadata: Metadata = { title: "Tu devolución" };

export default function Pagina() {
  return (
    <main className="mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
        <Contenido />
      </Suspense>
    </main>
  );
}

async function Contenido() {
  const u = await exigirUsuario("/devolucion");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  const [dev, encuesta] = await Promise.all([
    evento
      ? db.from("devoluciones").select("id, contenido, publicada_en").eq("evento_id", evento.id).eq("estudiante_id", u.id).maybeSingle()
      : null,
    evento
      ? db.from("respuestas_encuesta").select("id").eq("evento_id", evento.id).eq("encuesta", "post_devolucion").eq("usuario_id", u.id).maybeSingle()
      : null,
  ]);

  if (!evento || !dev?.data) {
    return (
      <div>
        <h1 className="text-[1.7rem] font-extrabold">Tu devolución</h1>
        <div className="mt-5 rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="font-heading text-lg font-bold">Todavía no está.</p>
          <p className="mt-1.5 text-muted-foreground">
            Mentores y jurados terminan de escribir lo que observaron. Cuando el equipo TIM la publique, aparece acá.
          </p>
        </div>
      </div>
    );
  }

  const c = dev.data.contenido as unknown as ContenidoDevolucion;
  return (
    <div className="grid gap-5">
      <MarcarAbierta id={dev.data.id} />
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">{evento.nombre}</p>
        <h1 className="mt-1.5 text-[1.9rem] leading-tight font-extrabold">Lo que observaron de vos</h1>
        <p className="mt-2 text-muted-foreground">
          Equipo {c.equipo}. Son señales de cómo trabajaste en este desafío, no una nota.
        </p>
      </header>

      {c.dimensiones.length === 0 && (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border text-muted-foreground">
          No llegaron observaciones para esta devolución.
        </div>
      )}

      {c.dimensiones.map((d) => (
        <section key={d.id} className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-lg font-extrabold">{d.nombre}</h2>
          <div className="mt-3 grid gap-3">
            {d.individual.map((o, i) => (
              <Bloque key={`i${i}`} titulo="Lo que vio tu mentor de vos" o={o} />
            ))}
            {d.equipo.map((o, i) => (
              <Bloque key={`e${i}`} titulo="Tu equipo, según el jurado" o={o} />
            ))}
          </div>
        </section>
      ))}

      {c.comentarios.length > 0 && (
        <section className="rounded-3xl bg-primary p-5 text-primary-foreground">
          <h2 className="text-lg font-extrabold">Para que te lleves</h2>
          {c.comentarios.map((x, i) => (
            <blockquote key={i} className="mt-3 border-l-2 border-lila pl-3 text-primary-foreground/90">
              {x.texto}
              <span className="mt-1 block text-xs text-primary-foreground/60">{x.quien === "mentor" ? "Tu mentor" : "El jurado"}</span>
            </blockquote>
          ))}
        </section>
      )}

      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Tres preguntas</p>
        <div className="mt-3">
          {encuesta?.data ? (
            <p className="text-muted-foreground">Ya respondiste. Gracias.</p>
          ) : (
            <Encuesta eventoId={evento.id} />
          )}
        </div>
      </section>
    </div>
  );
}

function Bloque({ titulo, o }: { titulo: string; o: Observacion }) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <p className="text-xs font-semibold text-muted-foreground">{titulo}</p>
      {o.nivel && (
        <p className="mt-1.5 flex items-center gap-2.5 font-semibold">
          <span className="inline-flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={`size-2.5 rounded-full ${o.orden && n <= o.orden ? "bg-violeta" : "bg-border"}`} />
            ))}
          </span>
          {o.nivel}
        </p>
      )}
      {o.obs && <p className="mt-1.5 text-[15px] text-foreground/80">“{o.obs}”</p>}
    </div>
  );
}
