import {z} from "zod";
export const TITULO_PAPERCLIP="Paperclip: coordinación de agentes e integración";
export const CONSIGNA_PAPERCLIP=`Ejercicio individual de evaluación en español. Tenés 72 horas desde que tocás Comenzar. Usá datos ficticios y cuentas de prueba; no publiques campañas ni envíes mensajes a personas reales. No incluyas contraseñas ni claves en tus archivos.

1. Investigación
Explicá qué es Paperclip, cómo organiza roles, tareas, presupuestos y revisiones humanas, dónde corre, qué herramientas necesita y cuáles son sus límites. Entregá una página o un documento equivalente.

2. Construcción mínima
Prepará una compañía de prueba con al menos dos roles y tres tareas. Una tarea debe pasar por revisión humana antes de darse por terminada. Documentá cómo reproducir la demo en aproximadamente diez minutos.

3. Integración
Elegí una vía: B1, Grokbot; B2, WhatsApp; o B3, redes sociales. Mostrá una acción o transferencia desde una tarea de Paperclip. Se admite una simulación explícita o un borrador, con evidencia del intento. No hace falta realizar publicaciones reales ni pagar anuncios.

4. Entrega
Compartí tu investigación, el repositorio con README y DECISIONS.md, y un video de aproximadamente dos minutos y medio. Incluí el enlace a la demo si está disponible. Explicá qué elegiste, qué funcionó, qué no funcionó y qué mejorarías. Aceptamos una demo reproducible con el alojamiento apropiado; no se exige ejecutar Paperclip dentro de TIM ni desplegar su servidor en Vercel.

5. Defensa de veinte minutos
La organización coordinará la fecha y el enlace: cinco minutos para explicar la investigación, diez para mostrar la demo y cinco para conversar sobre límites, decisiones y posibilidades de escalar.

La revisión es humana: investigación, construcción, integración, claridad, juicio y autonomía. Se considera la evidencia y la explicación de las dificultades. No hay una nota automática ni se mezcla este desafío con las devoluciones de la hackatón.

El PDF adjunto es la referencia original. Para este piloto de TIM rigen el idioma, plazo y entorno de prueba indicados acá. Los accesos a proveedores y sus posibles costos deben acordarse con organización antes de comenzar.`;

const enlace=z.string().trim().max(2000).refine(s=>{if(!s)return true;try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;}},"Usá un enlace https sin usuario ni contraseña.");
export const entregaVirtual=z.object({via:z.enum(["","B1","B2","B3"]),investigacion_url:enlace,repo_url:enlace,demo_url:enlace,video_url:enlace,decisiones:z.string().trim().max(6000)});
export const CRITERIOS_VIRTUALES=[{id:"research",titulo:"Investigación"},{id:"build",titulo:"Construcción"},{id:"integracion",titulo:"Integración"},{id:"claridad",titulo:"Claridad y defensa"},{id:"juicio",titulo:"Juicio técnico"},{id:"autonomia",titulo:"Autonomía"},{id:"comentario",titulo:"Devolución general"}] as const;
export function camposTexto(v:unknown):Record<string,string>{if(!v||typeof v!=="object"||Array.isArray(v))return {};return Object.fromEntries(Object.entries(v).filter((x):x is [string,string]=>typeof x[1]==="string"));}
export function fechaVirtual(iso:string|null){return iso?new Intl.DateTimeFormat("es-AR",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Argentina/Buenos_Aires"}).format(new Date(iso)):"";}
export function fechaInputArgentina(iso:string|null){if(!iso)return "";const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
