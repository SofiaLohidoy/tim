// CSV para abrir en Excel o Google Sheets con configuración regional argentina: separador ";"
// (la coma es el separador decimal) y BOM UTF-8 para que Excel lea bien las tildes.

type Valor = string | number | boolean | null | undefined | Date;

function celda(v: Valor): string {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  // Un texto que escribe un estudiante y empieza con = + - @ se ejecutaría como fórmula en Excel.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function aCsv(columnas: string[], filas: Valor[][]): string {
  return "﻿" + [columnas, ...filas].map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
}
