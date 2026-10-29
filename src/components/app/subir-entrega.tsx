"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MAX_ENTREGA, tipoPermitido, type TipoEntrega } from "@/lib/entregas";
export function SubirEntrega({equipo,tipo="documento",actual=null}:{equipo:string;tipo?:TipoEntrega;actual?:string|null}){
  const ref=useRef<HTMLInputElement>(null);
  const [nombre,setNombre]=useState("");
  const [ocupado,empezar]=useTransition();
  const router=useRouter();
  return <div className="mt-4 grid gap-2 border-t border-border pt-4">
    <p className="text-sm font-semibold">{tipo==="documento"?"Documento principal *":"Presentación (opcional)"}</p>
    <p className="text-xs text-muted-foreground">{tipo==="documento"?"Word (.docx) o PDF. Hasta 4 MB.":"PowerPoint (.pptx) o PDF exportado de Canva. Hasta 4 MB. También podés pegar un enlace abajo."}</p>
    <input ref={ref} aria-label={tipo==="documento"?"Documento principal":"Archivo de presentación"} type="file" className="sr-only" accept={tipo==="documento"?".pdf,.docx":".pdf,.pptx"} disabled={ocupado} onChange={e=>{
      const file=e.target.files?.[0];if(!file)return;
      if(!tipoPermitido(tipo,file.type)||file.size>MAX_ENTREGA||file.size===0){toast.error(tipo==="documento"?"Elegí Word o PDF de hasta 4 MB.":"Elegí PowerPoint o PDF de hasta 4 MB.");e.target.value="";return;}
      empezar(async()=>{
        try{const form=new FormData();form.set("equipo",equipo);form.set("archivo",file);form.set("tipo",tipo);
          const r=await fetch("/api/entregas",{method:"POST",body:form});const data=await r.json();
          if(!r.ok){toast.error(data.error??"No pudimos subir la entrega.");return;}
          setNombre(file.name);toast.success("Entrega guardada. La ven el organizador y tu jurado.");router.refresh();
        }catch{toast.error("No pudimos subir la entrega. Revisá la conexión y probá de nuevo.");}
        finally{if(ref.current)ref.current.value="";}
      });
    }}/>
    <Button type="button" variant="secondary" className="min-h-11" disabled={ocupado} onClick={()=>ref.current?.click()}><FileUp className="size-4"/>{ocupado?"Subiendo…":tipo==="documento"?"Subir documento":"Subir presentación"}</Button>
    {(nombre||actual)&&<a href={`/entregas/${equipo}?tipo=${tipo}`} target="_blank" rel="noreferrer" className="min-h-11 break-words text-sm font-semibold text-violeta-texto underline">{nombre||actual}</a>}
  </div>;
}
