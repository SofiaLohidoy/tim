"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ANIOS, DESAFIO, FRENOS, TAMANIOS } from "@/lib/landing/esquemas";
import { enviarEvento, leerOrigen } from "@/lib/landing/origen";
import { registrarInteres, type EstadoInteres } from "./acciones";

const INICIAL: EstadoInteres = { estado: "inicial" };

export function FormInteres({ audiencia }: { audiencia: "estudiante" | "empresa" }) {
  const [estado, enviar, enviando] = useActionState(registrarInteres, INICIAL);
  const origenRef = useRef<HTMLInputElement>(null);
  const empezo = useRef(false);

  useEffect(() => {
    if (origenRef.current) origenRef.current.value = JSON.stringify(leerOrigen());
  }, []);

  useEffect(() => {
    if (estado.estado === "error") enviarEvento("form_error", audiencia);
  }, [estado, audiencia]);

  const alEmpezar = () => {
    if (empezo.current) return;
    empezo.current = true;
    enviarEvento("form_inicio", audiencia);
  };

  if (estado.estado === "ok") {
    return (
      <div className="form claro" role="status">
        <div className="listo">
          <span className="ok">
            <Check aria-hidden="true" />
          </span>
          <h3>Listo, quedaste anotado.</h3>
          <p>
            {audiencia === "estudiante"
              ? "Te escribimos cuando abra el próximo desafío."
              : "Te escribimos para contarte cómo proponer un desafío."}
          </p>
        </div>
      </div>
    );
  }

  const err = estado.campos ?? {};
  const v = estado.valores ?? {};
  const id = (c: string) => `${audiencia}-${c}`;

  return (
    <form action={enviar} className="form claro" onFocus={alEmpezar} noValidate key={JSON.stringify(v)}>
      <div>
        <h3>{audiencia === "estudiante" ? "Quiero sumarme" : "Quiero conocer talento"}</h3>
      </div>
      <p className="ayuda">
        {audiencia === "estudiante" ? "Cuatro datos y listo." : "Cuatro datos. Te contactamos nosotros."}
      </p>
      <input type="hidden" name="audiencia" value={audiencia} />
      <input type="hidden" name="origen" ref={origenRef} defaultValue="{}" />
      <input className="hp" type="text" name="sitio" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="campo">
        <label htmlFor={id("email")}>{audiencia === "estudiante" ? "Tu mail" : "Mail de trabajo"}</label>
        <input
          id={id("email")}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={v.email}
          aria-invalid={Boolean(err.email)}
          aria-describedby={err.email ? id("email-err") : undefined}
        />
        {err.email && (
          <p className="error" id={id("email-err")}>
            {err.email}
          </p>
        )}
      </div>

      {audiencia === "estudiante" ? (
        <>
          <div className="campo">
            <label htmlFor={id("carrera")}>Qué estudiás</label>
            <input
              id={id("carrera")}
              name="carrera"
              type="text"
              autoComplete="off"
              placeholder="Ej.: Economía, Diseño, Sistemas"
              defaultValue={v.carrera}
              aria-invalid={Boolean(err.carrera)}
            />
            {err.carrera && <p className="error">{err.carrera}</p>}
          </div>
          <fieldset className="campo">
            <legend>En qué año estás</legend>
            <div className="opciones">
              {ANIOS.map((a) => (
                <label key={a}>
                  <input type="radio" name="anio" value={a} defaultChecked={v.anio === a} />
                  {a}
                </label>
              ))}
            </div>
            {err.anio && <p className="error">{err.anio}</p>}
          </fieldset>
          <fieldset className="campo">
            <legend>¿Qué te frena hoy?</legend>
            <div className="opciones columna">
              {Object.entries(FRENOS).map(([valor, texto]) => (
                <label key={valor}>
                  <input type="radio" name="freno" value={valor} defaultChecked={v.freno === valor} />
                  {texto}
                </label>
              ))}
            </div>
            {err.freno && <p className="error">{err.freno}</p>}
          </fieldset>
        </>
      ) : (
        <>
          <fieldset className="campo">
            <legend>Personas en tu empresa</legend>
            <div className="opciones">
              {TAMANIOS.map((t) => (
                <label key={t}>
                  <input type="radio" name="tamanio" value={t} defaultChecked={v.tamanio === t} />
                  {t}
                </label>
              ))}
            </div>
            {err.tamanio && <p className="error">{err.tamanio}</p>}
          </fieldset>
          <div className="campo">
            <label htmlFor={id("rubro")}>Rubro</label>
            <input
              id={id("rubro")}
              name="rubro"
              type="text"
              placeholder="Ej.: logística, software, gastronomía"
              defaultValue={v.rubro}
              aria-invalid={Boolean(err.rubro)}
            />
            {err.rubro && <p className="error">{err.rubro}</p>}
          </div>
          <fieldset className="campo">
            <legend>¿Propondrías un desafío?</legend>
            <div className="opciones">
              {DESAFIO.map((d) => (
                <label key={d}>
                  <input type="radio" name="propondria" value={d} defaultChecked={v.propondria === d} />
                  {d}
                </label>
              ))}
            </div>
            {err.propondria && <p className="error">{err.propondria}</p>}
          </fieldset>
        </>
      )}

      {estado.estado === "error" && !estado.campos && <p className="error">{estado.error}</p>}
      <button type="submit" className="btn btn-violeta" disabled={enviando}>
        {enviando ? "Guardando…" : audiencia === "estudiante" ? "Quiero sumarme" : "Quiero conocer talento"}
        {!enviando && <ArrowRight aria-hidden="true" />}
      </button>
      <p className="legal">Usamos tu mail solo para avisarte de TIM. Podés pedir que lo borremos cuando quieras.</p>
    </form>
  );
}
