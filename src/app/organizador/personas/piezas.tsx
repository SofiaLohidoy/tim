"use client";

import { useActionState, useState, useTransition } from "react";
import { Copy, FileText, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Campo, Mensaje, claseInput } from "@/components/org/campos";
import { borrarInvitacion, eliminarEstudiante, invitar, marcarAsistenciaManual, quitarRol, restablecerClave, urlCv, type Resultado } from "../acciones";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function DeletePersona({ usuarioId, nombre, email, protegido }: { usuarioId: string; nombre: string; email: string; protegido: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [ocupado, empezar] = useTransition();
  return (
    <>
      <Button variant="ghost" className="min-h-11" disabled={protegido} aria-label={`Delete: ${nombre}`} title={protegido ? "Cuenta protegida por su rol" : "Eliminar cuenta"} onClick={() => { setConfirmacion(""); setError(""); setAbierto(true); }}>
        <Trash2 className="size-4" aria-hidden="true" /><span>Delete</span>
      </Button>
      <Sheet open={abierto} onOpenChange={(valor) => { if (!ocupado) setAbierto(valor); }}>
        <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]" showCloseButton={!ocupado}>
          <SheetHeader>
            <SheetTitle>Eliminar cuenta de {nombre}</SheetTitle>
            <SheetDescription>Se eliminarán su acceso, perfil, CV, asistencias, pertenencia a equipos, evaluaciones individuales y devoluciones, en todos los eventos. Las entregas compartidas del equipo se conservan. Se guardará un respaldo privado para recuperación técnica.</SheetDescription>
          </SheetHeader>
          <form className="grid gap-4 px-4" onSubmit={(e) => {
            e.preventDefault();
            if (ocupado) return;
            empezar(async () => {
              const r = await eliminarEstudiante(usuarioId, confirmacion);
              if (r.error) setError(r.error);
              else { setAbierto(false); toast.success(r.mensaje); }
            });
          }}>
            <label className="grid gap-2 text-sm font-semibold">Escribí su mail para confirmar
              <span className="break-all font-normal text-muted-foreground">{email}</span>
              <input aria-label="Mail para confirmar eliminación" type="email" autoComplete="off" required value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className={claseInput} disabled={ocupado} />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button variant="destructive" type="submit" className="min-h-11" disabled={ocupado || confirmacion.trim().toLowerCase() !== email.toLowerCase()}>{ocupado ? "Eliminando…" : "Eliminar cuenta y datos"}</Button>
            <Button type="button" variant="outline" className="min-h-11" disabled={ocupado} onClick={() => setAbierto(false)}>Cancelar</Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function AsistenciaToggle({ eventoId, usuarioId, presente }: { eventoId: string; usuarioId: string; presente: boolean }) {
  const [ocupado, empezar] = useTransition();
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        defaultChecked={presente}
        disabled={ocupado}
        onChange={(e) =>
          empezar(async () => {
            const r = await marcarAsistenciaManual(eventoId, usuarioId, e.target.checked);
            if (r.error) toast.error(r.error);
          })
        }
        className="size-5 accent-[var(--violeta-texto)]"
      />
      <span className="sr-only">Presente</span>
    </label>
  );
}

export function AccionesPersona({ usuarioId, tieneCv, nombre }: { usuarioId: string; tieneCv: boolean; nombre: string }) {
  const [clave, setClave] = useState<string | null>(null);
  const [ocupado, empezar] = useTransition();
  return (
    <div className="flex items-center justify-end gap-1">
      {tieneCv && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver CV de ${nombre}`}
          onClick={() =>
            empezar(async () => {
              const r = await urlCv(usuarioId);
              if (r.url) window.open(r.url, "_blank", "noopener");
              else toast.error(r.error);
            })
          }
        >
          <FileText className="size-4" />
        </Button>
      )}
      {clave ? (
        <span className="rounded-lg bg-lila-claro px-2 py-1 font-mono text-sm text-verde-oscuro select-all">{clave}</span>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Restablecer contraseña de ${nombre}`}
          title="Restablecer contraseña"
          disabled={ocupado}
          onClick={() =>
            empezar(async () => {
              const r = await restablecerClave(usuarioId);
              if (r.clave) setClave(r.clave);
              else toast.error(r.error);
            })
          }
        >
          <KeyRound className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function FormInvitar({ eventoId, equipos }: { eventoId: string | null; equipos: { id: string; nombre: string }[] }) {
  const [r, accion, guardando] = useActionState<Resultado, FormData>(invitar, {});
  const [rol, setRol] = useState("mentor");
  return (
    <form action={accion} className="grid gap-3">
      {eventoId && <input type="hidden" name="eventoId" value={eventoId} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Mail" htmlFor="inv-email">
          <input id="inv-email" name="email" type="email" required className={claseInput} />
        </Campo>
        <Campo etiqueta="Nombre" htmlFor="inv-nombre">
          <input id="inv-nombre" name="nombre" className={claseInput} />
        </Campo>
        <Campo etiqueta="Rol" htmlFor="inv-rol">
          <select id="inv-rol" name="rol" value={rol} onChange={(e) => setRol(e.target.value)} className={claseInput}>
            <option value="mentor">Mentor</option>
            <option value="jurado">Jurado</option>
            <option value="organizador">Organizador</option>
          </select>
        </Campo>
        {rol !== "organizador" && (
          <Campo etiqueta="Equipo (opcional)" htmlFor="inv-equipo" ayuda="Se puede asignar después, en Equipos.">
            <select id="inv-equipo" name="equipoId" defaultValue="" className={claseInput}>
              <option value="">Más tarde</option>
              {equipos.map((q) => (
                <option key={q.id} value={q.id}>{q.nombre}</option>
              ))}
            </select>
          </Campo>
        )}
      </div>
      <Mensaje r={r} />
      <Button type="submit" disabled={guardando} className="h-11 justify-self-start rounded-xl px-5">
        {guardando ? "Guardando…" : "Crear invitación"}
      </Button>
    </form>
  );
}

export function LinkInvitacion({ token }: { token: string }) {
  const copiar = async () => {
    const url = `${window.location.origin}/invitacion/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado. Mandáselo por WhatsApp.");
    } catch {
      window.prompt("Copiá el link:", url);
    }
  };
  return (
    <Button variant="secondary" size="sm" onClick={copiar} className="rounded-lg">
      <Copy className="size-3.5" /> Copiar link
    </Button>
  );
}

export function BotonBorrar({ tipo, id, etiqueta }: { tipo: "invitacion" | "rol"; id: string; etiqueta: string }) {
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, empezar] = useTransition();
  if (!confirmar)
    return (
      <Button variant="ghost" size="icon" aria-label={etiqueta} onClick={() => setConfirmar(true)}>
        <Trash2 className="size-4" />
      </Button>
    );
  return (
    <span className="inline-flex gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={ocupado}
        onClick={() =>
          empezar(async () => {
            const r = tipo === "invitacion" ? await borrarInvitacion(id) : await quitarRol(id);
            if (r.error) toast.error(r.error);
            setConfirmar(false);
          })
        }
      >
        {etiqueta}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmar(false)}>
        Cancelar
      </Button>
    </span>
  );
}
