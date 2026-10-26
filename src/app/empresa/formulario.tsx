"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { guardarEmpresa } from "./acciones";
import { Button } from "@/components/ui/button";

type Empresa = { nombre: string; rubro: string; tamano: string };

export function FormularioEmpresa({ empresa }: { empresa: Empresa | null }) {
  const [estado, accion, pendiente] = useActionState(guardarEmpresa, {});
  const [editando, setEditando] = useState(!empresa);
  if (empresa && !editando) return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-widest text-violeta-texto uppercase">Tu empresa</p>
      <h2 className="mt-3 font-heading text-2xl font-bold">{empresa.nombre}</h2>
      <p className="mt-2 text-muted-foreground">{empresa.rubro} · {empresa.tamano === "50+" ? "50 o más" : empresa.tamano} personas</p>
      <Button onClick={() => setEditando(true)} variant="outline" className="mt-6 min-h-11 rounded-xl">Editar mi empresa</Button>
    </section>
  );
  return (
    <form action={accion} className="grid gap-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-heading text-xl font-bold">{empresa ? "Editar mi empresa" : "Completá tu empresa"}</h2>
      {([{ name: "nombre", label: "Nombre de la empresa", value: empresa?.nombre }, { name: "rubro", label: "Rubro", value: empresa?.rubro }] as const).map((campo) => (
        <div key={campo.name} className="grid gap-2">
          <label htmlFor={campo.name} className="text-sm font-semibold">{campo.label} *</label>
          <input id={campo.name} name={campo.name} defaultValue={campo.value} required minLength={2} maxLength={120} className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" />
        </div>
      ))}
      <div className="grid gap-2">
        <label htmlFor="tamano" className="text-sm font-semibold">Personas en la empresa *</label>
        <select id="tamano" name="tamano" required defaultValue={empresa?.tamano ?? ""} className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:ring-2 focus:ring-ring">
          <option value="" disabled>Elegí el tamaño</option><option value="1-9">1 a 9</option><option value="10-49">10 a 49</option><option value="50+">50 o más</option>
        </select>
      </div>
      {estado.error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{estado.error}</p>}
      <Button type="submit" disabled={pendiente} className="min-h-12 rounded-xl">{pendiente ? "Guardando…" : "Guardar mi empresa"}</Button>
      {empresa && <Link href="/empresa" onClick={(event) => { if (!window.confirm("¿Descartar los cambios sin guardar?")) event.preventDefault(); else setEditando(false); }} className="flex min-h-11 items-center justify-center text-sm font-semibold underline">Cancelar edición</Link>}
    </form>
  );
}
