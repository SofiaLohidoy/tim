import { notFound } from "next/navigation";
import { Landing } from "../../landing";
import { VARIANTES, esVariante } from "../../variantes";
import "../../landing.css";

// `/` se reescribe acá desde src/proxy.ts. Las dos variantes se generan en el build: la landing
// es estática y sale del CDN.
export function generateStaticParams() {
  return VARIANTES.map((variante) => ({ variante }));
}

export default async function Pagina({ params }: PageProps<"/l/[variante]">) {
  const { variante } = await params;
  if (!esVariante(variante)) notFound();
  return <Landing variante={variante} />;
}
