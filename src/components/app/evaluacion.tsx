"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CloudOff, Loader2, MessageSquarePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { guardarEvaluacion, type DatosEvaluacion } from "@/app/(staff)/acciones";

type Respuestas = Record<string, { nivel?: string | null; obs?: string }>;
type Local = {
  respuestas: Respuestas;
  comentario: string;
  tocado: number;
  sincronizado: boolean;
  /** El mentor tocó Enviar sin señal: al volver la conexión se envía solo, no queda en borrador. */
  enviarPendiente?: boolean;
};
type Sync = "guardado" | "guardando" | "pendiente" | "error";

const ahora = () => Date.now();

export type PropsEvaluacion = {
  equipoId: string;
  rol: "mentor" | "jurado";
  estudianteId: string | null;
  dimensiones: { id: string; nombre: string; que_observar: string }[];
  niveles: { id: string; orden: number; nombre: string; descripcion: string }[];
  inicial: { respuestas: Respuestas; comentario: string; estado: "borrador" | "enviada" | null; actualizado: number };
  cerrada: boolean;
  /** A dónde ir al enviar (la siguiente persona, o la lista). */
  despues: string;
  textoDespues: string;
  /** Carga diferida: id del evaluador en nombre de quien carga el organizador. */
  diferidaPara?: string;
};

/**
 * Formulario de rúbrica para mentor y jurado.
 *
 * Guarda primero en el dispositivo (localStorage) y después en la base. Si no hay señal, queda
 * pendiente y se sincroniza solo cuando vuelve la conexión o al reabrir la pantalla. En el lugar
 * de la hackatón el wifi puede fallar: perder una evaluación no es una opción.
 */
