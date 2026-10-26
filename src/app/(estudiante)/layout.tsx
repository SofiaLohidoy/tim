import { BarraEstudiante } from "@/components/app/barra-estudiante";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <BarraEstudiante />
    </>
  );
}
