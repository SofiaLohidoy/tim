import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { execSync } from "node:child_process";

// Las reglas de quién ve qué se hacen cumplir en la base. Estos tests entran como cada rol con la
// clave pública (la misma que usa el navegador) y prueban que la RLS no deje pasar lo que no debe.
config({ path: ".env.local", quiet: true });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const CLAVE = process.env.PRUEBA_CLAVE ?? "prueba-tim-2026";
const admin = createClient(URL, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

async function como(quien: string): Promise<SupabaseClient> {
  const c = createClient(URL, PUBLICA, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email: `prueba-${quien}@tim.test`, password: CLAVE });
  if (error) throw error;
  return c;
}
const anonimo = () => createClient(URL, PUBLICA, { auth: { persistSession: false } });

describe("perfil de empresa", () => {
  let empresa: SupabaseClient;
  let otra: SupabaseClient;
  beforeAll(async () => {
    for (const quien of ["empresa-a", "empresa-b"]) {
      const { error } = await admin.auth.admin.createUser({ email: `prueba-${quien}@tim.test`, password: CLAVE, email_confirm: true });
      if (error) throw error;
    }
    empresa = await como("empresa-a");
    otra = await como("empresa-b");
  });
  it("rechaza altas anónimas y datos fuera de los límites", async () => {
    expect((await anonimo().rpc("guardar_empresa", { p_nombre: "prueba-X", p_rubro: "Servicios", p_tamano: "1-9" })).error).not.toBeNull();
    expect((await empresa.rpc("guardar_empresa", { p_nombre: "x", p_rubro: "Servicios", p_tamano: "1-9" })).error?.message).toContain("datos_empresa_invalidos");
  });
  it("solo permite leer y actualizar la empresa propia", async () => {
    for (const [cliente, nombre] of [[empresa, "prueba-Empresa A"], [otra, "prueba-Empresa B"]] as const) {
      expect((await cliente.rpc("guardar_empresa", { p_nombre: nombre, p_rubro: "Servicios", p_tamano: "10-49" })).error).toBeNull();
    }
    expect((await empresa.from("empresas").select("nombre")).data).toEqual([{ nombre: "prueba-Empresa A" }]);
    const ajena = await idDe("empresa-b");
    expect((await empresa.from("empresas").update({ nombre: "prueba-Intrusión" }).eq("usuario_id", ajena)).error).not.toBeNull();
    expect((await otra.from("empresas").select("nombre")).data).toEqual([{ nombre: "prueba-Empresa B" }]);
  });
  it("el registro no da permisos de staff ni acceso a estudiantes", async () => {
    expect((await empresa.rpc("iniciar_registro_empresa")).error).toBeNull();
    expect((await empresa.from("roles_usuario").select("rol")).data).toEqual([{ rol: "empresa" }]);
    expect((await empresa.from("estudiantes").select("usuario_id,cv_path")).data).toEqual([]);
    const estudiante = await idDe("estudiante-1");
    expect((await empresa.from("perfiles").select("email").eq("id", estudiante)).data).toEqual([]);
    expect((await empresa.from("roles_usuario").insert({ usuario_id: await idDe("empresa-a"), rol: "organizador" })).error?.code).toBe("42501");
  });
});
const idDe = async (quien: string) =>
  (await admin.from("perfiles").select("id").eq("email", `prueba-${quien}@tim.test`).single()).data!.id as string;

let evento: string;
let equipo1: string;
let equipo2: string;

beforeAll(async () => {
  execSync("node scripts/prueba.mjs limpiar && node scripts/prueba.mjs crear --estudiantes 4 --equipos 2", { stdio: "inherit" });
  const { data: eqs } = await admin.from("equipos").select("id, nombre, evento_id").like("nombre", "prueba-Equipo %").order("nombre");
  equipo1 = eqs![0].id;
  equipo2 = eqs![1].id;
  evento = eqs![0].evento_id;
});

afterAll(() => {
  execSync("node scripts/prueba.mjs limpiar", { stdio: "ignore" });
});

describe("mentor", () => {
  it("ve a las personas de su equipo y no las de otro", async () => {
    const m = await como("mentor-1");
    const { data } = await m.from("miembros_equipo").select("usuario_id, equipo_id");
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((x) => x.equipo_id === equipo1)).toBe(true);

    const ajena = (await admin.from("miembros_equipo").select("usuario_id").eq("equipo_id", equipo2).limit(1).single()).data!.usuario_id;
    const perfil = await m.from("perfiles").select("id").eq("id", ajena);
    expect(perfil.data).toEqual([]);
  });

  it("no puede evaluar a alguien de otro equipo", async () => {
    const m = await como("mentor-1");
    const ajena = (await admin.from("miembros_equipo").select("usuario_id").eq("equipo_id", equipo2).limit(1).single()).data!.usuario_id;
    const { data: rub } = await admin.from("eventos").select("rubrica_id").eq("id", evento).single();
    const yo = await idDe("mentor-1");
    const { error } = await m.from("evaluaciones").insert({
      evento_id: evento, equipo_id: equipo2, rubrica_id: rub!.rubrica_id, evaluador_id: yo,
      rol_evaluador: "mentor", objetivo: "persona", estudiante_id: ajena,
    });
    expect(error?.code).toBe("42501");
  });

  it("no ve las evaluaciones de otro evaluador", async () => {
    const { data: rub } = await admin.from("eventos").select("rubrica_id").eq("id", evento).single();
    const jurado = await idDe("jurado");
    await admin.from("evaluaciones").insert({
      evento_id: evento, equipo_id: equipo1, rubrica_id: rub!.rubrica_id, evaluador_id: jurado,
      rol_evaluador: "jurado", objetivo: "equipo", estado: "enviada",
    });
    const m = await como("mentor-1");
    const { data } = await m.from("evaluaciones").select("id, evaluador_id");
    expect(data!.some((x) => x.evaluador_id === jurado)).toBe(false);
  });

  it("no puede darse un rol a sí mismo", async () => {
    const m = await como("mentor-1");
    const { error } = await m.from("roles_usuario").insert({ usuario_id: await idDe("mentor-1"), rol: "organizador" });
    expect(error?.code).toBe("42501");
  });
});