export function Evaluacion(p: PropsEvaluacion) {
  const clave = `tim:eval:${p.equipoId}:${p.rol}:${p.estudianteId ?? "equipo"}:${p.diferidaPara ?? "propia"}`;
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Respuestas>(p.inicial.respuestas);
  const [comentario, setComentario] = useState(p.inicial.comentario);
  const [estado, setEstado] = useState(p.inicial.estado);
  const [sync, setSync] = useState<Sync>("guardado");
  const [abiertas, setAbiertas] = useState<Set<string>>(
    () => new Set(Object.entries(p.inicial.respuestas).filter(([, r]) => r.obs).map(([k]) => k)),
  );
  const [enviando, empezar] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimo = useRef<{ respuestas: Respuestas; comentario: string }>({ respuestas, comentario });
  // Los guardados van en fila, uno por vez: así un autoguardado viejo nunca termina después de
  // uno nuevo (o del envío) y lo pisa.
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  // Cada cambio sube la versión. Un guardado solo marca "sincronizado" si al volver la versión es
  // la misma con la que salió: si hubo cambios mientras viajaba, siguen pendientes.
  const version = useRef(0);
  const enviarPendiente = useRef(false);

  const escribirLocal = useCallback(
    (l: Local) => {
      try {
        localStorage.setItem(clave, JSON.stringify(l));
      } catch {
        // Modo privado o sin espacio: queda solo el guardado en la base.
      }
    },
    [clave],
  );

  const subirAhora = useCallback(
    async (enviar: boolean) => {
      const salio = version.current;
      const datos: DatosEvaluacion = {
        equipoId: p.equipoId,
        rol: p.rol,
        estudianteId: p.estudianteId,
        respuestas: ultimo.current.respuestas,
        comentario: ultimo.current.comentario,
        enviar,
        diferidaPara: p.diferidaPara,
      };
      setSync("guardando");
      try {
        const r = await guardarEvaluacion(datos);
        if (!r.ok) {
          setSync("error");
          return r.error;
        }
        setEstado(r.estado);
        if (enviar) enviarPendiente.current = false;
        if (version.current === salio) {
          setSync("guardado");
          escribirLocal({ ...ultimo.current, tocado: ahora(), sincronizado: true });
        }
        return null;
      } catch {
        // Sin conexión: el fetch de la Server Action falla. Queda pendiente, y si era un envío,
        // queda anotado para enviarse solo cuando vuelva la señal.
        if (enviar) enviarPendiente.current = true;
        escribirLocal({ ...ultimo.current, tocado: ahora(), sincronizado: false, enviarPendiente: enviarPendiente.current });
        setSync("pendiente");
        return "sin_conexion";
      }
    },
    [p.equipoId, p.rol, p.estudianteId, p.diferidaPara, escribirLocal],
  );

  const subir = useCallback(
    (enviar: boolean): Promise<string | null> => {
      const turno = cola.current.then(() => subirAhora(enviar));
      cola.current = turno.catch(() => null);
      return turno;
    },
    [subirAhora],
  );

  // Al abrir: si en el dispositivo quedó algo sin sincronizar, gana eso. No se comparan relojes:
  // el del celular puede estar atrasado respecto del servidor.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(clave);
      if (!guardado) return;
      const l = JSON.parse(guardado) as Local;
      if (!l.sincronizado) {
        // Sincroniza desde un sistema externo (el almacenamiento del celular): es el uso legítimo
        // de un efecto. Leerlo en el render rompería la hidratación (el servidor no lo tiene).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRespuestas(l.respuestas);
        setComentario(l.comentario);
        ultimo.current = { respuestas: l.respuestas, comentario: l.comentario };
        enviarPendiente.current = Boolean(l.enviarPendiente);
        setSync("pendiente");
        void subir(enviarPendiente.current);
      }
    } catch {
      // localStorage no disponible.
    }
  }, [clave, subir]);

  useEffect(() => {
    const alVolver = () => {
      if (sync === "pendiente" || sync === "error") void subir(enviarPendiente.current);
    };
    window.addEventListener("online", alVolver);
    const reintento = setInterval(alVolver, 20_000);
    return () => {
      window.removeEventListener("online", alVolver);
      clearInterval(reintento);
    };
  }, [sync, subir]);

  const cambiar = (r: Respuestas, c: string) => {
    setRespuestas(r);
    setComentario(c);
    ultimo.current = { respuestas: r, comentario: c };
    version.current += 1;
    escribirLocal({ respuestas: r, comentario: c, tocado: ahora(), sincronizado: false, enviarPendiente: enviarPendiente.current });
    setSync("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => void subir(enviarPendiente.current), 900);
  };

  const elegir = (dim: string, nivel: string) => {
    const actual = respuestas[dim]?.nivel === nivel ? null : nivel;
    cambiar({ ...respuestas, [dim]: { ...respuestas[dim], nivel: actual } }, comentario);
  };
  const observar = (dim: string, obs: string) => cambiar({ ...respuestas, [dim]: { ...respuestas[dim], obs } }, comentario);

  const completas = p.dimensiones.filter((d) => respuestas[d.id]?.nivel).length;
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const enviar = () =>
    empezar(async () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      const e = await subir(true);
      if (e === "sin_conexion") {
        setErrorEnvio("Sin conexión. Quedó guardado en tu celular y se envía solo cuando vuelva la señal.");
        return;
      }
      if (e) return setErrorEnvio(e);
      setErrorEnvio(null);
      router.push(p.despues);
    });

  return (
    <div className="grid gap-3">
      {p.cerrada && (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Las devoluciones ya se publicaron: esta evaluación quedó cerrada.
        </p>
      )}
      {p.dimensiones.map((d, i) => {
        const r = respuestas[d.id] ?? {};
        return (
          <section key={d.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[17px] font-extrabold">
                <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                {d.nombre}
              </h2>
              {r.nivel && <Check className="size-4 shrink-0 text-violeta-texto" aria-label="Respondida" />}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{d.que_observar}</p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={d.nombre}>
              {p.niveles.map((n) => {
                const activo = r.nivel === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    disabled={p.cerrada}
                    onClick={() => elegir(d.id, n.id)}
                    className={cn(
                      "flex min-h-14 flex-col items-start justify-center gap-1 rounded-2xl px-3 py-2 text-left text-[13.5px] leading-tight ring-1 ring-border transition-[background-color,box-shadow,transform] duration-150 ring-inset active:scale-[0.97] disabled:opacity-60",
                      activo ? "bg-lila-claro font-semibold text-verde-oscuro ring-2 ring-violeta" : "bg-background",
                    )}
                  >
                    <span className="flex gap-0.5" aria-hidden="true">
                      {p.niveles.map((x) => (
                        <i key={x.id} className={cn("size-1.5 rounded-full", x.orden <= n.orden ? (activo ? "bg-violeta" : "bg-foreground/35") : "bg-border")} />
                      ))}
                    </span>
                    {n.nombre}
                  </button>
                );
              })}
            </div>
            {abiertas.has(d.id) ? (
              <textarea
                value={r.obs ?? ""}
                disabled={p.cerrada}
                maxLength={600}
                rows={2}
                autoFocus={!r.obs}
                onChange={(e) => observar(d.id, e.target.value)}
                placeholder="Qué viste: un hecho concreto."
                aria-label={`Observación sobre ${d.nombre}`}
                className="mt-2.5 w-full rounded-xl border-0 bg-muted px-3 py-2.5 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring"
              />
            ) : (
              <button
                type="button"
                disabled={p.cerrada}
                onClick={() => setAbiertas((s) => new Set(s).add(d.id))}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-violeta-texto"
              >
                <MessageSquarePlus className="size-4" /> Agregar observación
              </button>
            )}
          </section>
        );
      })}

      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <label htmlFor="comentario" className="text-[17px] font-extrabold">
          Comentario general <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="comentario"
          value={comentario}
          disabled={p.cerrada}
          maxLength={2000}
          rows={3}
          onChange={(e) => cambiar(respuestas, e.target.value)}
          placeholder={p.rol === "mentor" ? "Algo que le sirva para la próxima." : "Algo que le sirva al equipo."}
          className="mt-2 w-full rounded-xl border-0 bg-muted px-3 py-2.5 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring"
        />
      </section>

      <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-background via-background to-background/0 px-5 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            {completas} de {p.dimensiones.length} con nivel
          </span>
          <EstadoSync sync={sync} estado={estado} />
        </div>
        {errorEnvio && <p className="mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorEnvio}</p>}
        <Button
          type="button"
          onClick={enviar}
          disabled={enviando || p.cerrada || completas === 0}
          className="h-13 w-full rounded-2xl text-base font-semibold"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {estado === "enviada" ? `Guardar cambios y ${p.textoDespues}` : `Enviar y ${p.textoDespues}`}
        </Button>
      </div>
    </div>
  );
}

function EstadoSync({ sync, estado }: { sync: Sync; estado: "borrador" | "enviada" | null }) {
  if (sync === "pendiente")
    return (
      <span className="inline-flex items-center gap-1 text-amber-700">
        <CloudOff className="size-3.5" /> Guardado en el celular
      </span>
    );
  if (sync === "guardando") return <span>Guardando…</span>;
  if (sync === "error") return <span className="text-destructive">No se pudo guardar</span>;
  if (!estado) return <span>Sin empezar</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Check className="size-3.5" /> {estado === "enviada" ? "Enviada" : "Borrador guardado"}
    </span>
  );
}
