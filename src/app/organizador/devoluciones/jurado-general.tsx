"use client";
import { useActionState, useState } from "react";
import { guardarJuradoGeneral, type Resultado } from "../acciones";
import { Button } from "@/components/ui/button";
import { claseInput } from "@/components/org/campos";

export function JuradoGeneral({equipo,texto,fuente}:{equipo:{id:string;nombre:string};texto:string;fuente:string}) {
  const [estado,accion,ocupado]=useActionState<Resultado,FormData>(guardarJuradoGeneral,{});
  const [contenido,setContenido]=useState(texto);
  const [errorArchivo,setErrorArchivo]=useState("");
  return <form action={accion} className="mt-3 grid gap-3">
    <input type="hidden" name="equipo" value={equipo.id}/>
    <label className="grid gap-1 text-sm font-semibold">Documento de origen
      <input name="fuente" required maxLength={200} defaultValue={fuente} className={claseInput}/>
    </label>
    <div className="grid gap-1 text-sm font-semibold">
      <label htmlFor={`jurado-texto-${equipo.id}`}>Texto para {equipo.nombre}</label>
      <textarea id={`jurado-texto-${equipo.id}`} name="texto" required minLength={20} maxLength={30000} rows={12} value={contenido} onChange={e=>setContenido(e.target.value)} className={claseInput.replace("h-11","min-h-64 py-3")}/>
    </div>
    <label className="grid gap-1 text-sm">Cargar texto (.txt)
      <input type="file" accept=".txt,text/plain" className={claseInput} onChange={async e=>{
        setErrorArchivo("");const f=e.target.files?.[0];if(!f)return;
        try {if(!f.name.toLowerCase().endsWith(".txt")||f.size>120000)throw new Error();
          const t=await f.text();if(t.trim().length<20||t.length>30000)throw new Error();setContenido(t);
        } catch {setErrorArchivo("Elegí un archivo .txt de hasta 30.000 caracteres.");}
      }}/>
    </label>
    {errorArchivo&&<p role="alert" className="text-sm text-destructive">{errorArchivo}</p>}
    {estado.error&&<p role="alert" className="text-sm text-destructive">{estado.error}</p>}
    {estado.mensaje&&<p role="status" className="text-sm">{estado.mensaje}</p>}
    <Button disabled={ocupado} className="h-11 justify-self-start rounded-xl px-5" type="submit">{ocupado?"Guardando…":"Guardar devolución del jurado"}</Button>
  </form>;
}
