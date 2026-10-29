export const TIPOS_ENTREGA: Record<string,string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
export const MAX_ENTREGA = 4 * 1024 * 1024;
export type TipoEntrega = "documento" | "presentacion";
export function tipoPermitido(tipo: TipoEntrega, mime: string) {
  return mime === "application/pdf" || mime === (tipo === "documento"
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/vnd.openxmlformats-officedocument.presentationml.presentation");
}
