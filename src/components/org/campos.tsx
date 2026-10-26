import { cn } from "@/lib/utils";

export const claseInput =
  "h-11 w-full min-w-0 rounded-xl border-0 bg-muted px-3.5 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring md:text-[15px]";

export function Campo({ etiqueta, htmlFor, children, ayuda, className }: { etiqueta: string; htmlFor: string; children: React.ReactNode; ayuda?: string; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

export function Mensaje({ r }: { r: { error?: string; mensaje?: string } }) {
  if (r.error) return <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{r.error}</p>;
  if (r.mensaje) return <p role="status" className="rounded-xl bg-lila-claro px-3 py-2 text-sm font-medium text-verde-oscuro">{r.mensaje}</p>;
  return null;
}
