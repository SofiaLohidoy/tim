import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario, nombreVisible } from "@/lib/sesion";
import { PUNTO_DE_PARTIDA, type Arquetipo } from "@/lib/arquetipo";
import { salir } from "@/app/(auth)/acciones";
import { SubirCv } from "../inicio/piezas";

export const metadata: Metadata = { title: "Perfil" };

const VISTAS = [
  { rol: "organizador", href: "/organizador", texto: "Panel de organización" },
  { rol: "mentor", href: "/mentor", texto: "Vista de mentor" },
  { rol: "jurado", href: "/jurado", texto: "Vista de jurado" },
] as const;

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
  const u = await exigirUsuario("/perfil");
  const db = await clienteServidor();
  const { data: e } = await db
    .from("estudiantes")
    .select("universidad, carrera, anio_carrera, intereses, arquetipo, cv_path")
    .eq("usuario_id", u.id)
    .maybeSingle();
  const partida = e?.arquetipo ? PUNTO_DE_PARTIDA[e.arquetipo as Arquetipo] : null;

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-[1.7rem] leading-tight font-extrabold">{nombreVisible(u)}</h1>
        <p className="text-muted-foreground">{u.email}</p>
      </header>

      {e && (
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <dl className="grid gap-3 text-[15px]">
            <Dato t="Universidad" v={e.universidad} />
            <Dato t="Carrera" v={[e.carrera, e.anio_carrera].filter(Boolean).join(" · ")} />
            <Dato t="Áreas que te interesan" v={e.intereses.join(", ")} />
          </dl>
        </section>
      )}

      {partida && (
        <section className="rounded-3xl bg-primary p-5 text-primary-foreground">
          <p className="text-xs font-semibold tracking-[0.14em] text-lila uppercase">Tu punto de partida</p>
          <p className="mt-1.5 font-heading text-xl font-extrabold">{partida.titulo}</p>
          <p className="mt-1 text-primary-foreground/80">{partida.texto}</p>
        </section>
      )}

      {e && (
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">CV (opcional)</p>
          <SubirCv usuarioId={u.id} tieneCv={Boolean(e.cv_path)} />
        </section>
      )}

      {VISTAS.some((v) => u.roles.includes(v.rol)) && (
        <section className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          {VISTAS.filter((v) => u.roles.includes(v.rol)).map((v) => (
            <Link key={v.rol} href={v.href} className="flex items-center justify-between border-b border-border px-5 py-4 font-semibold last:border-0">
              {v.texto}
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </section>
      )}

      <form action={salir}>
        <Button type="submit" variant="ghost" className="h-12 w-full rounded-xl text-muted-foreground">
          <LogOut className="size-4" /> Salir
        </Button>
      </form>
    </div>
  );
}

function Dato({ t, v }: { t: string; v: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{t}</dt>
      <dd className="mt-0.5">{v || "—"}</dd>
    </div>
  );
}
