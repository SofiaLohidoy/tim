import { Trophy } from "lucide-react";

export function ReconocimientoGanador({anio,nivelTitulo=2}:{anio:string;nivelTitulo?:2|4}) {
  const Titulo=nivelTitulo===4?"h4":"h2";
  return <section aria-label="Reconocimiento del evento" className="rounded-3xl bg-lila-claro p-5 text-verde-oscuro ring-1 ring-border">
    <Trophy aria-hidden="true" className="mb-3 size-7 text-violeta-texto"/>
    <Titulo className="font-heading text-lg leading-snug font-extrabold">Equipo ganador · Hackatón TIM {anio}</Titulo>
    <p className="mt-2 text-[15px] leading-relaxed">Tu equipo fue elegido ganador de esta edición. ¡Felicitaciones por el trabajo que construyeron juntos!</p>
  </section>;
}
