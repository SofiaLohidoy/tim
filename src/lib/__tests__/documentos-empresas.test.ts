import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("@/lib/supabase/servidor",()=>({clienteServidor:vi.fn()}));
vi.mock("@/lib/sesion",()=>({usuarioActual:vi.fn()}));
vi.mock("@/lib/hackaton/acceso",()=>({puedeVerEmpresas:vi.fn()}));
import { puedeVerEmpresas } from "@/lib/hackaton/acceso";
import { clienteServidor } from "@/lib/supabase/servidor";
const descargar=vi.fn();
import { usuarioActual } from "@/lib/sesion";
import { GET } from "@/app/hackaton/empresas/[empresa]/documento/route";
import { GET as guia } from "@/app/hackaton/guia/documento/route";
const req=new Request("http://localhost:3001/hackaton/empresas/v-go/documento");
const ctx=(empresa="v-go")=>({params:Promise.resolve({empresa})});
beforeEach(()=>{vi.resetAllMocks();descargar.mockResolvedValue({data:new Blob(["%PDF-prueba"]),error:null});vi.mocked(clienteServidor).mockResolvedValue({storage:{from:()=>({download:descargar})}} as unknown as Awaited<ReturnType<typeof clienteServidor>>);});
it("sin sesión no entrega el PDF y pide ingresar",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue(null);
  const r=await GET(req,ctx());expect(r.status).toBe(307);expect(r.headers.get("location")).toContain("/ingresar");expect(descargar).not.toHaveBeenCalled();
});
it("una cuenta sin inscripción no puede leer el documento",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["empresa"],onboardingCompleto:false} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  expect((await GET(req,ctx())).status).toBe(403);expect(descargar).not.toHaveBeenCalled();
});
it("un participante inscripto recibe el PDF sin caché pública",async()=>{
  vi.mocked(puedeVerEmpresas).mockResolvedValue(true);
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["estudiante"],onboardingCompleto:true} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  for(const empresa of ["v-go","kankay","fardo","lisa"]){
    const r=await GET(req,ctx(empresa));expect(r.status).toBe(200);expect(r.headers.get("content-type")).toBe("application/pdf");expect(r.headers.get("cache-control")).toBe("private, no-store");expect(await r.text()).toBe("%PDF-prueba");
    expect(descargar).toHaveBeenLastCalledWith(`${empresa}.pdf`,{cacheNonce:expect.any(String)},{cache:"no-store"});
  }
});
it("ni los pendientes ni las rutas arbitrarias se convierten en archivos del disco",async()=>{
  for(const empresa of ["biotec","programon","constructor","__proto__","../../.env.prod"]){expect((await GET(req,ctx(empresa))).status).toBe(404);}
  expect(descargar).not.toHaveBeenCalled();
});
it("tener el perfil completo sin confirmar el evento no habilita ninguno de los PDF privados",async()=>{
  vi.mocked(usuarioActual).mockResolvedValue({id:"prueba",roles:["estudiante"],onboardingCompleto:true} as NonNullable<Awaited<ReturnType<typeof usuarioActual>>>);
  vi.mocked(puedeVerEmpresas).mockResolvedValue(false);
  for(const empresa of ["v-go","kankay","fardo","lisa"])expect((await GET(req,ctx(empresa))).status).toBe(403);
  expect((await guia(req)).status).toBe(403);
  expect(descargar).not.toHaveBeenCalled();
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
