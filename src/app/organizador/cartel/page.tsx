import type { Metadata } from "next";
import QRCode from "qrcode";
import { Logo } from "@/components/marca";
import { BotonImprimir } from "../imprimir/boton";

export const metadata: Metadata = { title: "Cartel de la puerta" };

// Cartel A4 para la entrada: un QR fijo al registro. La asistencia se marca adentro con el QR
// rotativo de la pantalla (/organizador/qr), que no se puede imprimir porque cambia cada minuto.
export default async function Pagina() {
  const sitio = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3001";
  const destino = `${sitio}/ingresar?origen=qr`;
  const svg = await QRCode.toString(destino, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#102E28", light: "#FFFFFF" } });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-muted-foreground">Imprimilo en A4 y pegalo en la entrada. Lleva al registro.</p>
        <BotonImprimir />
      </div>
      <section className="mx-auto flex aspect-[210/297] w-full max-w-[560px] flex-col items-center justify-between rounded-3xl bg-primary p-[7%] text-center text-primary-foreground print:max-w-none print:rounded-none [print-color-adjust:exact]">
        <Logo className="h-[6%] w-auto" />
        <div className="grid gap-3">
          <h1 className="text-[clamp(2rem,6vw,3.2rem)] leading-none font-extrabold">Entrá a la hackatón</h1>
          <p className="text-lg text-primary-foreground/80">Escaneá con la cámara del celular.</p>
        </div>
        <div className="w-[62%] rounded-3xl bg-white p-[3%] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <ol className="grid gap-1.5 text-left text-[clamp(0.95rem,2.4vw,1.15rem)]">
          <li><b className="text-lila-texto">1.</b> Creá tu cuenta (un minuto).</li>
          <li><b className="text-lila-texto">2.</b> Contanos un poco de vos.</li>
          <li><b className="text-lila-texto">3.</b> Adentro, escaneá el QR de la pantalla para marcar que estás.</li>
        </ol>
        <p className="text-xs break-all text-primary-foreground/60">{destino.replace(/^https?:\/\//, "")}</p>
      </section>
    </div>
  );
}
