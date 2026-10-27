import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/sesion", () => ({ exigirRol: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => ({ clienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/servicio", () => ({ clienteServicio: vi.fn() }));
import { exigirRol } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import { clienteServicio } from "@/lib/supabase/servicio";
import { eliminarEstudiante } from "@/app/organizador/acciones";
const id = "11111111-1111-4111-8111-111111111111";
const email = "prueba-eliminar@tim.test";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), borrar: vi.fn(), quitar: vi.fn(), subir: vi.fn(), persona: vi.fn(), listar: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(exigirRol).mockResolvedValue({ id: "organizador", roles: ["organizador"] } as Awaited<ReturnType<typeof exigirRol>>);
  mocks.persona.mockResolvedValue({ data: { email, estudiantes: { cv_path: null }, roles_usuario: [{ rol: "estudiante" }] } });
  const consulta = { select: () => consulta, eq: () => consulta, maybeSingle: mocks.persona };
  vi.mocked(clienteServidor).mockResolvedValue({ from: () => consulta, rpc: mocks.rpc } as unknown as Awaited<ReturnType<typeof clienteServidor>>);
  mocks.listar.mockResolvedValue({ data: [] });
  mocks.rpc.mockResolvedValue({ data: "respaldo" });
  mocks.borrar.mockResolvedValue({ error: null });
  mocks.quitar.mockResolvedValue({ error: null });
  mocks.subir.mockResolvedValue({ error: null });
  const storage = { list: mocks.listar, download: async () => ({ data: new Blob(["prueba-CV"]) }), remove: mocks.quitar, upload: mocks.subir };
  vi.mocked(clienteServicio).mockReturnValue({ storage: { from: () => storage }, auth: { admin: { deleteUser: mocks.borrar } }, from: () => ({ delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }) } as unknown as ReturnType<typeof clienteServicio>);
});
it("un rol no autorizado nunca obtiene el cliente de servicio", async () => {
  vi.mocked(exigirRol).mockRejectedValue(new Error("sin_permiso"));
  await expect(eliminarEstudiante(id, email)).rejects.toThrow("sin_permiso");
  expect(clienteServicio).not.toHaveBeenCalled();
});
it("un mail incorrecto o una cuenta con otro rol impiden borrar", async () => {
  expect((await eliminarEstudiante(id, "prueba-otra@tim.test")).error).toContain("no coincide");
  mocks.persona.mockResolvedValue({ data: { email, estudiantes: {}, roles_usuario: [{ rol: "organizador" }] } });
  expect((await eliminarEstudiante(id, email)).error).toContain("otro rol");
  expect(mocks.borrar).not.toHaveBeenCalled();
});
it("si falla el respaldo, no borra ni CV ni cuenta", async () => {
  mocks.rpc.mockResolvedValue({ error: { message: "sin_respaldo" } });
  expect((await eliminarEstudiante(id, email)).error).toContain("respaldo");
  expect(mocks.quitar).not.toHaveBeenCalled();
  expect(mocks.borrar).not.toHaveBeenCalled();
});
it("restaura el CV si Auth no puede eliminar la cuenta", async () => {
  mocks.listar.mockResolvedValue({ data: [{ name: "cv.pdf" }] });
  mocks.borrar.mockResolvedValue({ error: { message: "fallo" } });
  expect((await eliminarEstudiante(id, email)).error).toContain("siguen guardados");
  expect(mocks.rpc.mock.calls[0][1].p_cv_base64).toBe(Buffer.from("prueba-CV").toString("base64"));
  expect(mocks.subir).toHaveBeenCalledWith(`${id}/cv.pdf`, expect.any(Blob), expect.objectContaining({ upsert: true }));
});
