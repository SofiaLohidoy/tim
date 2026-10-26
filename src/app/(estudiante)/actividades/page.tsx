import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Brain, Clock, Grid3x3, SpellCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";
import { ACTIVIDADES } from "@/lib/actividades/catalogo";
import type { Tipo } from "@/lib/actividades/tipos";

export const metadata: Metadata = { title: "Actividades" };

const TIEMPOS = [5, 15, 30] as const;
const ICONO: Record<Tipo, typeof Brain> = { palabra: SpellCheck, crucigrama: Grid3x3, einstein: Brain };
const RESULTADO: Record<string, string> = { resuelta: "Resuelta", no_resuelta: "Sin resolver", abandonada: "La dejaste", en_curso: "En curso" };

export default function Pagina({ searchParams }: PageProps<"/actividades">) {
  return (
    <main className="mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Actividades</p>
        <h1 className="mt-1.5 text-[1.9rem] leading-tight font-extrabold">¿Cuánto tiempo tenés?</h1>
        <p className="mt-2 text-muted-foreground">Juegos cortos que suman señales a tu perfil: cómo encarás un problema, no solo si acertás.</p>
      </header>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted" />}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Lista({ searchParams }: { searchParams: PageProps<"/actividades">["searchParams"] }) {
  const [u, params] = await Promise.all([exigirUsuario("/actividades"), searchParams]);
  const tengo = TIEMPOS.find((t) => String(t) === params.min) ?? null;
  const db = await clienteServidor();
  const { data } = await db.from("partidas").select("actividad, resultado, iniciada_en").eq("usuario_id", u.id).order("iniciada_en", { ascending: false });
  const ultima = new Map<string, string>();
  for (const p of data ?? []) if (!ultima.has(p.actividad)) ultima.set(p.actividad, p.resultado);
  const lista = ACTIVIDADES.filter((a) => !tengo || a.minutos <= tengo);

  return (
    <>
      <nav aria-label="Tiempo disponible" className="mt-5 flex gap-2">
        {[null, ...TIEMPOS].map((t) => (
          <Link
            key={t ?? "todas"}
            href={t ? `/actividades?min=${t}` : "/actividades"}
            aria-current={tengo === t ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold ring-1 ring-border transition-colors ring-inset",
              tengo === t ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-foreground/80",
            )}
          >
            {t ? `${t} min` : "Todas"}
          </Link>
        ))}
      </nav>
      <ul className="mt-5 grid gap-3">
        {lista.map((a) => {
          const Icono = ICONO[a.tipo];
          const r = ultima.get(a.slug);
          return (
            <li key={a.slug}>
              <Link href={`/actividades/${a.slug}`} className="flex gap-4 rounded-3xl bg-card p-4 ring-1 ring-border transition-transform active:scale-[0.99]">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lila-claro text-violeta-texto">
                  <Icono className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-[17px] font-bold leading-snug">{a.titulo}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{a.descripcion}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {a.minutos} min</span>
                    {r && <span className={cn("rounded-full px-2 py-0.5", r === "resuelta" ? "bg-primary text-primary-foreground" : "bg-muted")}>{RESULTADO[r]}</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
