import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { actividad } from "@/lib/actividades/catalogo";
import type { EventoPartida } from "@/lib/actividades/tipos";
import { Juego } from "./juego";

export const metadata: Metadata = { title: "Actividad" };

export default function Pagina({ params }: PageProps<"/actividades/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <Link href="/actividades" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Actividades
      </Link>
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-3xl bg-muted" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<"/actividades/[slug]">["params"] }) {
  const { slug } = await params;
  const a = actividad(slug);
  if (!a) notFound();
  const u = await exigirUsuario(`/actividades/${slug}`);
  if (a.proximamente) return (
    <section className="mt-5 rounded-3xl bg-card p-6 ring-1 ring-border">
      <p className="text-sm font-semibold text-violeta-texto">Próximamente</p>
      <h1 className="mt-3 font-heading text-2xl font-bold">{a.tituloTentativo ?? a.titulo}</h1>
      <p className="mt-3 text-muted-foreground">Esta actividad todavía no está disponible para jugar.</p>
      <Link href="/actividades" className="mt-5 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Ver actividades disponibles</Link>
    </section>
  );
  const db = await clienteServidor();
  // Si quedó una partida en curso (se cerró la pestaña), se retoma donde estaba.
  const { data: enCurso } = await db
    .from("partidas")
    .select("id, eventos")
    .eq("usuario_id", u.id)
    .eq("actividad", slug)
    .eq("version", a.version)
    .eq("resultado", "en_curso")
    .order("iniciada_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  return <Juego actividad={a} partida={enCurso ? { id: enCurso.id, eventos: enCurso.eventos as unknown as EventoPartida[] } : null} />;
}
