import { cn } from "@/lib/utils";

export function EstadoChip({ estado }: { estado: "borrador" | "enviada" | null | undefined }) {
  const texto = estado === "enviada" ? "Enviada" : estado === "borrador" ? "Empezada" : "Sin empezar";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        estado === "enviada" && "bg-primary text-primary-foreground",
        estado === "borrador" && "bg-lila-claro text-verde-oscuro",
        !estado && "bg-muted text-muted-foreground",
      )}
    >
      {texto}
    </span>
  );
}
