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

describe("respaldo de eliminación", () => {
  it("solo el organizador puede respaldar; nadie puede leer respaldos desde el navegador", async () => {
    const estudiante = await como("estudiante-1");
    const mentor = await como("mentor-1");
    const jurado = await como("jurado");
    const org = await como("organizador");
    const destino = await idDe("estudiante-1");
    for (const c of [anonimo(), estudiante, mentor, jurado]) {
      expect((await c.rpc("respaldar_estudiante", { p_usuario: destino, p_email: "prueba-estudiante-1@tim.test" })).error).not.toBeNull();
    }
    for (const c of [anonimo(), estudiante, org]) {
      expect((await c.from("respaldos_eliminacion").select("*")).error).not.toBeNull();
    }
    expect((await org.rpc("respaldar_estudiante", { p_usuario: await idDe("organizador"), p_email: "prueba-organizador@tim.test" })).error?.message).toContain("cuenta_protegida");
    expect((await org.rpc("respaldar_estudiante", { p_usuario: destino, p_email: "prueba-otro@tim.test" })).error?.message).toContain("mail_no_coincide");
    const respaldo = await org.rpc("respaldar_estudiante", { p_usuario: destino, p_email: "prueba-estudiante-1@tim.test" });
    expect(respaldo.error).toBeNull();
    try {
      expect((await admin.from("respaldos_eliminacion").select("usuario_id").eq("id", respaldo.data).single()).data?.usuario_id).toBe(destino);
    } finally {
      if (respaldo.data) await admin.from("respaldos_eliminacion").delete().eq("id", respaldo.data).eq("usuario_id", destino);
    }
  });
});

describe("empresa elegida y presentación independiente", () => {
  it("solo un integrante elige una empresa válida para su equipo", async () => {
    const e=await como("estudiante-1"),otra=await como("estudiante-2"),j=await como("jurado");
    for(const c of [otra,j,anonimo()])expect((await c.rpc("elegir_empresa_equipo",{p_equipo:equipo1,p_empresa:"V-go"})).error).not.toBeNull();
    expect((await e.rpc("elegir_empresa_equipo",{p_equipo:equipo1,p_empresa:"inventada"})).error?.message).toContain("empresa_invalida");
    expect((await e.rpc("elegir_empresa_equipo",{p_equipo:equipo1,p_empresa:"Programon"})).error?.message).toContain("empresa_invalida");
    expect((await e.rpc("elegir_empresa_equipo",{p_equipo:equipo1,p_empresa:"BIOTEC"})).error?.message).toContain("empresa_invalida");
    expect((await e.rpc("elegir_empresa_equipo",{p_equipo:equipo1,p_empresa:"V-go"})).error).toBeNull();
    expect((await j.from("equipos").select("empresa_elegida").eq("id",equipo1).single()).data?.empresa_elegida).toBe("V-go");
  });
  it("las dos entregas son independientes y la presentación respeta asignación y cierre", async () => {
    const e=await como("estudiante-1"),otra=await como("estudiante-2"),j=await como("jurado"),mentor=await como("mentor-1"),org=await como("organizador");
    const rutas=[`${equipo1}/prueba-doc-${crypto.randomUUID()}.pdf`,`${equipo1}/presentacion/prueba-presentacion-${crypto.randomUUID()}.pdf`];
    const bytes=Buffer.from("%PDF-1.4 prueba-dos-entregas");
    try {
      for(const ruta of rutas)expect((await admin.storage.from("entregas").upload(ruta,bytes,{contentType:"application/pdf"})).error).toBeNull();
      const args={p_equipo:equipo1,p_ruta:rutas[1],p_nombre:"prueba-presentacion.pdf",p_tipo:"application/pdf",p_tamano:bytes.length};
      for(const c of [otra,j,mentor,anonimo()])expect((await c.rpc("guardar_presentacion_equipo",args)).error).not.toBeNull();
      expect((await e.rpc("guardar_archivo_entrega",{...args,p_ruta:rutas[0],p_nombre:"prueba-doc.pdf"})).error).toBeNull();
      expect((await e.rpc("guardar_presentacion_equipo",args)).error).toBeNull();
      expect((await e.rpc("guardar_presentacion_equipo",{...args,p_ruta:rutas[0]})).error?.message).toContain("archivo_invalido");
      expect((await e.rpc("guardar_archivo_entrega",args)).error?.message).toContain("archivo_invalido");
      expect((await e.from("entregas_equipo").select("archivo_path").eq("equipo_id",equipo1).single()).data?.archivo_path).toBe(rutas[0]);
      for(const c of [e,j,org])expect((await c.storage.from("entregas").createSignedUrl(rutas[1],30)).error).toBeNull();
      for(const c of [otra,mentor,anonimo()]){
        expect((await c.from("presentaciones_equipo").select("archivo_path").eq("equipo_id",equipo1)).data??[]).toEqual([]);
        expect((await c.storage.from("entregas").createSignedUrl(rutas[1],30)).error).not.toBeNull();
      }
      expect((await e.from("presentaciones_equipo").update({archivo_nombre:"prueba-intrusion"}).eq("equipo_id",equipo1)).error).not.toBeNull();
      await admin.from("eventos").update({estado:"cerrado"}).eq("id",evento);
      expect((await e.rpc("guardar_presentacion_equipo",args)).error?.message).toContain("evento_cerrado");
      expect((await e.rpc("elegir_empresa_equipo",{p_equipo:equipo1,p_empresa:"Fardo"})).error?.message).toContain("evento_cerrado");
    } finally {
      await admin.from("eventos").update({estado:"en_curso"}).eq("id",evento);
      await admin.storage.from("entregas").remove(rutas);
      await admin.from("entregas_equipo").delete().eq("equipo_id",equipo1);
      await admin.from("presentaciones_equipo").delete().eq("equipo_id",equipo1);
    }
  });
});

