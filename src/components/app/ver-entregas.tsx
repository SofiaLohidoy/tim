import { ExternalLink } from "lucide-react";

export function VerEntregas({equipo,nombre,empresa,documento,presentacion,enlace}:{equipo:string;nombre:string;empresa:string|null;documento:string|null;presentacion:string|null;enlace:string|null}) {
  const estilo="inline-flex min-h-11 items-center gap-2 break-words text-sm font-semibold text-violeta-texto";
  return <div className="grid min-w-0 gap-1">
    <p className="text-sm">Empresa elegida: <strong>{empresa??"Sin elegir"}</strong></p>
    {documento&&<><p className="break-words text-sm text-muted-foreground">{documento}</p><a href={`/entregas/${equipo}`} target="_blank" rel="noreferrer" className={estilo}><ExternalLink className="size-4 shrink-0"/>Ver documento<span className="sr-only"> de {nombre}</span></a></>}
    {!documento&&<p className="text-sm text-muted-foreground">Documento pendiente</p>}
    {presentacion&&<><p className="break-words text-sm text-muted-foreground">{presentacion}</p><a href={`/entregas/${equipo}?tipo=presentacion`} target="_blank" rel="noreferrer" className={estilo}><ExternalLink className="size-4 shrink-0"/>Ver presentación<span className="sr-only"> de {nombre}</span></a></>}
    {enlace&&<a href={enlace} target="_blank" rel="noreferrer" className={estilo}><ExternalLink className="size-4 shrink-0"/>Ver link de presentación<span className="sr-only"> de {nombre}</span></a>}
  </div>;
}
