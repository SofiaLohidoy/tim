"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BotonImprimir() {
  return (
    <Button onClick={() => window.print()} className="h-11 rounded-xl px-5">
      <Printer className="size-4" /> Imprimir
    </Button>
  );
}
