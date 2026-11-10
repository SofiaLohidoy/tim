import { afterAll, beforeAll, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";

config({ path: process.env.ENV_ARCHIVO ?? ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const cliente = () => createClient(url, key, { auth: { persistSession: false } });
const suf = randomUUID();
const claveEmpresa = `prueba-lisa-${suf}`;
const ruta = `prueba-${suf}/informe.html.gz`;
const usuarios: string[] = [];
let informe: string;
let lisa: SupabaseClient;
let otra: SupabaseClient;
let estudiante: SupabaseClient;
function ok<T extends { data: unknown; error: unknown }>(r: T): NonNullable<T["data"]> { if (r.error) throw r.error; return r.data as NonNullable<T["data"]>; }

beforeAll(async () => {
  const cuentas: SupabaseClient[] = [];
  for (let n = 0; n < 3; n++) {
    const email = `prueba-informe-${n}-${suf}@tim.test`, password = randomBytes(24).toString("base64url");
    const u = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { given_name: "prueba-Informe" } })).user;
    usuarios.push(u!.id);
    const c = cliente(); ok(await c.auth.signInWithPassword({ email, password })); cuentas.push(c);
  }
  [lisa, otra, estudiante] = cuentas;
  for (const [c, nombre] of [[lisa, `  ${claveEmpresa.toUpperCase()}  `], [otra, `prueba-Otra-${suf}`]] as const)
    ok(await c.rpc("guardar_empresa", { p_nombre: nombre, p_rubro: "prueba-Tecnología", p_tamano: "1-9" }));
  informe = ok(await admin.from("informes_empresa").insert({ empresa_clave: claveEmpresa, titulo: "prueba-Informe privado", archivo_ruta: ruta }).select("id").single()).id;
  ok(await admin.storage.from("informes-empresa").upload(ruta, gzipSync("<!doctype html><p>prueba-Informe ficticio</p>"), { contentType: "application/gzip" }));
});

afterAll(async () => {
  ok(await admin.storage.from("informes-empresa").remove([ruta]));
  if (informe) ok(await admin.from("informes_empresa").delete().eq("id", informe).eq("empresa_clave", claveEmpresa));
  for (const id of usuarios) ok(await admin.auth.admin.deleteUser(id));
});

it("solo la empresa con el nombre exacto normalizado lee metadatos y archivo", async () => {
  expect(ok(await lisa.from("informes_empresa").select("id").eq("id", informe))).toEqual([{ id: informe }]);
  expect((await lisa.storage.from("informes-empresa").download(ruta)).error).toBeNull();
  for (const c of [otra, estudiante, cliente()]) {
    expect((await c.from("informes_empresa").select("id").eq("id", informe)).data ?? []).toEqual([]);
    expect((await c.storage.from("informes-empresa").download(ruta)).error).not.toBeNull();
    expect((await c.storage.from("informes-empresa").createSignedUrl(ruta, 60)).error).not.toBeNull();
  }
  const publico = lisa.storage.from("informes-empresa").getPublicUrl(ruta).data.publicUrl;
  expect((await fetch(publico)).ok).toBe(false);
});

it("la empresa no publica, modifica ni elimina informes o archivos", async () => {
  expect((await lisa.from("informes_empresa").insert({ empresa_clave: claveEmpresa, titulo: "prueba-Intrusión", archivo_ruta: "prueba-intrusion.gz" })).error).not.toBeNull();
  expect((await lisa.from("informes_empresa").update({ titulo: "prueba-Cambio" }).eq("id", informe)).error).not.toBeNull();
  expect((await lisa.from("informes_empresa").delete().eq("id", informe)).error).not.toBeNull();
  expect((await lisa.storage.from("informes-empresa").upload(`prueba-${suf}/otro.gz`, gzipSync("prueba"), { contentType: "application/gzip" })).error).not.toBeNull();
  await lisa.storage.from("informes-empresa").remove([ruta]);
  expect((await admin.storage.from("informes-empresa").download(ruta)).error).toBeNull();
});

it("cambiar el nombre revoca el acceso; no admite coincidencias parciales", async () => {
  ok(await lisa.rpc("guardar_empresa", { p_nombre: `${claveEmpresa} extra`, p_rubro: "prueba-Tecnología", p_tamano: "1-9" }));
  expect(ok(await lisa.from("informes_empresa").select("id").eq("id", informe))).toEqual([]);
  expect((await lisa.storage.from("informes-empresa").download(ruta)).error).not.toBeNull();
  ok(await lisa.rpc("guardar_empresa", { p_nombre: claveEmpresa, p_rubro: "prueba-Tecnología", p_tamano: "1-9" }));
  expect((await lisa.storage.from("informes-empresa").download(ruta)).error).toBeNull();
});
