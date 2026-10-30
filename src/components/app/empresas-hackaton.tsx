import Image from "next/image";
import { ArrowUpRight, FileText } from "lucide-react";
import { EMPRESAS_HACKATON } from "@/lib/hackaton/empresas";

export function EmpresasHackaton({ compacto = false }: { compacto?: boolean }) {
  return <section aria-label="Empresas participantes" className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
    <div><p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Hackatón TIM</p><h2 className="mt-1 font-heading text-xl font-bold">Empresas participantes</h2><p className="mt-2 text-sm text-muted-foreground">Tocá una empresa para ver su documento.</p></div>
    <ul className={`grid gap-3 ${compacto ? "" : "sm:grid-cols-2"}`} aria-label="Documentos de las empresas">
      {EMPRESAS_HACKATON.map(empresa=>{
        const contenido=<>{empresa.logo?<Image src={empresa.logo} alt="" width={80} height={80} className="size-16 shrink-0 rounded-xl object-contain"/>:<span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-xl bg-lila-claro text-xl font-bold text-primary">B</span>}<div className="min-w-0 flex-1"><h3 className="font-heading text-lg font-bold">{empresa.nombre}</h3><p className={`mt-1 text-xs ${empresa.documento?"font-semibold text-violeta-texto":"text-muted-foreground"}`}>{empresa.documento?<span className="inline-flex items-center gap-1"><FileText className="size-3.5" aria-hidden="true"/>Ver documento (PDF)</span>:"Documento próximamente"}</p></div>{empresa.documento&&<ArrowUpRight className="size-4 shrink-0 text-violeta-texto" aria-hidden="true"/>}</>;
        return <li key={empresa.nombre}>{empresa.documento?<a href={empresa.documento} target="_blank" rel="noopener noreferrer" aria-label={`Ver documento de ${empresa.nombre} (PDF)`} className="flex min-h-24 items-center gap-3 rounded-2xl bg-background p-3 ring-1 ring-border transition-colors hover:bg-lila-claro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violeta-texto">{contenido}</a>:<div aria-disabled="true" className="flex min-h-24 items-center gap-3 rounded-2xl bg-muted/50 p-3 ring-1 ring-border">{contenido}</div>}</li>;
      })}
    </ul>
  </section>;
}
