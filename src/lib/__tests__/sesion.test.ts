import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/servidor", () => ({ clienteServidor: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { destinoSeguro } = await import("@/lib/sesion");

describe("destinoSeguro", () => {
  it.each(["/inicio", "/a/ABC123", "/inicio?asistencia=ok"])("acepta %s", (r) => {
    expect(destinoSeguro(r)).toBe(r);
  });
  it.each(["//otro.com", "/\\otro.com", "/\t/otro.com", "https://otro.com", "otro", "", null])("rechaza %j", (r) => {
    expect(destinoSeguro(r)).toBeNull();
  });
});
