"use server";

import { interes, origenEsquema, type Origen } from "@/lib/landing/esquemas";
import { registrarInteresado } from "@/lib/landing/registro";

export type EstadoInteres = {
  estado: "inicial" | "ok" | "error";
  error?: string;
  campos?: Record<string, string>;
  /** Lo que se mandó, para no vaciar el formulario cuando hay un error. */
  valores?: Record<string, string>;
};

export async function registrarInteres(_previo: EstadoInteres, form: FormData): Promise<EstadoInteres> {
  // Honeypot: un humano no ve este campo. Si viene lleno, se responde "ok" y no se guarda nada.
  if (form.get("sitio")) return { estado: "ok" };

  const { origen: _o, sitio: _s, ...campos } = Object.fromEntries(form);
  const valores = Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, String(v)]));
  const datos = interes.safeParse(campos);
  if (!datos.success) {
    const errores: Record<string, string> = {};
    for (const i of datos.error.issues) errores[String(i.path[0])] ??= i.message;
    return { estado: "error", error: "Revisá los campos marcados.", campos: errores, valores };
  }

  let origen: Origen = {};
  try {
    origen = origenEsquema.parse(JSON.parse(String(form.get("origen") ?? "{}")));
  } catch {
    origen = {};
  }

  try {
    const r = await registrarInteresado(datos.data, origen);
    if (r === "limitado") return { estado: "error", error: "Recibimos muchos registros seguidos. Probá en unos minutos.", valores };
    return { estado: "ok" };
  } catch (e) {
    console.error("[landing] interesado no registrado", e);
    return { estado: "error", error: "No pudimos guardar tus datos. Probá de nuevo en un rato.", valores };
  }
}
