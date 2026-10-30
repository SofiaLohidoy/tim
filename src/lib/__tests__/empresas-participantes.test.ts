import { expect,it } from "vitest";
import { EMPRESAS_HACKATON,empresaParticipante } from "@/lib/hackaton/empresas";
it("ofrece solo las empresas vigentes y no muestra una elección retirada",()=>{
  expect(EMPRESAS_HACKATON.map(e=>e.nombre)).toEqual(["Kankay","V-go","Fardo","Lisa"]);
  expect(empresaParticipante("Programon")).toBeNull();
  expect(empresaParticipante("V-go")).toBe("V-go");
  expect(empresaParticipante(null)).toBeNull();
});
