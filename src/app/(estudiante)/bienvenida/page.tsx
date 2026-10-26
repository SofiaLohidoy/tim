import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { exigirUsuario, destinoSeguro } from "@/lib/sesion";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Bienvenida" };

export default function Pagina({ searchParams }: PageProps<"/bienvenida">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/bienvenida">["searchParams"] }) {
  const [u, params] = await Promise.all([exigirUsuario("/bienvenida"), searchParams]);
  const siguiente = destinoSeguro(typeof params.siguiente === "string" ? params.siguiente : null) ?? "";
  if (u.onboardingCompleto) redirect(siguiente || "/inicio");
  return <Onboarding inicial={{ nombre: u.nombre ?? "", apellido: u.apellido ?? "" }} siguiente={siguiente} />;
}
