"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { CheckCircle2, FileUp, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clienteNavegador } from "@/lib/supabase/navegador";
import { guardarCv, marcarConCodigo, registrarEntrega, elegirEmpresa } from "../acciones";
import { EMPRESAS_HACKATON, empresaParticipante } from "@/lib/hackaton/empresas";

const input =
  "h-12 w-full min-w-0 rounded-xl border-0 bg-muted px-3.5 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring";

export function FormCodigo() {
  const [estado, accion, enviando] = useActionState(marcarConCodigo, {});
  if (estado.ok) {
    return (
      <p className="flex items-center gap-2 font-semibold text-primary">
        <CheckCircle2 className="size-5" /> Listo, quedó marcada tu asistencia.
      </p>
    );
  }
  return (
    <form action={accion} className="grid gap-2">
      <label htmlFor="codigo" className="text-sm text-muted-foreground">
        ¿No te abre la cámara? Escribí el código de la pantalla.
      </label>
      <div className="flex gap-2">
        <input
          id="codigo"
          name="codigo"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={8}
          placeholder="ABC123"
          className={`${input} font-heading font-bold tracking-[0.2em] uppercase`}
        />
        <Button type="submit" disabled={enviando} className="h-12 rounded-xl px-5">
          {enviando ? "…" : "Marcar"}
        </Button>
      </div>
      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}
    </form>
  );
}

export function FormEntrega({ equipo, actual }: { equipo: string; actual: string | null }) {
  const [estado, accion, enviando] = useActionState(registrarEntrega, {});
  return (
    <form action={accion} className="grid gap-2">
      <input type="hidden" name="equipo" value={equipo} />
      <label htmlFor="url" className="text-sm font-semibold">
        Enlace de presentación (opcional)
      </label>
      <div className="flex gap-2">
        <input id="url" name="url" type="url" inputMode="url" defaultValue={actual ?? ""} placeholder="https://www.canva.com/…" className={input} />
        <Button type="submit" variant="secondary" disabled={enviando} className="h-12 rounded-xl px-4">
          <Link2 className="size-4" />
          {actual ? "Cambiar" : "Guardar"}
        </Button>
      </div>
      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-primary">Guardado. Lo ve el jurado.</p>}
    </form>
  );
}

export function FormEmpresa({equipo,actual}:{equipo:string;actual:string|null}) {
  const [estado,accion,enviando]=useActionState(elegirEmpresa,{});
  const elegida=empresaParticipante(actual);
  const [seleccion,setSeleccion]=useState(elegida??"");
  return <form action={accion} className="grid gap-3 border-t border-border pt-4">
    <input type="hidden" name="equipo" value={equipo}/>
    <label htmlFor="empresa-equipo" className="text-sm font-semibold">Empresa elegida</label>
    <select id="empresa-equipo" name="empresa" value={seleccion} onChange={e=>setSeleccion(e.target.value)} required className={input} disabled={enviando}>
      <option value="" disabled>Elegí una empresa</option>
      {EMPRESAS_HACKATON.map(e=><option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
    </select>
    <Button type="submit" variant="secondary" className="min-h-11" disabled={enviando}>{enviando?"Guardando…":"Guardar empresa"}</Button>
    {estado.error&&<p role="alert" className="text-sm text-destructive">{estado.error}</p>}
    {estado.ok&&seleccion===elegida&&<p role="status" className="text-sm text-primary">Empresa guardada para todo el equipo.</p>}
  </form>;
}

export function SubirCv({ usuarioId, tieneCv }: { usuarioId: string; tieneCv: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [hay, setHay] = useState(tieneCv);
  const [ocupado, empezar] = useTransition();

  const subir = (archivo: File) => {
    if (archivo.type !== "application/pdf") return toast.error("Tiene que ser un PDF.");
    if (archivo.size > 5 * 1024 * 1024) return toast.error("El PDF pesa más de 5 MB. Probá exportarlo más liviano.");
    empezar(async () => {
      const ruta = `${usuarioId}/cv.pdf`;
      const { error } = await clienteNavegador().storage.from("cvs").upload(ruta, archivo, { upsert: true, contentType: "application/pdf" });
      if (error) return void toast.error("No pudimos subir el CV. Probá de nuevo.");
      const r = await guardarCv(ruta);
      if (r.error) return void toast.error(r.error);
      setHay(true);
      toast.success("CV guardado.");
    });
  };

  const quitar = () =>
    empezar(async () => {
      const r = await guardarCv(null);
      if (r.error) return void toast.error(r.error);
      setHay(false);
      toast.success("Quitamos tu CV.");
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])}
      />
      <Button type="button" variant={hay ? "secondary" : "default"} disabled={ocupado} onClick={() => ref.current?.click()} className="h-11 rounded-xl">
        <FileUp className="size-4" />
        {ocupado ? "Subiendo…" : hay ? "Reemplazar CV" : "Subir CV (PDF)"}
      </Button>
      {hay && (
        <Button type="button" variant="ghost" disabled={ocupado} onClick={quitar} className="h-11 rounded-xl text-muted-foreground">
          <Trash2 className="size-4" /> Quitar
        </Button>
      )}
    </div>
  );
}