describe("archivo de entrega compartida", () => {
  it("solo integrantes registran archivos y solo equipo, organizador y jurado asignado pueden leerlos", async () => {
    const estudiante=await como("estudiante-1");const otra=await como("estudiante-2");
    const jurado=await como("jurado");const mentor=await como("mentor-1");
    const org=await como("organizador");const empresa=await como("empresa-a");
    const ruta=`${equipo1}/prueba-${crypto.randomUUID()}.pdf`;
    const bytes=Buffer.from("%PDF-1.4 prueba-entrega");
    const subida=await admin.storage.from("entregas").upload(ruta,bytes,{contentType:"application/pdf"});
    expect(subida.error).toBeNull();
    const args={p_equipo:equipo1,p_ruta:ruta,p_nombre:"prueba-entrega.pdf",p_tipo:"application/pdf",p_tamano:bytes.length};
    try {
      for(const c of [anonimo(),otra,jurado,mentor,empresa])expect((await c.rpc("guardar_archivo_entrega",args)).error).not.toBeNull();
      expect((await estudiante.rpc("guardar_archivo_entrega",{...args,p_tamano:bytes.length+1})).error?.message).toContain("archivo_invalido");
      expect((await estudiante.rpc("guardar_archivo_entrega",args)).error).toBeNull();
      for(const c of [estudiante,jurado,org])expect((await c.from("entregas_equipo").select("archivo_path").eq("equipo_id",equipo1)).data).toEqual([{archivo_path:ruta}]);
      for(const c of [otra,mentor,empresa,anonimo()]){
        expect((await c.from("entregas_equipo").select("archivo_path").eq("equipo_id",equipo1)).data??[]).toEqual([]);
        expect((await c.storage.from("entregas").createSignedUrl(ruta,30)).error).not.toBeNull();
      }
      expect((await estudiante.from("entregas_equipo").update({archivo_nombre:"intrusión.pdf"}).eq("equipo_id",equipo1)).error).not.toBeNull();
    } finally {
      await admin.storage.from("entregas").remove([ruta]);
      await admin.from("entregas_equipo").delete().eq("equipo_id",equipo1).eq("archivo_path",ruta);
    }
  });
});

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

describe("documentos de desafíos privados",()=>{
  it("exige inscripción incluso al descargar directo de Storage y no permite cargas de participantes",async()=>{
    const inscripto=await como("estudiante-1"),sinInscripcion=await como("estudiante-2"),mentor=await como("mentor-1");
    const uid=await idDe("estudiante-1");
    const intento=`prueba-intrusion-${crypto.randomUUID()}.pdf`;
    await admin.from("asistencias").upsert({usuario_id:uid,evento_id:evento,metodo:"organizador"},{onConflict:"evento_id,usuario_id"});
    try {
      for(const nombre of ["kankay.pdf","v-go.pdf","fardo.pdf","lisa.pdf","bienvenida-completa.pdf"]){
        for(const c of [sinInscripcion,anonimo()])expect((await c.storage.from("desafios-empresas").download(nombre)).error).not.toBeNull();
        for(const c of [inscripto,mentor])expect((await c.storage.from("desafios-empresas").download(nombre)).error).toBeNull();
      }
      expect((await inscripto.storage.from("desafios-empresas").upload(intento,Buffer.from("%PDF-prueba"),{contentType:"application/pdf"})).error).not.toBeNull();
      await admin.from("asistencias").delete().eq("usuario_id",uid).eq("evento_id",evento);
      expect((await inscripto.rpc("puede_leer_desafios")).data).toBe(false);
      // Consultar origen: una respuesta descargada antes no demuestra permisos vigentes.
      // https://supabase.com/docs/guides/storage/cdn/smart-cdn#bypassing-cache
      expect((await inscripto.storage.from("desafios-empresas").download("v-go.pdf",{cacheNonce:crypto.randomUUID()},{cache:"no-store"})).error).not.toBeNull();
    } finally {await admin.from("asistencias").delete().eq("usuario_id",uid).eq("evento_id",evento);await admin.storage.from("desafios-empresas").remove([intento]);}
  },60_000);
});

