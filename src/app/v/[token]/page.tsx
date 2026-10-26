import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/marca";
import { clienteServidor } from "@/lib/supabase/servidor";
import { fechaLarga } from "@/lib/eventos";
import { nivelesIndividuales } from "@/lib/perfil";
import type { ContenidoDevolucion } from "@/lib/devoluciones";

// Página pública de la credencial: la abre quien escanea el QR que compartió la persona.
// Muestra solo evidencia observada por mentores y jurados, y cuánto jugó. Sin observaciones
// textuales ni señales de juegos (migración 011).
export const metadata: Metadata = { title: "Credencial verificada", robots: { index: false, follow: false } };

type Publica = {
  nombre: string;
  universidad: string | null;
  carrera: string | null;
  emitida: string;
  eventos: { evento: string; fecha: string; contenido: ContenidoDevolucion }[];
  asistencias: number;
  partidas: number;
  resueltas: number;
};

export default function Pagina({ params }: PageProps<"/v/[token]">) {
  return (
    <main className="min-h-dvh bg-background">
      <Suspense fallback={<div className="mx-auto mt-10 h-96 max-w-md animate-pulse rounded-3xl bg-muted" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<"/v/[token]">["params"] }) {
  const { token } = await params;
  const db = await clienteServidor();
  const valido = z.uuid().safeParse(token).success;
  const { data } = valido ? await db.rpc("credencial_publica", { p_token: token }) : { data: null };
  const c = data as Publica | null;

  if (!c) {
    return (
      <div className="mx-auto grid max-w-md gap-4 px-5 py-16 text-center">
        <Logo className="mx-auto h-8 w-auto text-primary" />
        <h1 className="text-2xl font-extrabold">Esta credencial no está disponible.</h1>
        <p className="text-muted-foreground">El link no existe o la persona lo revocó.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-md gap-4 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-12">
      <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <Logo className="h-6 w-auto" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <BadgeCheck className="size-4 text-lila-texto" /> Verificada por TIM
          </span>
        </div>
        <h1 className="mt-6 text-[2rem] leading-tight font-extrabold">{c.nombre || "Perfil TIM"}</h1>
        {(c.carrera || c.universidad) && <p className="mt-1 text-primary-foreground/80">{[c.carrera, c.universidad].filter(Boolean).join(" · ")}</p>}
        <p className="mt-4 text-xs text-primary-foreground/60">Emitida el {fechaLarga(c.emitida.slice(0, 10))}</p>
      </section>

      <section className="grid grid-cols-3 gap-2 text-center">
        {[
          [c.asistencias, c.asistencias === 1 ? "evento presencial" : "eventos presenciales"],
          [c.partidas, "actividades jugadas"],
          [c.resueltas, "resueltas"],
        ].map(([n, t]) => (
          <div key={String(t)} className="rounded-2xl bg-card py-3 ring-1 ring-border">
            <p className="font-heading text-2xl font-extrabold tabular-nums">{n}</p>
            <p className="px-1 text-xs text-muted-foreground">{t}</p>
          </div>
        ))}
      </section>

      {c.eventos.map((ev) => (
        <section key={ev.evento + ev.fecha} className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">{fechaLarga(ev.fecha)}</p>
          <h2 className="mt-1 text-xl font-extrabold">{ev.evento}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Observado por su mentor y el jurado con la rúbrica de TIM.</p>
          <ul className="mt-3 grid gap-2">
            {nivelesIndividuales(ev.contenido).map((x) => (
              <li key={x.dimension} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-sm">
                <span className="font-semibold">{x.dimension}</span>
                <span className="inline-flex shrink-0 items-center gap-2">
                  <span className="inline-flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((n) => <i key={n} className={`size-2 rounded-full ${n <= x.orden ? "bg-violeta" : "bg-border"}`} />)}
                  </span>
                  {x.nivel}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="px-2 text-center text-xs text-muted-foreground">
        Los niveles describen lo que se observó en un desafío; no son una nota. La persona eligió compartir este link y puede revocarlo.{" "}
        <Link href="/" className="underline underline-offset-2">Qué es TIM</Link>
      </p>
    </div>
  );
}
