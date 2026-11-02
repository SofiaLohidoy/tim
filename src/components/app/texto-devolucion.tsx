import { bloquesDevolucion } from "@/lib/texto-devolucion";

export function TextoDevolucion({texto,nivelTitulo=3}:{texto:string;nivelTitulo?:3|4}) {
  const Titulo=nivelTitulo===4?"h4":"h3";
  return <div className="mt-3 space-y-4 break-words text-[15px] leading-relaxed">
    {bloquesDevolucion(texto).map((b,i)=>b.tipo==="titulo"
      ? <Titulo key={i} className="font-heading pt-2 text-base leading-snug font-bold">{b.texto}</Titulo>
      : <p key={i}>{b.texto}</p>)}
  </div>;
}
