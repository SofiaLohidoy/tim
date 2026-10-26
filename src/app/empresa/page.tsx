import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, ShieldCheck } from "lucide-react";
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
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card"><div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-4 px-5"><Link href="/" aria-label="TIM, inicio" className="text-primary"><Logo className="h-8 w-auto" /></Link><form action={salir}><Button type="submit" variant="ghost" className="min-h-11">Salir</Button></form></div></header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <p className="text-xs font-semibold tracking-widest text-violeta-texto uppercase">TIM para empresas</p>
        <h1 className="mt-3 max-w-2xl font-heading text-3xl font-extrabold sm:text-5xl">{empresa ? "Tu empresa ya está en TIM." : "Bienvenida a TIM."}</h1>
        <p className="mt-4 break-all text-sm text-muted-foreground">{u.email}</p>
        {typeof params.guardado === "string" && <p role="status" className="mt-6 rounded-xl bg-lila-claro px-4 py-3 font-semibold text-verde-oscuro">Tu perfil de empresa quedó guardado.</p>}
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
