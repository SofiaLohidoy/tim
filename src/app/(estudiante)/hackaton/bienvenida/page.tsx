import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Clock3, Download, MapPin } from "lucide-react";
import { Logo } from "@/components/marca";
import { exigirUsuario, destinoSeguro } from "@/lib/sesion";
import guia from "@/lib/hackaton/guia.json";
import "./guia.css";
// El loader de Tailwind del proyecto procesa CSS global; prefijos únicos evitan colisiones.
const s={guia:"tim-guia",cabecera:"tim-guia-cabecera",bloque:"tim-guia-bloque",pendiente:"tim-guia-pendiente",recorrido:"tim-guia-recorrido",accion:"tim-guia-accion"};
export const metadata: Metadata = {title:"Tu guía de la hackatón"};
export default function Pagina({searchParams}:PageProps<"/hackaton/bienvenida">){return <Suspense fallback={<div className="h-64 animate-pulse"/>}><Contenido searchParams={searchParams}/></Suspense>;}
async function Contenido({searchParams}:{searchParams:PageProps<"/hackaton/bienvenida">["searchParams"]}){
  await exigirUsuario("/hackaton/bienvenida");
  const params=await searchParams;
  const siguiente=destinoSeguro(typeof params.siguiente==="string"?params.siguiente:null)??"/inicio";
  return <main className={`${s.guia} mx-auto grid w-full max-w-3xl gap-5 px-5 py-6 pb-28`}>
    <header className={s.cabecera}>
      <Logo className="h-8 w-auto"/>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest">Tu guía de bienvenida</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{guia.titulo}</h1>
      <p className="mt-3 leading-relaxed">{guia.bajada}</p>
      <dl className="mt-6 grid gap-4 text-sm font-bold">
        {[{Icono:CalendarDays,nombre:"Fecha",valor:guia.fecha},{Icono:Clock3,nombre:"Horario",valor:guia.horario},{Icono:MapPin,nombre:"Lugar",valor:guia.lugar}].map(({Icono,nombre,valor})=><div key={nombre} className="flex gap-3"><Icono className="size-5 shrink-0" aria-hidden="true"/><div><dt>{nombre}</dt><dd className="mt-1 font-normal">{valor}</dd></div></div>)}
      </dl>
    </header>
    <a href="/documentos/bienvenida-hackathon-tim.pdf" download className={s.accion}><Download className="size-4"/>Descargar guía (PDF)</a>
    {guia.secciones.map((seccion,i)=><section key={seccion.titulo} className={`${s.bloque} ${"pendiente" in seccion?s.pendiente:""}`}>
      <h2 className="text-xl font-bold">{seccion.titulo}</h2>
      {"textos" in seccion&&seccion.textos?.map(texto=><p key={texto} className="mt-3 text-sm leading-relaxed">{texto}</p>)}
      {i===0&&<ol aria-label="Recorrido de la jornada" className={`${s.recorrido} mt-4 grid gap-2`}>{guia.recorrido.map((paso,n)=><li key={paso} className="text-sm"><span className="font-bold">{n+1}.</span> {paso}</li>)}</ol>}
      {"items" in seccion&&<ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">{seccion.items?.map(item=><li key={item}>{item}</li>)}</ul>}
    </section>)}
    <footer className={s.cabecera}><p className="text-lg font-bold leading-relaxed">{guia.cierre}</p><p className="mt-5 text-sm">{guia.firma}</p></footer>
    <Link href={siguiente==="/hackaton/bienvenida"?"/inicio":siguiente} className={s.accion}>Continuar a TIM</Link>
  </main>;
}
