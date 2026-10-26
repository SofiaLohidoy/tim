import { NextResponse } from "next/server";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { clienteServidor } from "@/lib/supabase/servidor";
import { usuarioActual, nombreVisible } from "@/lib/sesion";
import { nivelesIndividuales, perfilTim } from "@/lib/perfil";
import { fechaLarga } from "@/lib/eventos";

// CV descargable con la evidencia de TIM (fase C). Una página A4, tipografía Helvetica (la que
// trae el PDF; no hace falta embeber fuentes) y los colores del manual.
const C = { verde: "#17483F", verdeOsc: "#102E28", violeta: "#6A4AD9", lila: "#AA8CFA", gris: "#5B6F69", linea: "#E3DED3", crema: "#FAF8F4" };

const s = StyleSheet.create({
  pagina: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: C.verdeOsc, backgroundColor: "#FFFFFF" },
  banda: { backgroundColor: C.verde, color: C.crema, padding: 22, borderRadius: 10, flexDirection: "row", justifyContent: "space-between" },
  nombre: { fontSize: 24, fontFamily: "Helvetica-Bold" },
  sub: { fontSize: 11, marginTop: 4, color: "#D7E0DD" },
  ojo: { fontSize: 8, letterSpacing: 1.5, color: C.violeta, fontFamily: "Helvetica-Bold", marginTop: 20, marginBottom: 6 },
  fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.linea },
  nota: { fontSize: 8, color: C.gris, marginTop: 6, lineHeight: 1.4 },
  qr: { width: 70, height: 70, backgroundColor: "#FFFFFF", padding: 4, borderRadius: 6 },
});

export async function GET() {
  const u = await usuarioActual();
  if (!u) return NextResponse.redirect(new URL("/ingresar?siguiente=/perfil", process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3001"));
  const db = await clienteServidor();
  const [{ data: e }, perfil] = await Promise.all([
    db.from("estudiantes").select("universidad, carrera, anio_carrera, intereses").eq("usuario_id", u.id).maybeSingle(),
    perfilTim(db, u.id),
  ]);
  const sitio = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3001";
  const url = perfil.credencial ? `${sitio}/v/${perfil.credencial.token}` : null;
  const qr = url ? await QRCode.toDataURL(url, { margin: 0, width: 240, color: { dark: C.verdeOsc, light: "#FFFFFF" } }) : null;

  const pdf = await renderToBuffer(
    <Document title={`CV TIM — ${nombreVisible(u)}`} author="TIM" language="es-AR">
      <Page size="A4" style={s.pagina}>
        <View style={s.banda}>
          <View style={{ flex: 1 }}>
            <Text style={s.nombre}>{nombreVisible(u)}</Text>
            <Text style={s.sub}>{[e?.carrera, e?.anio_carrera, e?.universidad].filter(Boolean).join(" · ")}</Text>
            <Text style={[s.sub, { marginTop: 2 }]}>{u.email}</Text>
            {e?.intereses?.length ? <Text style={[s.sub, { marginTop: 8 }]}>Áreas de interés: {e.intereses.join(", ")}</Text> : null}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, no es un <img> */}
          {qr && <Image src={qr} style={s.qr} />}
        </View>

        <Text style={s.ojo}>EVIDENCIA OBSERVADA EN DESAFÍOS</Text>
        {perfil.eventos.length === 0 && <Text style={s.nota}>Todavía no participó de un desafío presencial con devolución publicada.</Text>}
        {perfil.eventos.map((ev) => (
          <View key={ev.evento + ev.fecha} style={{ marginBottom: 10 }} wrap={false}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>{ev.evento}</Text>
            <Text style={{ color: C.gris, marginBottom: 4 }}>{fechaLarga(ev.fecha)} · Equipo {ev.contenido.equipo} · observado por mentor y jurado</Text>
            {nivelesIndividuales(ev.contenido).map((x) => (
              <View key={x.dimension} style={s.fila}>
                <Text>{x.dimension}</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", color: C.violeta }}>{x.nivel} ({x.orden} de 4)</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={s.ojo}>ACTIVIDADES</Text>
        {perfil.porActividad.length === 0 ? (
          <Text style={s.nota}>Todavía no jugó actividades virtuales.</Text>
        ) : (
          perfil.porActividad.map((a) => (
            <View key={a.titulo} style={s.fila}>
              <Text>{a.titulo}</Text>
              <Text>{a.resueltas} de {a.jugadas} resueltas</Text>
            </View>
          ))
        )}

        <Text style={[s.nota, { marginTop: 24 }]}>
          Los niveles describen lo que se observó en un desafío con la rúbrica de TIM (comprensión del problema, análisis, resolución, comunicación e iniciativa); no son una nota.
          {url ? ` Verificá esta evidencia en ${url.replace(/^https?:\/\//, "")}.` : ""}
        </Text>
        <Text style={[s.nota, { position: "absolute", bottom: 28, left: 40, right: 40, textAlign: "center" }]} fixed>
          TIM · Tu capacidad, en evidencia.
        </Text>
      </Page>
    </Document>,
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="cv-tim-${nombreVisible(u).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
