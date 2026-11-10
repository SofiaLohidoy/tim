import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, ShieldCheck, FileText, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { exigirUsuario } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { salir } from "@/app/(auth)/acciones";
import { FormularioEmpresa } from "./formulario";

export const metadata: Metadata = { title: "Mi empresa" };

export default function Pagina({ searchParams }: PageProps<"/empresa">) {
  return <Suspense fallback={<main className="mx-auto max-w-4xl p-6"><p>Cargando tu empresa…</p></main>}><Contenido searchParams={searchParams} /></Suspense>;
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/empresa">["searchParams"] }) {
  const [u, params] = await Promise.all([exigirUsuario("/empresa"), searchParams]);
  const db = await clienteServidor();
  const { data: empresa, error } = await db.from("empresas").select("nombre,rubro,tamano").eq("usuario_id", u.id).maybeSingle();
  if (error) throw new Error("No pudimos cargar el perfil de empresa.");
  // La base limita la lista y el archivo a la empresa cuyo nombre coincide.
  const { data: informes, error: errorInformes } = await db.from("informes_empresa").select("id,titulo").order("creado_en", { ascending: false });
  if (errorInformes) throw new Error("No pudimos cargar tus devoluciones. Probá de nuevo.");
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card"><div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-4 px-5"><Link href="/" aria-label="TIM, inicio" className="text-primary"><Logo className="h-8 w-auto" /></Link><form action={salir}><Button type="submit" variant="ghost" className="min-h-11">Salir</Button></form></div></header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <p className="text-xs font-semibold tracking-widest text-violeta-texto uppercase">TIM para empresas</p>
        <h1 className="mt-3 max-w-2xl font-heading text-3xl font-extrabold sm:text-5xl">{empresa ? "Tu empresa ya está en TIM." : "Bienvenida a TIM."}</h1>
        <p className="mt-4 break-all text-sm text-muted-foreground">{u.email}</p>
        {typeof params.guardado === "string" && <p role="status" className="mt-6 rounded-xl bg-lila-claro px-4 py-3 font-semibold text-verde-oscuro">Tu perfil de empresa quedó guardado.</p>}
        {informes && informes.length > 0 && <section aria-label="Devoluciones para tu empresa" className="mt-8 grid gap-4">
          {informes.map((informe) => <article key={informe.id} className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <FileText className="size-7 text-violeta-texto" aria-hidden="true" />
            <p className="mt-4 text-xs font-semibold tracking-widest text-violeta-texto uppercase">TIM × {empresa?.nombre}</p>
            <h2 className="mt-2 font-heading text-2xl font-extrabold">{informe.titulo}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">El informe que preparamos para tu empresa, con los perfiles del equipo ganador y sus aportes durante la hackatón.</p>
            <a href={`/empresa/informes/${informe.id}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Ver devolución <ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </article>)}
        </section>}
        <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
          <FormularioEmpresa key={`${empresa?.nombre ?? "nuevo"}-${params.guardado ?? ""}`} empresa={empresa} />
          <aside className="grid gap-5 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
            <Building2 className="size-8 text-lila" aria-hidden="true" /><h2 className="font-heading text-2xl font-bold">El primer paso para conocer talento.</h2>
            <p className="text-primary-foreground/80">Desde acá podés completar y actualizar tu empresa. La exploración de perfiles y las solicitudes de contacto se habilitarán en una próxima etapa.</p>
            <div className="flex gap-3 border-t border-primary-foreground/20 pt-5"><ShieldCheck className="size-6 shrink-0 text-lila" aria-hidden="true" /><p className="text-sm text-primary-foreground/80">Los datos personales de cada participante se comparten con su consentimiento.</p></div>
            <Link href="/empresas" className="flex min-h-11 items-center font-semibold underline underline-offset-4">Conocé la propuesta para empresas</Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
