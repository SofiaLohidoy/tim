import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca";

export const metadata: Metadata = { title: "Privacidad" };

// Versión de la etapa de validación (tesis). La versión completa (términos, borrado de cuenta
// autoservicio) es de la fase F.
export default function Pagina() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" aria-label="TIM, inicio" className="inline-block text-primary">
        <Logo className="h-7 w-auto" />
      </Link>
      <h1 className="mt-8 text-3xl font-extrabold">Privacidad</h1>
      <div className="mt-6 grid gap-4 text-[15.5px] leading-relaxed text-foreground/85">
        <p>
          TIM es un proyecto en etapa de validación del equipo Beitzá (Universidad Torcuato Di Tella). Guardamos solo lo
          que hace falta para organizar los desafíos y armar tu perfil.
        </p>
        <h2 className="mt-2 text-xl font-extrabold">Qué guardamos</h2>
        <p>
          Tu mail, tu nombre, lo que contás en el registro (universidad, carrera, intereses), tu asistencia, lo que
          mentores y jurados observan en los desafíos, y tu CV si decidís subirlo. En la página pública medimos visitas
          y clics de forma anónima, sin cookies de terceros.
        </p>
        <h2 className="mt-2 text-xl font-extrabold">Quién lo ve</h2>
        <p>
          Vos ves tu perfil y tu devolución. El equipo TIM ve todo para organizar los desafíos. Tu mentor ve tu nombre
          para evaluarte. Tu CV lo ve solo el equipo TIM. Las empresas ven tu perfil sin nombre: tu nombre y tu
          contacto se comparten solo si vos aceptás.
        </p>
        <h2 className="mt-2 text-xl font-extrabold">Tus derechos</h2>
        <p>
          Podés pedir que corrijamos o borremos tus datos cuando quieras. Escribile al equipo TIM y lo hacemos.
        </p>
        <p className="text-sm text-muted-foreground">Última actualización: octubre de 2026.</p>
      </div>
    </main>
  );
}
