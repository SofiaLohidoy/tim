import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { estadoDelEvento } from "@/lib/organizador";
import { rubricaDelEvento } from "@/lib/rubrica";
import { dimensionesPara } from "@/lib/devoluciones";
import { Vacio } from "@/components/org/ui";
import { BotonImprimir } from "./boton";

export const metadata: Metadata = { title: "Rúbrica impresa" };

// Plan B sin wifi: la misma rúbrica en papel, una hoja por equipo para el mentor y una para el
// jurado. Después el organizador la carga en Devoluciones → carga diferida.
export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador/imprimir");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) return <Vacio>Primero creá el evento.</Vacio>;
  const [e, rubrica] = await Promise.all([estadoDelEvento(db, evento.id), rubricaDelEvento(db, evento.rubrica_id)]);
  if (!rubrica) return <Vacio>El evento no tiene rúbrica.</Vacio>;
  const niveles = rubrica.niveles;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-muted-foreground">Una hoja por equipo para el mentor (personas) y otra para el jurado (equipo).</p>
        <BotonImprimir />
      </div>
      {e.equipos.map((q) => {
        const miembros = e.miembros.filter((m) => m.equipo_id === q.id).map((m) => e.persona.get(m.usuario_id)?.nombre ?? "");
        const mentor = e.asignaciones.find((a) => a.equipo_id === q.id && a.rol === "mentor");
        return (
          <div key={q.id} className="grid gap-6">
            <Hoja titulo={`${q.nombre} · Mentor${mentor ? `: ${e.persona.get(mentor.evaluador_id)?.nombre}` : ""}`} evento={evento.nombre}>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="border border-black/40 p-1 text-left">Persona</th>
                    {dimensionesPara("mentor", rubrica.dimensiones).map((d) => (
                      <th key={d.id} className="border border-black/40 p-1 text-left">{d.nombre}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(miembros.length ? miembros : ["", "", "", "", ""]).map((m, i) => (
                    <tr key={i}>
                      <td className="h-16 border border-black/40 p-1 align-top font-semibold">{m}</td>
                      {dimensionesPara("mentor", rubrica.dimensiones).map((d) => (
                        <td key={d.id} className="border border-black/40 p-1 align-top">
                          <Casillas n={niveles.length} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <Leyenda niveles={niveles.map((n) => n.nombre)} />
            </Hoja>
            <Hoja titulo={`${q.nombre} · Jurado`} evento={evento.nombre}>
              <table className="w-full border-collapse text-[11px]">
                <tbody>
                  {dimensionesPara("jurado", rubrica.dimensiones).map((d) => (
                    <tr key={d.id}>
                      <td className="w-1/3 border border-black/40 p-1.5 align-top">
                        <b>{d.nombre}</b>
                        <br />
                        {d.que_observar}
                      </td>
                      <td className="border border-black/40 p-1.5 align-top">
                        <Casillas n={niveles.length} />
                        <div className="mt-6 border-b border-black/30" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Leyenda niveles={niveles.map((n) => n.nombre)} />
            </Hoja>
          </div>
        );
      })}
    </div>
  );
}

function Hoja({ titulo, evento, children }: { titulo: string; evento: string; children: React.ReactNode }) {
  return (
    <section className="break-after-page rounded-2xl bg-white p-6 text-black ring-1 ring-border print:rounded-none print:p-0 print:ring-0">
      <p className="text-[10px] tracking-widest uppercase">TIM · {evento} · Rúbrica en papel</p>
      <h2 className="mt-1 mb-3 text-lg font-extrabold">{titulo}</h2>
      {children}
      <p className="mt-3 text-[10px]">Evaluador: ______________________ · Marcá un nivel por casillero y anotá un hecho concreto.</p>
    </section>
  );
}

function Casillas({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-1.5">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="inline-grid size-4 place-items-center border border-black/60 text-[8px]">{i + 1}</span>
      ))}
    </span>
  );
}

function Leyenda({ niveles }: { niveles: string[] }) {
  return <p className="mt-2 text-[10px]">Niveles: {niveles.map((n, i) => `${i + 1} = ${n}`).join(" · ")}</p>;
}
