"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MAX_ENTREGA, TIPOS_ENTREGA } from "@/lib/entregas";
export function SubirEntrega({equipo}:{equipo:string}){
  const ref=useRef<HTMLInputElement>(null);
  const [nombre,setNombre]=useState("");
  const [ocupado,empezar]=useTransition();
  const router=useRouter();
  return <div className="mt-4 grid gap-2 border-t border-border pt-4">
    <p className="text-sm font-semibold">Archivo de la entrega del equipo</p>
    <p className="text-xs text-muted-foreground">PDF, PowerPoint (.pptx) o Word (.docx). Hasta 4 MB. Reemplaza el archivo anterior del equipo.</p>
    <input ref={ref} aria-label="Archivo de la entrega del equipo" type="file" className="sr-only" accept=".pdf,.pptx,.docx" disabled={ocupado} onChange={e=>{
      const file=e.target.files?.[0];if(!file)return;
      if(!TIPOS_ENTREGA[file.type]||file.size>MAX_ENTREGA||file.size===0){toast.error("Elegí un PDF, PowerPoint o Word de hasta 4 MB.");e.target.value="";return;}
      empezar(async()=>{
        try{const form=new FormData();form.set("equipo",equipo);form.set("archivo",file);
          const r=await fetch("/api/entregas",{method:"POST",body:form});const data=await r.json();
          if(!r.ok){toast.error(data.error??"No pudimos subir la entrega.");return;}
          setNombre(file.name);toast.success("Entrega guardada. La ven el organizador y tu jurado.");router.refresh();
        }catch{toast.error("No pudimos subir la entrega. Revisá la conexión y probá de nuevo.");}
        finally{if(ref.current)ref.current.value="";}
      });
    }}/>
    <Button type="button" variant="secondary" className="min-h-11" disabled={ocupado} onClick={()=>ref.current?.click()}><FileUp className="size-4"/>{ocupado?"Subiendo…":"Subir archivo del equipo"}</Button>
    {nombre&&<p role="status" className="break-words text-sm text-primary">{nombre}</p>}
  </div>;
}
