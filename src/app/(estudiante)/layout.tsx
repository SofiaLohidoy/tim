import { Suspense } from "react";
import { BarraEstudiante } from "@/components/app/barra-estudiante";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <BarraEstudiante />
      </Suspense>
    </>
  );
}
