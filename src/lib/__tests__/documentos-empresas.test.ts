import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("node:fs/promises",()=>({readFile:vi.fn()}));
vi.mock("@/lib/sesion",()=>({usuarioActual:vi.fn()}));
vi.mock("@/lib/hackaton/acceso",()=>({puedeVerEmpresas:vi.fn()}));
import { puedeVerEmpresas } from "@/lib/hackaton/acceso";
import { readFile } from "node:fs/promises";
import { usuarioActual } from "@/lib/sesion";
import { GET } from "@/app/hackaton/empresas/[empresa]/documento/route";
import { GET as guia } from "@/app/hackaton/guia/documento/route";
const req=new Request("http://localhost:3001/hackaton/empresas/v-go/documento");
const ctx=(empresa="v-go")=>({params:Promise.resolve({empresa})});
beforeEach(()=>{vi.resetAllMocks();vi.mocked(readFile).mockResolvedValue(Buffer.from("%PDF-prueba"));});
it("sin sesión no entrega el PDF y pide ingresar",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue(null);
  const r=await GET(req,ctx());expect(r.status).toBe(307);expect(r.headers.get("location")).toContain("/ingresar");expect(readFile).not.toHaveBeenCalled();
});
it("una cuenta sin inscripción no puede leer el documento",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["empresa"],onboardingCompleto:false} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  expect((await GET(req,ctx())).status).toBe(403);expect(readFile).not.toHaveBeenCalled();
});
it("un participante inscripto recibe el PDF sin caché pública",async()=>{
  vi.mocked(puedeVerEmpresas).mockResolvedValue(true);
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["estudiante"],onboardingCompleto:true} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  const r=await GET(req,ctx());expect(r.status).toBe(200);expect(r.headers.get("content-type")).toBe("application/pdf");expect(r.headers.get("cache-control")).toBe("private, no-store");expect(await r.text()).toBe("%PDF-prueba");
});
it("ni los pendientes ni las rutas arbitrarias se convierten en archivos del disco",async()=>{
  for(const empresa of ["kankay","programon","fardo","lisa","../../.env.prod"]){expect((await GET(req,ctx(empresa))).status).toBe(404);}
  expect(readFile).not.toHaveBeenCalled();
});
it("tener el perfil completo sin confirmar el evento no habilita ninguno de los PDF privados",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["estudiante"],onboardingCompleto:true} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  vi.mocked(puedeVerEmpresas).mockResolvedValue(false);
  expect((await GET(req,ctx())).status).toBe(403);
  expect((await guia(req)).status).toBe(403);
  expect(readFile).not.toHaveBeenCalled();
});
it("la guía completa exige sesión y entrega un archivo privado al confirmar inscripción",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue(null);
  expect((await guia(req)).status).toBe(307);
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["estudiante"],onboardingCompleto:true} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  vi.mocked(puedeVerEmpresas).mockResolvedValue(true);
  const r=await guia(req);
  expect(r.status).toBe(200);expect(r.headers.get("cache-control")).toBe("private, no-store");
  expect(r.headers.get("content-disposition")).toContain("attachment");
});
