import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/servidor", () => ({ clienteServidor: vi.fn() }));
vi.mock("@/lib/eventos", () => ({ eventoActual: vi.fn() }));
import { clienteServidor } from "@/lib/supabase/servidor";
import { eventoActual } from "@/lib/eventos";
import { puedeVerEmpresas } from "@/lib/hackaton/acceso";
import type { Usuario } from "@/lib/sesion";
const u: Usuario = { id:"prueba-persona", email:"prueba-persona@tim.test", nombre:null, apellido:null, roles:["estudiante"], onboardingCompleto:true };
const query = { select:vi.fn(), eq:vi.fn(), maybeSingle:vi.fn() };
beforeEach(() => {
  vi.resetAllMocks(); query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  vi.mocked(clienteServidor).mockResolvedValue({ from:vi.fn(() => query) } as unknown as Awaited<ReturnType<typeof clienteServidor>>);
  vi.mocked(eventoActual).mockResolvedValue({ id:"prueba-evento" } as NonNullable<Awaited<ReturnType<typeof eventoActual>>>);
});
it("completar el perfil no alcanza para acceder a las empresas", async () => {
  query.maybeSingle.mockResolvedValue({ data:null, error:null });
  expect(await puedeVerEmpresas(u)).toBe(false);
  expect(query.eq).toHaveBeenCalledWith("usuario_id", u.id);
  expect(query.eq).toHaveBeenCalledWith("evento_id", "prueba-evento");
});
it("la inscripción al evento actual habilita los documentos", async () => {
  query.maybeSingle.mockResolvedValue({ data:{ usuario_id:u.id }, error:null });
  expect(await puedeVerEmpresas(u)).toBe(true);
});
it("un error de permisos no habilita acceso", async () => {
  query.maybeSingle.mockResolvedValue({ data:null, error:{ message:"prueba-error" } });
  expect(await puedeVerEmpresas(u)).toBe(false);
});
it("sin evento o sin onboarding no habilita acceso", async () => {
  expect(await puedeVerEmpresas({ ...u, onboardingCompleto:false })).toBe(false);
  vi.mocked(eventoActual).mockResolvedValue(null);
  expect(await puedeVerEmpresas(u)).toBe(false);
});
it("el staff conserva el acceso para organizar y evaluar", async () => {
  for (const rol of ["organizador", "mentor", "jurado"] as const) {
    expect(await puedeVerEmpresas({ ...u, onboardingCompleto:false, roles:[rol] })).toBe(true);
  }
});
