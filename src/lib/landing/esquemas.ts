import { z } from "zod";

// Validación de lo que entra desde la landing. Vive aparte para poder testearla sin Next.

export const origenEsquema = z
  .object({
    utm_source: z.string().max(80).optional(),
    utm_medium: z.string().max(80).optional(),
    utm_campaign: z.string().max(80).optional(),
    utm_content: z.string().max(80).optional(),
    origen: z.string().max(40).optional(),
    referrer: z.string().max(200).optional(),
  })
  .partial();
export type Origen = z.infer<typeof origenEsquema>;

export const eventoLanding = z.object({
  tipo: z.enum(["visita", "seccion", "clic_cta", "form_inicio", "form_fin", "form_error"]),
  detalle: z
    .string()
    .max(60)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  origen: origenEsquema.optional(),
});
export type EventoLanding = z.infer<typeof eventoLanding>;

export const FRENOS = {
  no_sabe_que_quiere: "Todavía no sé qué quiero hacer",
  no_identifica_fortalezas: "Sé qué quiero, pero no sé qué puedo ofrecer",
  no_sabe_demostrar: "Sé qué ofrezco, pero no cómo demostrarlo",
  hace_todo_bien: "Hago todo bien y no consigo",
} as const;

export const ANIOS = ["1.º", "2.º", "3.º", "4.º", "5.º o más", "Recién recibido/a"] as const;
export const TAMANIOS = ["1 a 9", "10 a 49", "50 o más"] as const;
export const DESAFIO = ["Sí", "Tal vez", "Todavía no"] as const;

const email = z.email("Revisá el mail: parece incompleto.").max(200);

export const interesEstudiante = z.object({
  audiencia: z.literal("estudiante"),
  email,
  carrera: z.string().trim().min(2, "Contanos qué estudiás.").max(120),
  anio: z.enum(ANIOS, { error: "Elegí en qué año estás." }),
  freno: z.enum(Object.keys(FRENOS) as [keyof typeof FRENOS, ...(keyof typeof FRENOS)[]], {
    error: "Elegí la opción que más se parece a lo que te pasa.",
  }),
});

export const interesEmpresa = z.object({
  audiencia: z.literal("empresa"),
  email,
  tamanio: z.enum(TAMANIOS, { error: "Elegí el tamaño de tu empresa." }),
  rubro: z.string().trim().min(2, "Contanos el rubro.").max(120),
  propondria: z.enum(DESAFIO, { error: "Elegí una opción." }),
});

export const interes = z.discriminatedUnion("audiencia", [interesEstudiante, interesEmpresa]);
export type Interes = z.infer<typeof interes>;
