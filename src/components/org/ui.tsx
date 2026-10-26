import { cn } from "@/lib/utils";

export function Titulo({ ojo, children, accion }: { ojo?: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {ojo && <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">{ojo}</p>}
        <h1 className="mt-1 text-[1.8rem] leading-tight font-extrabold">{children}</h1>
      </div>
      {accion}
    </div>
  );
}

export function Panel({ children, className, titulo, descripcion }: { children: React.ReactNode; className?: string; titulo?: string; descripcion?: string }) {
  return (
    <section className={cn("rounded-3xl bg-card p-5 ring-1 ring-border", className)}>
      {titulo && <h2 className="text-lg font-extrabold">{titulo}</h2>}
      {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
      <div className={titulo || descripcion ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}

export function Cifra({ valor, etiqueta, detalle, tono }: { valor: string | number; etiqueta: string; detalle?: string; tono?: "verde" }) {
  return (
    <div className={cn("rounded-3xl p-5 ring-1 ring-border", tono === "verde" ? "bg-primary text-primary-foreground ring-0" : "bg-card")}>
      <p className={cn("text-sm font-semibold", tono === "verde" ? "text-primary-foreground/75" : "text-muted-foreground")}>{etiqueta}</p>
      <p className="mt-1 font-heading text-4xl font-extrabold tracking-tight tabular-nums">{valor}</p>
      {detalle && <p className={cn("mt-1 text-sm", tono === "verde" ? "text-primary-foreground/70" : "text-muted-foreground")}>{detalle}</p>}
    </div>
  );
}

export function Barra({ valor, total }: { valor: number; total: number }) {
  const p = total ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
      <span className="block h-full origin-left rounded-full bg-violeta transition-transform duration-500" style={{ transform: `scaleX(${p / 100})` }} />
    </span>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-muted px-4 py-6 text-center text-muted-foreground">{children}</p>;
}
