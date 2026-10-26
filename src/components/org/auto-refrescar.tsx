"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/** Refresca el tablero cada 15 s mientras la pestaña está visible. */
export function AutoRefrescar({ segundos = 15 }: { segundos?: number }) {
  const router = useRouter();
  const [hora, setHora] = useState<string>("");
  useEffect(() => {
    const marcar = () => setHora(new Intl.DateTimeFormat("es-AR", { timeStyle: "medium" }).format(new Date()));
    marcar();
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      marcar();
    }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <RefreshCw className="size-3.5" /> En vivo · {hora}
    </span>
  );
}
