import QRCode from "qrcode";
import { describir } from "@/lib/actividades/senales";
import { linkLinkedin, nivelesIndividuales, type PerfilTim } from "@/lib/perfil";
import { Credencial } from "./credencial";

const NOMBRE = { persistencia: "Persistencia", uso_de_informacion: "Uso de la información", autocorreccion: "Autocorrección" } as const;

export async function SeccionesPerfil({ perfil }: { perfil: PerfilTim }) {
  const sitio = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3001";
  const url = perfil.credencial ? `${sitio}/v/${perfil.credencial.token}` : null;
  const qr = url ? await QRCode.toString(url, { type: "svg", margin: 0, color: { dark: "#102E28", light: "#FFFFFF" } }) : null;
  const claves = (Object.keys(perfil.senales) as (keyof PerfilTim["senales"])[]).filter((k) => perfil.senales[k].length > 0);

  return (
    <>
      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Tu perfil TIM</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Dato n={perfil.eventos.length} t={perfil.eventos.length === 1 ? "evento" : "eventos"} />
          <Dato n={perfil.partidas} t="partidas" />
          <Dato n={perfil.resueltas} t="resueltas" />
        </div>
        {perfil.eventos.map((ev) => (
          <div key={ev.evento + ev.fecha} className="mt-4 border-t border-border pt-4">
            <p className="font-heading font-bold">{ev.evento}</p>
            <p className="text-xs text-muted-foreground">Lo que observaron mentores y jurados</p>
            <ul className="mt-2 grid gap-1.5">
              {nivelesIndividuales(ev.contenido).map((x) => (
                <li key={x.dimension} className="flex items-center justify-between gap-3 text-sm">
                  <span>{x.dimension}</span>
                  <span className="inline-flex shrink-0 items-center gap-2 text-muted-foreground">
                    <span className="inline-flex gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4].map((n) => <i key={n} className={`size-2 rounded-full ${n <= x.orden ? "bg-violeta" : "bg-border"}`} />)}
                    </span>
                    {x.nivel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {perfil.eventos.length === 0 && perfil.partidas === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Todavía no hay evidencia. Aparece con tu primer desafío o actividad.</p>
        )}
      </section>

      {claves.length > 0 && (
        <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Señales de tus partidas</p>
          <ul className="mt-3 grid gap-4">
            {claves.map((k) => {
              const lista = perfil.senales[k];
              const ultimas = lista.slice(-8);
              const ultima = lista[lista.length - 1];
              return (
                <li key={k}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold">{NOMBRE[k]}</p>
                    <span className="text-xs text-muted-foreground">{lista.length} {lista.length === 1 ? "partida" : "partidas"}</span>
                  </div>
                  <div className="mt-1.5 flex h-8 items-end gap-1" aria-hidden="true">
                    {ultimas.map((s, i) => (
                      <span key={i} className="w-3 rounded-sm bg-lila" style={{ height: `${Math.max(12, s.valor * 100)}%`, opacity: 0.45 + (0.55 * (i + 1)) / ultimas.length }} />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-foreground/80">Última: {describir({ clave: k, valor: ultima.valor, detalle: ultima.detalle }).texto}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Las señales describen cómo jugaste; se vuelven útiles cuando se repiten. No son una nota ni salen en tu credencial pública.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Tu credencial</p>
        <Credencial
          token={perfil.credencial?.token ?? null}
          url={url}
          qr={qr}
          linkedin={url && perfil.credencial ? linkLinkedin({ url, token: perfil.credencial.token, emitida: perfil.credencial.creado_en }) : null}
        />
      </section>
    </>
  );
}

function Dato({ n, t }: { n: number; t: string }) {
  return (
    <div className="rounded-2xl bg-muted py-3">
      <p className="font-heading text-2xl font-extrabold tabular-nums">{n}</p>
      <p className="text-xs text-muted-foreground">{t}</p>
    </div>
  );
}
