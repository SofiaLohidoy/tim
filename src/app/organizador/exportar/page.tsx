import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Panel, Titulo } from "@/components/org/ui";

export const metadata: Metadata = { title: "Exportar" };

const EXPORTES = [
  { tabla: "interesados", titulo: "Interesados de la landing", texto: "Mail, audiencia, respuestas, variante del título y origen." },
  { tabla: "eventos_landing", titulo: "Eventos de la landing", texto: "Visitas, secciones vistas, clics y formularios. Una fila por evento." },
  { tabla: "estudiantes", titulo: "Estudiantes", texto: "Onboarding, arquetipo, CV sí/no, asistencia y equipo." },
  { tabla: "evaluaciones", titulo: "Evaluaciones", texto: "Una fila por evaluación y dimensión: nivel y observación." },
  { tabla: "devoluciones", titulo: "Devoluciones y encuesta", texto: "Publicada, abierta y las tres respuestas de interés." },
];

export default function Pagina() {
  return (
    <>
      <Titulo ojo="Para la tesis">Exportar</Titulo>
      <Panel descripcion="CSV con “;” como separador, listo para Excel o Google Sheets.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {EXPORTES.map((x) => (
            <li key={x.tabla}>
              <a href={`/organizador/exportar/${x.tabla}`} className="flex items-start gap-3 rounded-2xl bg-muted p-4 transition-colors hover:bg-lila-claro">
                <Download className="mt-0.5 size-5 text-violeta-texto" />
                <span>
                  <span className="block font-semibold">{x.titulo}</span>
                  <span className="text-sm text-muted-foreground">{x.texto}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
