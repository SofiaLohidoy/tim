"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {claseInput} from "@/components/org/campos";
export function SubirArchivoVirtual({desafio,tipo,etiqueta,onSubido,onOcupado}:{desafio:string;tipo:"consigna"|"investigacion";etiqueta?:string;onSubido?:(a:{id:string;nombre:string})=>void;onOcupado?:(v:boolean)=>void}){
 const [mensaje,setMensaje]=useState(""),[error,setError]=useState(""),[ocupado,setOcupado]=useState(false);const router=useRouter();
 const rotulo=etiqueta??(tipo==="consigna"?"Consigna (PDF)":"Archivo de investigación");
 return <div className="grid gap-2"><label className="grid gap-1.5 text-sm font-semibold" htmlFor={`archivo-${tipo}`}>{rotulo}</label><input id={`archivo-${tipo}`} type="file" aria-label={rotulo} disabled={ocupado} accept={tipo==="consigna"?".pdf":".pdf,.docx,.md"} className="peer sr-only" onChange={async e=>{
  const f=e.target.files?.[0];if(!f)return;setError("");setMensaje("");if(f.size>4194304){setError("El archivo debe pesar hasta 4 MB.");e.target.value="";return;}setOcupado(true);onOcupado?.(true);
  try{const data=new FormData();data.set("desafio",desafio);data.set("tipo",tipo);data.set("archivo",f);const r=await fetch("/api/desafios-virtuales/archivo",{method:"POST",body:data});const b=await r.json();if(!r.ok)throw new Error(b.error??"No pudimos subir el archivo.");setMensaje("Archivo guardado.");onSubido?.({id:b.id,nombre:f.name});router.refresh();}catch(err){setError(err instanceof Error?err.message:"No pudimos subir el archivo. Probá de nuevo.");}finally{setOcupado(false);onOcupado?.(false);e.target.value="";}
 }}/><label htmlFor={`archivo-${tipo}`} className={`${claseInput} flex min-h-11 cursor-pointer items-center justify-center font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50`}>{ocupado?"Subiendo…":"Elegir archivo"}</label><p className="text-xs text-muted-foreground">Hasta 4 MB. {tipo==="consigna"?"PDF original privado.":"PDF, Word (.docx) o Markdown (.md)."}</p>{ocupado&&<p role="status">Subiendo…</p>}{mensaje&&<p role="status" className="text-sm">{mensaje}</p>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