describe("publicaciones repetidas", () => {
  it("los borradores son privados; republicar es atómico, exige una preparación vigente y conserva la versión anterior", async () => {
    const org=await como("organizador"),alumno=await como("estudiante-4"),mentor=await como("mentor-2"),jurado=await como("jurado");
    const estudiante=await idDe("estudiante-4");
    const ev=(await admin.from("eventos").select("estado,rubrica_id,devoluciones_publicadas_en,revision_evaluaciones").eq("id",evento).single()).data!;
    const contenido=(texto:string)=>({version:1,equipo:"prueba-Equipo 2",dimensiones:[],comentarios:[{quien:"mentor",texto}]});
    const filas=[{estudiante_id:estudiante,contenido:contenido("prueba-anterior")}];let evaluacion:string|undefined;
    try {
      for(const c of [alumno,mentor,jurado,anonimo()]){
        expect((await c.rpc("guardar_preparacion_devoluciones",{p_evento:evento,p_revision:ev.revision_evaluaciones,p_filas:filas})).error).not.toBeNull();
        expect((await c.rpc("publicar_preparacion_devoluciones",{p_evento:evento})).error).not.toBeNull();
      }
      expect((await org.rpc("guardar_preparacion_devoluciones",{p_evento:evento,p_revision:ev.revision_evaluaciones,p_filas:filas})).error).toBeNull();
      expect((await org.rpc("publicar_preparacion_devoluciones",{p_evento:evento})).data).toBe(1);
      const anterior=(await alumno.from("devoluciones").select("id,contenido").eq("evento_id",evento).single()).data!;
      expect(anterior.contenido).toEqual(contenido("prueba-anterior"));
      await alumno.rpc("marcar_devolucion_abierta",{p_devolucion:anterior.id});
      const abierta=(await admin.from("devoluciones").select("abierta_en").eq("id",anterior.id).single()).data!.abierta_en;
      const nuevas=[{estudiante_id:estudiante,contenido:contenido("prueba-nueva")}];
      expect((await org.rpc("guardar_preparacion_devoluciones",{p_evento:evento,p_revision:ev.revision_evaluaciones,p_filas:nuevas})).error).toBeNull();
      for(const c of [alumno,mentor,jurado,anonimo()])expect((await c.from("devoluciones_borrador").select("contenido").eq("evento_id",evento)).data??[]).toEqual([]);
      expect((await alumno.from("devoluciones").select("contenido").eq("id",anterior.id).single()).data!.contenido).toEqual(contenido("prueba-anterior"));
      const nueva=await mentor.from("evaluaciones").insert({evento_id:evento,equipo_id:equipo2,rubrica_id:ev.rubrica_id,evaluador_id:await idDe("mentor-2"),rol_evaluador:"mentor",objetivo:"persona",estudiante_id:estudiante,estado:"enviada",comentario:"prueba-evaluacion-posterior"}).select("id").single();
      expect(nueva.error).toBeNull();evaluacion=nueva.data!.id;
      expect((await org.rpc("publicar_preparacion_devoluciones",{p_evento:evento})).error?.message).toContain("evaluaciones_cambiadas");
      expect((await alumno.from("devoluciones").select("contenido").eq("id",anterior.id).single()).data!.contenido).toEqual(contenido("prueba-anterior"));
      const revision=(await org.from("eventos").select("revision_evaluaciones").eq("id",evento).single()).data!.revision_evaluaciones;
      expect((await org.rpc("guardar_preparacion_devoluciones",{p_evento:evento,p_revision:ev.revision_evaluaciones,p_filas:nuevas})).error?.message).toContain("evaluaciones_cambiadas");
      expect((await org.rpc("guardar_preparacion_devoluciones",{p_evento:evento,p_revision:revision,p_filas:nuevas})).error).toBeNull();
      expect((await org.rpc("publicar_preparacion_devoluciones",{p_evento:evento})).data).toBe(1);
      const actual=(await alumno.from("devoluciones").select("id,contenido,abierta_en").eq("evento_id",evento).single()).data!;
      expect(actual).toEqual({id:anterior.id,contenido:contenido("prueba-nueva"),abierta_en:abierta});
      expect((await org.rpc("publicar_preparacion_devoluciones",{p_evento:evento})).error?.message).toContain("sin_preparacion");
      expect((await mentor.from("evaluaciones").update({comentario:"prueba-correccion"}).eq("id",evaluacion).select("id")).data).toHaveLength(1);
      await admin.from("eventos").update({estado:"cerrado"}).eq("id",evento);
      expect((await mentor.from("evaluaciones").update({comentario:"prueba-no-permitida"}).eq("id",evaluacion).select("id")).data).toEqual([]);
    } finally {
      if(evaluacion)await admin.from("evaluaciones").delete().eq("id",evaluacion);
      await admin.from("devoluciones_borrador").delete().eq("evento_id",evento);
      await admin.from("devoluciones").delete().eq("evento_id",evento).eq("estudiante_id",estudiante);
      await admin.from("eventos").update({estado:ev.estado,devoluciones_publicadas_en:ev.devoluciones_publicadas_en}).eq("id",evento);
    }
  });
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
