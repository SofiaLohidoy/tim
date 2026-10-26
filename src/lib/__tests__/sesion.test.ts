import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/servidor", () => ({ clienteServidor: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { destinoSeguro, destinoPara, destinoTrasIngreso } = await import("@/lib/sesion");

describe("recorridos de empresa", () => {
  const empresa = { id: "empresa", email: "prueba-empresa@tim.test", nombre: null, apellido: null, roles: ["empresa" as const], onboardingCompleto: false };
  it("vuelve al perfil de empresa aunque su presentación esté incompleta", () => {
    expect(destinoPara(empresa)).toBe("/empresa");
    expect(destinoTrasIngreso(empresa, null)).toBe("/empresa");
  });
  it("permite empezar el perfil desde el registro sin pasar por el onboarding estudiante", () => {
    expect(destinoTrasIngreso({ ...empresa, roles: [] }, "/empresa")).toBe("/empresa");
  });
  it("conserva la prioridad de los permisos de organización", () => {
    expect(destinoPara({ ...empresa, roles: ["organizador", "empresa"] })).toBe("/organizador");
  });
});

describe("destinoSeguro", () => {
  it.each(["/inicio", "/a/ABC123", "/inicio?asistencia=ok"])("acepta %s", (r) => {
    expect(destinoSeguro(r)).toBe(r);
  });
  it.each(["//otro.com", "/\\otro.com", "/\t/otro.com", "https://otro.com", "otro", "", null])("rechaza %j", (r) => {
    expect(destinoSeguro(r)).toBeNull();
  });
});
