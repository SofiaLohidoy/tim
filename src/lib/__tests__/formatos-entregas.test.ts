import { expect,it } from "vitest";
import { tipoPermitido } from "@/lib/entregas";
it("distingue los formatos del documento y de la presentación",()=>{
  const word="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const ppt="application/vnd.openxmlformats-officedocument.presentationml.presentation";
  expect(tipoPermitido("documento",word)).toBe(true);
  expect(tipoPermitido("documento",ppt)).toBe(false);
  expect(tipoPermitido("presentacion",ppt)).toBe(true);
  expect(tipoPermitido("presentacion",word)).toBe(false);
  for(const tipo of ["documento","presentacion"] as const){expect(tipoPermitido(tipo,"application/pdf")).toBe(true);expect(tipoPermitido(tipo,"text/html")).toBe(false);}
});
