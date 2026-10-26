import Link from "next/link";
import { Isotipo } from "@/components/marca";

export default function NoEncontrado() {
  return (
    <main className="grid min-h-dvh place-items-center bg-primary px-6 text-center text-primary-foreground">
      <div className="grid justify-items-center gap-4">
        <Isotipo className="h-20 w-auto" />
        <h1 className="text-3xl font-extrabold">No encontramos esta página.</h1>
        <Link href="/continuar" className="font-semibold text-lila-texto underline underline-offset-4">
          Volver a TIM
        </Link>
      </div>
    </main>
  );
}
