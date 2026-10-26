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