describe("estudiante", () => {
  it("no ve devoluciones sin publicar y sí después de publicar", async () => {
    const yo = await idDe("estudiante-1");
    await admin.from("devoluciones").upsert(
      { evento_id: evento, estudiante_id: yo, contenido: { version: 1, equipo: "x", dimensiones: [], comentarios: [] }, publicada_en: null },
      { onConflict: "evento_id,estudiante_id" },
    );
    const e = await como("estudiante-1");
    expect((await e.from("devoluciones").select("id")).data).toEqual([]);

    await admin.from("devoluciones").update({ publicada_en: new Date().toISOString() }).eq("estudiante_id", yo);
    expect((await e.from("devoluciones").select("id")).data).toHaveLength(1);
  });

  it("no ve la devolución de otra persona aunque esté publicada", async () => {
    const otra = await idDe("estudiante-2");
    await admin.from("devoluciones").upsert(
      { evento_id: evento, estudiante_id: otra, contenido: { version: 1, equipo: "x", dimensiones: [], comentarios: [] }, publicada_en: new Date().toISOString() },
      { onConflict: "evento_id,estudiante_id" },
    );
    const e = await como("estudiante-1");
    const { data } = await e.from("devoluciones").select("estudiante_id");
    expect(data!.every((d) => d.estudiante_id !== otra)).toBe(true);
  });

  it("no lee el código de asistencia ni los datos de la landing", async () => {
    const e = await como("estudiante-1");
    expect((await e.from("codigos_asistencia").select("codigo")).data).toEqual([]);
    expect((await e.from("interesados").select("id")).data).toEqual([]);
    expect((await e.from("eventos_landing").select("id")).data).toEqual([]);
    expect((await e.rpc("resumen_landing", {})).error).not.toBeNull();
  });

  it("no ve el registro ni el CV de otra persona", async () => {
    const e = await como("estudiante-1");
    const { data } = await e.from("estudiantes").select("usuario_id");
    expect(data).toEqual([{ usuario_id: await idDe("estudiante-1") }]);
  });

  it("solo marca asistencia con el código vigente", async () => {
    await admin.from("codigos_asistencia").upsert({ evento_id: evento, codigo: "RLSOK1", codigo_anterior: null, rotado_en: new Date().toISOString() });
    const e = await como("estudiante-3");
    expect((await e.rpc("marcar_asistencia", { p_codigo: "MALO99" })).error?.message).toContain("codigo_invalido");
    expect((await e.rpc("marcar_asistencia", { p_codigo: "rlsok1" })).error).toBeNull();
  });
});

describe("anónimo", () => {
  it("no escribe en la landing directo (solo por el servidor)", async () => {
    const { error } = await anonimo().from("interesados").insert({ audiencia: "estudiante", email: "prueba-anon@tim.test" });
    expect(error).not.toBeNull();
    const { error: e2 } = await anonimo().from("eventos_landing").insert({ visitante_id: "prueba-x", tipo: "visita" });
    expect(e2).not.toBeNull();
  });

  it("no lee nada de la app", async () => {
    for (const t of ["perfiles", "estudiantes", "evaluaciones", "devoluciones", "equipos"] as const) {
      expect((await anonimo().from(t).select("*")).data ?? []).toEqual([]);
    }
  });
});

describe("invitaciones de staff", () => {
  it("con mail y contraseña el rol no se aplica por coincidencia de mail, solo con el link", async () => {
    const email = "prueba-impostor@tim.test";
    const { data: inv } = await admin
      .from("invitaciones")
      .insert({ email, rol: "mentor", evento_id: evento, equipo_id: equipo1 })
      .select("token")
      .single();
    const c = anonimo();
    await c.auth.signUp({ email, password: CLAVE });
    expect((await c.from("roles_usuario").select("rol")).data).toEqual([]);

    const { error } = await c.rpc("reclamar_invitacion", { p_token: inv!.token });
    expect(error).toBeNull();
    expect((await c.from("roles_usuario").select("rol")).data).toEqual([{ rol: "mentor" }]);
  });

  it("el link no sirve logueado con otro mail", async () => {
    const { data: inv } = await admin.from("invitaciones").insert({ email: "prueba-otra@tim.test", rol: "jurado", evento_id: evento }).select("token").single();
    const e = await como("estudiante-4");
    const { error } = await e.rpc("reclamar_invitacion", { p_token: inv!.token });
    expect(error?.message).toContain("otro_mail");
  });
});
