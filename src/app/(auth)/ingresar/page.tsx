import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/marca";
import { usuarioActual } from "@/lib/sesion";
import { GOOGLE_HABILITADO } from "@/lib/env";
import { FormIngreso } from "./form-ingreso";

export const metadata: Metadata = { title: "Entrar" };

export default function Pagina({ searchParams }: PageProps<"/ingresar">) {
  return (
    <main className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <a href="/" aria-label="TIM, inicio" className="self-start">
          <Logo className="h-7 w-auto" />
        </a>
        <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-lila uppercase">Tu capacidad, en evidencia.</p>
        <Suspense fallback={<div className="mt-10 h-96 animate-pulse rounded-3xl bg-white/5" />}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/ingresar">["searchParams"] }) {
  const [u, params] = await Promise.all([usuarioActual(), searchParams]);
  const siguiente = typeof params.siguiente === "string" ? params.siguiente : "";
  if (u && params.aviso !== "otro_mail") redirect(siguiente ? `/continuar?siguiente=${encodeURIComponent(siguiente)}` : "/continuar");
  return (
    <FormIngreso
      siguiente={siguiente}
      email={typeof params.email === "string" ? params.email : ""}
      invitacion={params.invitacion === "1"}
      aviso={params.aviso === "otro_mail" ? "otro_mail" : params.aviso === "inexistente" ? "inexistente" : null}
      desdeQr={params.origen === "qr" || siguiente.startsWith("/a/")}
      errorGoogle={params.error === "google"}
      google={GOOGLE_HABILITADO}
    />
  );
}
