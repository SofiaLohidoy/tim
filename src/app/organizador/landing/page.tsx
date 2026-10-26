import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { TITULOS } from "@/app/(landing)/variantes";
import { Barra, Cifra, Panel, Titulo, Vacio } from "@/components/org/ui";

export const metadata: Metadata = { title: "Landing" };

type Resumen = {
  visitas: { variante: string; visitantes: number }[];
  conversiones: { variante: string; audiencia: string; registros: number }[];
  origenes: { origen: string; visitantes: number }[];
  origenes_registros: { origen: string; audiencia: string; registros: number }[];
  secciones: { seccion: string; visitantes: number }[];
  ctas: { cta: string; variante: string; clics: number }[];
  formularios: { audiencia: string; iniciaron: number; terminaron: number; errores: number }[];
  total_interesados: number;
};

const SECCIONES: Record<string, string> = {
  hero: "Hero", problema: "Problema", como_funciona: "Cómo funciona", que_te_llevas: "Qué te llevás",
  empresas: "Empresas", hackaton: "Hackatón", preguntas: "Preguntas", sumarme: "Sumate",
};

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")} %` : "—");

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador/landing");
  const db = await clienteServidor();
  const { data, error } = await db.rpc("resumen_landing", {});
  if (error || !data) return <Vacio>No pudimos leer las métricas de la landing.</Vacio>;
  const r = data as unknown as Resumen;
  const visitantes = r.visitas.reduce((s, v) => s + v.visitantes, 0);
  const reg = (aud: string) => r.conversiones.filter((c) => c.audiencia === aud).reduce((s, c) => s + c.registros, 0);
  const variantes = ["a", "b"] as const;
  const maxSeccion = Math.max(1, ...r.secciones.map((s) => s.visitantes));

  return (
    <>
      <Titulo ojo="Medición propia">Landing</Titulo>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra tono="verde" valor={visitantes} etiqueta="Visitantes únicos" />
        <Cifra valor={reg("estudiante")} etiqueta="Estudiantes anotados" detalle={`Conversión ${pct(reg("estudiante"), visitantes)}`} />
        <Cifra valor={reg("empresa")} etiqueta="Empresas anotadas" detalle={`Conversión ${pct(reg("empresa"), visitantes)}`} />
        <Cifra valor={r.total_interesados} etiqueta="Interesados en total" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel titulo="Variantes del título" descripcion="Reparto fijo por visitante. Conversión = registros / visitantes de esa variante.">
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-2 font-semibold">Variante</th>
                  <th className="py-2 text-right font-semibold">Visitantes</th>
                  <th className="py-2 text-right font-semibold">Estudiantes</th>
                  <th className="px-5 py-2 text-right font-semibold">Empresas</th>
                </tr>
              </thead>
              <tbody>
                {variantes.map((v) => {
                  const vis = r.visitas.find((x) => x.variante === v)?.visitantes ?? 0;
                  const est = r.conversiones.find((x) => x.variante === v && x.audiencia === "estudiante")?.registros ?? 0;
                  const emp = r.conversiones.find((x) => x.variante === v && x.audiencia === "empresa")?.registros ?? 0;
                  const t = TITULOS[v];
                  return (
                    <tr key={v} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5">
                        <span className="font-semibold uppercase">{v}</span>{" "}
                        <span className="text-muted-foreground">{t.antes + t.destacado + t.despues}</span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{vis}</td>
                      <td className="py-2.5 text-right tabular-nums">{est} · {pct(est, vis)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{emp} · {pct(emp, vis)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Con pocos visitantes la diferencia entre variantes no es concluyente.</p>
        </Panel>

        <Panel titulo="Origen" descripcion="De dónde llegan (utm, QR de la hackatón o sitio de referencia).">
          {r.origenes.length === 0 ? (
            <Vacio>Sin visitas todavía.</Vacio>
          ) : (
            <ul className="grid gap-2 text-sm">
              {r.origenes.map((o) => {
                const regs = r.origenes_registros.filter((x) => x.origen === o.origen).reduce((s, x) => s + x.registros, 0);
                return (
                  <li key={o.origen} className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-2.5">
                    <span className="font-semibold">{o.origen}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {o.visitantes} visitantes · {regs} registros · {pct(regs, o.visitantes)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel titulo="Hasta dónde leen" descripcion="Visitantes que vieron cada sección.">
          {r.secciones.length === 0 ? (
            <Vacio>Sin datos todavía.</Vacio>
          ) : (
            <ul className="grid gap-2.5 text-sm">
              {Object.keys(SECCIONES).map((k) => {
                const n = r.secciones.find((s) => s.seccion === k)?.visitantes ?? 0;
                return (
                  <li key={k} className="grid gap-1">
                    <span className="flex justify-between">
                      <span>{SECCIONES[k]}</span>
                      <span className="text-muted-foreground tabular-nums">{n}</span>
                    </span>
                    <Barra valor={n} total={maxSeccion} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel titulo="Formularios y clics">
          <ul className="grid gap-2 text-sm">
            {r.formularios.map((f) => (
              <li key={f.audiencia} className="rounded-2xl bg-muted px-4 py-2.5">
                <span className="font-semibold capitalize">{f.audiencia}</span>
                <span className="text-muted-foreground">
                  {" "}· empezaron {f.iniciaron} · terminaron {f.terminaron} ({pct(f.terminaron, f.iniciaron)}) · errores {f.errores}
                </span>
              </li>
            ))}
            {r.ctas.slice(0, 12).map((c) => (
              <li key={`${c.cta}:${c.variante}`} className="flex justify-between rounded-2xl px-4 py-1.5">
                <span>{c.cta} <span className="text-muted-foreground uppercase">{c.variante}</span></span>
                <span className="tabular-nums">{c.clics}</span>
              </li>
            ))}
            {r.formularios.length === 0 && r.ctas.length === 0 && <Vacio>Sin datos todavía.</Vacio>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
