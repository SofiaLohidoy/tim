import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/sesion", () => ({ exigirUsuario: vi.fn(async () => ({ id: "prueba-usuario" })) }));
vi.mock("@/lib/supabase/servicio", () => ({ clienteServicio: vi.fn() }));

import { clienteServicio } from "@/lib/supabase/servicio";
import { empezarPartida } from "@/app/(estudiante)/actividades/acciones";

describe("actividades próximamente", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(["palabra", "crucigrama-1", "crucigrama-2", "crucigrama-3", "einstein-chico", "einstein-equipo"])("no inicia ni escribe una partida de %s aunque se invoque la acción directamente", async (slug) => {
    expect((await empezarPartida(slug)).error).toContain("próximamente");
    expect(clienteServicio).not.toHaveBeenCalled();
  });
});
