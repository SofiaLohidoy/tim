"use client";
import { useActionState } from "react";
import { registrarGanador,type Resultado } from "../acciones";
import { Button } from "@/components/ui/button";
import { claseInput,Mensaje } from "@/components/org/campos";

export function EquipoGanador({eventoId,equipos}:{eventoId:string;equipos:{id:string;nombre:string}[]}) {
  const [estado,accion,ocupado]=useActionState<Resultado,FormData>(registrarGanador,{});
  return <form action={accion} className="grid gap-3">
    <input type="hidden" name="evento" value={eventoId}/>
    <div className="grid gap-1.5 text-sm font-semibold">
      <label htmlFor="equipo-ganador">Equipo ganador</label>
      <select id="equipo-ganador" name="equipo" required defaultValue="" className={claseInput}>
        <option value="" disabled>Elegí el equipo…</option>
        {equipos.map(q=><option key={q.id} value={q.id}>{q.nombre}</option>)}
      </select>
    </div>
    <p className="text-sm text-muted-foreground">El reconocimiento aparecerá en la devolución de sus integrantes. La elección queda registrada para esta edición.</p>
    <Mensaje r={estado}/>
    <Button type="submit" disabled={ocupado} className="min-h-11 justify-self-start rounded-xl px-5">{ocupado?"Guardando…":"Guardar equipo ganador"}</Button>
  </form>;
}
