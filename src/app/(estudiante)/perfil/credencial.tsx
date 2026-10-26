"use client";

import { useState, useTransition } from "react";
import { Copy, Download, Link2Off, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { crearCredencial, revocarCredencial } from "./acciones";

export function Credencial(p: { token: string | null; url: string | null; qr: string | null; linkedin: string | null }) {
  const [ocupado, empezar] = useTransition();
  const [confirmar, setConfirmar] = useState(false);

  if (!p.token || !p.url) {
    return (
      <div className="grid gap-3">
        <p className="text-[15px] text-muted-foreground">
          Un link con QR para mostrarle a quien quieras lo que observaron de vos. Lo podés revocar cuando quieras.
        </p>
        <Button disabled={ocupado} onClick={() => empezar(async () => { const r = await crearCredencial(); if (r.error) toast.error(r.error); })} className="h-11 justify-self-start rounded-xl">
          Crear mi credencial
        </Button>
      </div>
    );
  }

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Mi perfil TIM", url: p.url! });
      else {
        await navigator.clipboard.writeText(p.url!);
        toast.success("Link copiado.");
      }
    } catch {
      // La persona canceló.
    }
  };

  return (
    <div className="grid gap-4">
      <div className="mx-auto w-44 rounded-2xl bg-white p-3 ring-1 ring-border [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: p.qr ?? "" }} role="img" aria-label="QR de tu credencial" />
      <p className="text-center text-xs break-all text-muted-foreground">{p.url.replace(/^https?:\/\//, "")}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={compartir} className="h-11 rounded-xl"><Share2 className="size-4" /> Compartir</Button>
        <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(p.url!).catch(() => {}); toast.success("Link copiado."); }} className="h-11 rounded-xl">
          <Copy className="size-4" /> Copiar link
        </Button>
        {p.linkedin && (
          <a href={p.linkedin} target="_blank" rel="noreferrer" className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A66C2] font-semibold text-white">
            Agregar a LinkedIn
          </a>
        )}
        <a href="/perfil/cv" className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary font-semibold">
          <Download className="size-4" /> Descargar CV con evidencia (PDF)
        </a>
      </div>
      {confirmar ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted p-3 text-sm">
          Quien tenga el link deja de ver tu evidencia.
          <Button variant="destructive" size="sm" disabled={ocupado} onClick={() => empezar(async () => { const r = await revocarCredencial(p.token!); if (r.error) toast.error(r.error); setConfirmar(false); })}>Revocar</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmar(false)}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirmar(true)} className="h-10 justify-self-center rounded-xl text-muted-foreground">
          <Link2Off className="size-4" /> Revocar este link
        </Button>
      )}
    </div>
  );
}
