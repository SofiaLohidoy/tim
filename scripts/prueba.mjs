// Datos de prueba con prefijo `prueba-`. Nunca se presentan como reales y se borran al terminar.
//   node scripts/prueba.mjs crear     → cuentas de staff y estudiantes, equipos y asignaciones
//   node scripts/prueba.mjs limpiar   → borra todo lo `prueba-` (cuentas, eventos, equipos, landing)
// Lee .env.local (o las variables del entorno). La clave de las cuentas es PRUEBA_CLAVE.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: process.env.ENV_ARCHIVO ?? ".env.local", quiet: true });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRETA = process.env.SUPABASE_SECRET_KEY;
export const CLAVE = process.env.PRUEBA_CLAVE ?? "prueba-tim-2026";
export const DOMINIO = "tim.test";

export function admin() {
  if (!URL || !SECRETA) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY (ver .env.example).");
  return createClient(URL, SECRETA, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const mail = (quien) => `prueba-${quien}@${DOMINIO}`;

async function cuenta(db, quien, nombre, apellido) {
  const email = mail(quien);
  const { data, error } = await db.auth.admin.createUser({ email, password: CLAVE, email_confirm: true, user_metadata: { given_name: nombre, family_name: apellido } });
  if (!error) return data.user.id;
  if (!/already/i.test(error.message)) throw error;
  const { data: p } = await db.from("perfiles").select("id").eq("email", email).single();
  return p.id;
}

export async function crear({ estudiantes = 8, equipos = 2 } = {}) {
  const db = admin();
  let { data: evento } = await db.from("eventos").select("id, nombre, rubrica_id").neq("estado", "cerrado").order("fecha").limit(1).maybeSingle();
  if (!evento) {
    const { data: plantilla } = await db.from("rubricas").select("id").eq("es_plantilla", true).limit(1).single();
    ({ data: evento } = await db
      .from("eventos")
      .insert({ nombre: "prueba-Hackatón", fecha: new Date().toISOString().slice(0, 10), estado: "en_curso", rubrica_id: plantilla.id })
      .select("id, nombre, rubrica_id")
      .single());
    await db.from("codigos_asistencia").insert({ evento_id: evento.id, codigo: "PRUEBA" });
  }

  const organizador = await cuenta(db, "organizador", "Olga", "Prueba");
  await db.from("roles_usuario").upsert({ usuario_id: organizador, rol: "organizador", evento_id: null }, { onConflict: "usuario_id,rol,evento_id", ignoreDuplicates: true });

  const ids = { organizador, mentores: [], jurado: null, estudiantes: [], equipos: [] };
  ids.jurado = await cuenta(db, "jurado", "Julia", "Prueba");
  await db.from("roles_usuario").upsert({ usuario_id: ids.jurado, rol: "jurado", evento_id: evento.id }, { onConflict: "usuario_id,rol,evento_id", ignoreDuplicates: true });

  for (let q = 1; q <= equipos; q++) {
    const nombre = `prueba-Equipo ${q}`;
    let { data: eq } = await db.from("equipos").select("id").eq("evento_id", evento.id).eq("nombre", nombre).maybeSingle();
    if (!eq) ({ data: eq } = await db.from("equipos").insert({ evento_id: evento.id, nombre }).select("id").single());
    ids.equipos.push(eq.id);
    const mentor = await cuenta(db, `mentor-${q}`, `Mentor${q}`, "Prueba");
    ids.mentores.push(mentor);
    await db.from("roles_usuario").upsert({ usuario_id: mentor, rol: "mentor", evento_id: evento.id }, { onConflict: "usuario_id,rol,evento_id", ignoreDuplicates: true });
    await db.from("asignaciones").upsert({ evento_id: evento.id, equipo_id: eq.id, evaluador_id: mentor, rol: "mentor" }, { onConflict: "equipo_id,evaluador_id,rol", ignoreDuplicates: true });
    await db.from("asignaciones").upsert({ evento_id: evento.id, equipo_id: eq.id, evaluador_id: ids.jurado, rol: "jurado" }, { onConflict: "equipo_id,evaluador_id,rol", ignoreDuplicates: true });
  }

  for (let i = 1; i <= estudiantes; i++) {
    const id = await cuenta(db, `estudiante-${i}`, `Estudiante${i}`, "Prueba");
    ids.estudiantes.push(id);
    const ahora = new Date().toISOString();
    await db.from("estudiantes").upsert({
      usuario_id: id, universidad: "prueba-UTDT", carrera: "prueba-Economía", anio_carrera: "4.º", intereses: ["Finanzas"],
      arquetipo: "no_sabe_demostrar", consentimiento_en: ahora, onboarding_completo_en: ahora,
    });
    const equipo = ids.equipos[(i - 1) % ids.equipos.length];
    await db.from("miembros_equipo").upsert({ equipo_id: equipo, evento_id: evento.id, usuario_id: id }, { onConflict: "evento_id,usuario_id", ignoreDuplicates: true });
  }
  return { evento, ...ids };
}

export async function limpiar() {
  const db = admin();
  let borrados = 0;
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email?.startsWith("prueba-")) {
        await db.auth.admin.deleteUser(u.id);
        borrados++;
      }
    }
    if (data.users.length < 200) break;
  }
  await db.from("equipos").delete().like("nombre", "prueba-%");
  await db.from("eventos").delete().like("nombre", "prueba-%");
  await db.from("invitaciones").delete().like("email", "prueba-%");
  await db.from("interesados").delete().like("email", "prueba-%");
  await db.from("eventos_landing").delete().like("visitante_id", "prueba-%");
  return borrados;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const accion = process.argv[2];
  if (accion === "crear") {
    const arg = (n, def) => Number(process.argv[process.argv.indexOf(`--${n}`) + 1]) || def;
    const r = await crear({ estudiantes: arg("estudiantes", 8), equipos: arg("equipos", 2) });
    console.log(`Listo en "${r.evento.nombre}": ${r.estudiantes.length} estudiantes, ${r.mentores.length} mentores, 1 jurado, 1 organizador (${mail("organizador")}). Clave: PRUEBA_CLAVE.`);
  } else if (accion === "limpiar") {
    console.log(`Borradas ${await limpiar()} cuentas prueba- y sus datos.`);
  } else {
    console.log("Uso: node scripts/prueba.mjs crear|limpiar");
    process.exit(1);
  }
}
