"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { avanzar, PREGUNTAS, PUNTO_DE_PARTIDA, respuestasDelCamino, type Respuestas } from "@/lib/arquetipo";
import { ANIOS_CARRERA, AREAS, MOTIVOS } from "@/lib/estudiante/opciones";
import { guardarOnboarding } from "./acciones";

type Datos = {
  nombre: string;
  apellido: string;
  universidad: string;
  carrera: string;
  anio: string;
  consentimiento: boolean;
  intereses: string[];
  motivos: string[];
  porQue: string;
};

const TITULOS = ["Tus datos", "Qué te interesa", "Tu punto de partida"];

export function Onboarding({ inicial, siguiente }: { inicial: Pick<Datos, "nombre" | "apellido">; siguiente: string }) {
  const [paso, setPaso] = useState(0);
  const [d, setD] = useState<Datos>({
    ...inicial,
    universidad: "",
    carrera: "",
    anio: "",
    consentimiento: false,
    intereses: [],
    motivos: [],
    porQue: "",
  });
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, empezar] = useTransition();

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => setD((x) => ({ ...x, [k]: v }));
  const alternar = (k: "intereses" | "motivos", v: string, max: number) =>
    setD((x) => {
      const lista = x[k].includes(v) ? x[k].filter((i) => i !== v) : x[k].length < max ? [...x[k], v] : x[k];
      return { ...x, [k]: lista };
    });

  const arbol = avanzar(respuestas);

  const validar = (): string | null => {
    if (paso === 0) {
      if (!d.nombre.trim() || !d.apellido.trim()) return "Completá tu nombre y apellido.";
      if (!d.universidad.trim() || !d.carrera.trim()) return "Completá tu universidad y tu carrera.";
      if (!d.anio) return "Elegí en qué año estás.";
      if (!d.consentimiento) return "Necesitamos tu consentimiento para seguir.";
    }
    if (paso === 1 && d.intereses.length === 0) return "Elegí al menos un área.";
    return null;
  };

  const seguir = () => {
    const e = validar();
    setError(e);
    if (e) return;
    if (paso < 2) {
      setPaso(paso + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    empezar(async () => {
      const r = await guardarOnboarding({
        ...d,
        anio: d.anio as (typeof ANIOS_CARRERA)[number],
        consentimiento: d.consentimiento as true,
        intereses: d.intereses as (typeof AREAS)[number][],
        motivos: d.motivos as (typeof MOTIVOS)[number][],
        respuestas,
        siguiente,
      });
      if (r?.error) setError(r.error);
    });
  };

  const responder = (pregunta: keyof Respuestas, valor: boolean) =>
    setRespuestas((r) => respuestasDelCamino({ ...r, [pregunta]: valor }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (paso > 0 ? setPaso(paso - 1) : undefined)}
          className={cn("grid size-10 place-items-center rounded-full text-foreground", paso === 0 && "invisible")}
          aria-label="Volver al paso anterior"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {TITULOS.map((t, i) => (
            <span key={t} className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full origin-left rounded-full bg-violeta transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${i <= paso ? 1 : 0})` }}
              />
            </span>
          ))}
        </div>
        <span className="w-10 text-right text-xs font-semibold text-muted-foreground tabular-nums">{paso + 1}/3</span>
      </div>

      <div className="mt-8 flex-1" key={paso}>
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Paso {paso + 1}</p>
        <h1 className="mt-2 text-3xl leading-tight font-extrabold">{TITULOS[paso]}</h1>

        {paso === 0 && (
          <div className="mt-6 grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Campo id="nombre" etiqueta="Nombre" valor={d.nombre} alCambiar={(v) => set("nombre", v)} autoComplete="given-name" />
              <Campo id="apellido" etiqueta="Apellido" valor={d.apellido} alCambiar={(v) => set("apellido", v)} autoComplete="family-name" />
            </div>
            <Campo id="universidad" etiqueta="Universidad" valor={d.universidad} alCambiar={(v) => set("universidad", v)} placeholder="Ej.: UTDT" />
            <Campo id="carrera" etiqueta="Carrera" valor={d.carrera} alCambiar={(v) => set("carrera", v)} placeholder="Ej.: Economía" />
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">Año de la carrera</legend>
              <div className="flex flex-wrap gap-2">
                {ANIOS_CARRERA.map((a) => (
                  <Chip key={a} activo={d.anio === a} alTocar={() => set("anio", a)}>
                    {a}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <label className="mt-2 flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm leading-snug">
              <input
                type="checkbox"
                checked={d.consentimiento}
                onChange={(e) => set("consentimiento", e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--violeta-texto)]"
              />
              <span>
                Acepto que TIM guarde mis datos y lo que se observe en los desafíos para armar mi perfil. Las empresas
                no ven mi nombre sin mi permiso.
              </span>
            </label>
          </div>
        )}

        {paso === 1 && (
          <div className="mt-6 grid gap-7">
            <fieldset>
              <legend className="text-sm font-semibold">¿Qué áreas te interesan? Hasta tres.</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <Chip key={a} activo={d.intereses.includes(a)} alTocar={() => alternar("intereses", a, 3)}>
                    {a}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">¿Por qué estás acá?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {MOTIVOS.map((m) => (
                  <Chip key={m} activo={d.motivos.includes(m)} alTocar={() => alternar("motivos", m, MOTIVOS.length)}>
                    {m}
                  </Chip>
                ))}
              </div>
              <label htmlFor="porQue" className="mt-4 block text-sm text-muted-foreground">
                Si querés, contalo con tus palabras.
              </label>
              <textarea
                id="porQue"
                value={d.porQue}
                maxLength={300}
                rows={3}
                onChange={(e) => set("porQue", e.target.value)}
                className="mt-2 w-full rounded-xl border-0 bg-muted px-3.5 py-3 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring"
              />
            </fieldset>
          </div>
        )}

        {paso === 2 && (
          <div className="mt-6 grid gap-3">
            <p className="text-muted-foreground">Unas preguntas rápidas. No hay respuestas buenas ni malas.</p>
            {(Object.keys(PREGUNTAS) as (keyof typeof PREGUNTAS)[])
              .filter((p) => respuestas[p] !== undefined || ("pregunta" in arbol && arbol.pregunta === p))
              .map((p) => (
                <div key={p} className="rounded-2xl bg-card p-4 ring-1 ring-border animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="font-heading text-[17px] leading-snug font-bold">{PREGUNTAS[p]}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[true, false].map((v) => (
                      <Chip key={String(v)} activo={respuestas[p] === v} alTocar={() => responder(p, v)} ancho>
                        {v ? "Sí" : "No"}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            {"arquetipo" in arbol && (
              <div className="mt-2 rounded-2xl bg-primary p-5 text-primary-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-semibold tracking-[0.14em] text-lila uppercase">Tu punto de partida</p>
                <p className="mt-2 font-heading text-xl font-extrabold">{PUNTO_DE_PARTIDA[arbol.arquetipo].titulo}</p>
                <p className="mt-1.5 text-primary-foreground/80">{PUNTO_DE_PARTIDA[arbol.arquetipo].texto}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-8 bg-gradient-to-t from-background via-background to-background/0 px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="button"
          onClick={seguir}
          disabled={guardando || (paso === 2 && !("arquetipo" in arbol))}
          className="h-13 w-full rounded-2xl text-base font-semibold"
        >
          {guardando ? "Guardando…" : paso < 2 ? "Seguir" : "Listo, entrar"}
        </Button>
      </div>
    </div>
  );
}

function Campo(props: {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={props.id} className="text-sm font-semibold">
        {props.etiqueta}
      </label>
      <input
        id={props.id}
        value={props.valor}
        onChange={(e) => props.alCambiar(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete ?? "off"}
        className="h-12 w-full min-w-0 rounded-xl border-0 bg-muted px-3.5 text-base ring-1 ring-border outline-none ring-inset placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Chip(props: { activo: boolean; alTocar: () => void; children: React.ReactNode; ancho?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={props.activo}
      onClick={props.alTocar}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[15px] ring-1 ring-border transition-[background-color,color,box-shadow,transform] duration-150 ring-inset active:scale-[0.97]",
        props.activo ? "bg-lila-claro font-semibold text-verde-oscuro ring-2 ring-violeta" : "bg-card text-foreground/80",
        props.ancho && "w-full",
      )}
    >
      {props.activo && <Check className="size-4" aria-hidden="true" />}
      {props.children}
    </button>
  );
}
