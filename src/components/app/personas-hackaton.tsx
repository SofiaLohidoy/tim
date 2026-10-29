import Image from "next/image";
import { ExternalLink } from "lucide-react";
type Persona={nombre:string;linkedin:string;foto:string|null};
export function PersonasHackaton({personas}:{personas:Persona[]}){
  return <ul className="mt-4 grid gap-3 sm:grid-cols-2">{personas.map(p=><li key={p.linkedin}><a href={p.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${p.nombre}`} className="flex min-h-20 items-center gap-3 rounded-2xl bg-lila-claro p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violeta-texto">
    {p.foto?<Image src={p.foto} alt={`Foto de ${p.nombre}`} width={56} height={56} className="size-14 shrink-0 rounded-full object-cover"/>:<span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{p.nombre.split(" ").filter(Boolean).slice(0,2).map(n=>n[0]).join("")}</span>}
    <span className="min-w-0 flex-1"><span className="block font-semibold">{p.nombre}</span><span className="mt-1 block text-xs text-violeta-texto">Ver perfil en LinkedIn</span></span><ExternalLink className="size-4 shrink-0" aria-hidden="true"/>
  </a></li>)}</ul>;
}
