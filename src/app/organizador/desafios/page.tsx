import {Suspense} from "react";
import Link from "next/link";
import {exigirRol} from "@/lib/sesion";
import {clienteServidor} from "@/lib/supabase/servidor";
import {Panel,Titulo,Vacio} from "@/components/org/ui";
import {Campo,claseInput} from "@/components/org/campos";
import {FormularioVirtual} from "@/components/app/formulario-virtual";
import {TITULO_PAPERCLIP,CONSIGNA_PAPERCLIP} from "@/lib/desafios-virtuales";
import {guardarDesafio} from "./acciones";
export const metadata={title:"Desafíos virtuales"};
export default function Pagina(){return <Suspense fallback={<p>Cargando desafíos…</p>}><Contenido/></Suspense>;}
async function Contenido(){
 await exigirRol("organizador","/organizador/desafios");const db=await clienteServidor();const r=await db.from("desafios_virtuales").select("id,titulo,estado,duracion_horas").order("creado_en",{ascending:false});
 return <><Titulo ojo="Pilotos privados">Desafíos virtuales</Titulo><div className="grid gap-4">
  <Panel titulo="Tus desafíos">{r.error?<Vacio>No pudimos cargar los desafíos. Recargá la página.</Vacio>:r.data.length?<ul className="grid gap-2">{r.data.map(d=><li key={d.id}><Link className="block rounded-2xl bg-muted p-4" href={`/organizador/desafios/${d.id}`}><span className="font-semibold">{d.titulo}</span><span className="mt-1 block text-sm text-muted-foreground">{d.estado} · {d.duracion_horas} horas por persona</span></Link></li>)}</ul>:<Vacio>Todavía no creaste un desafío.</Vacio>}</Panel>
  <Panel titulo="Crear desafío privado" descripcion="Se crea en borrador y sin participantes."><FormularioVirtual action={guardarDesafio} boton="Crear desafío"><input type="hidden" name="id" value=""/>
   <Campo etiqueta="Título *" htmlFor="titulo"><input id="titulo" name="titulo" required minLength={3} maxLength={160} defaultValue={TITULO_PAPERCLIP} className={claseInput}/></Campo>
   <Campo etiqueta="Consigna *" htmlFor="consigna"><textarea id="consigna" name="consigna" required minLength={20} maxLength={30000} defaultValue={CONSIGNA_PAPERCLIP} className={claseInput.replace("h-11","min-h-72 py-3")}/></Campo>
   <Campo etiqueta="Horas desde Comenzar *" htmlFor="horas"><input id="horas" name="horas" type="number" required min={1} max={168} defaultValue={72} className={claseInput}/></Campo>
  </FormularioVirtual></Panel></div></>;
}
