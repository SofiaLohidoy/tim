import "server-only";
import type { Asignacion } from "./einstein";

// Soluciones de las actividades. Solo servidor: nunca llegan al navegador (el import de
// "server-only" rompe el build si alguien lo importa en un componente de cliente).
// La clave es `slug@version`: una versión nueva de una actividad no cambia lo que se jugó antes.

/**
 * Palabras de 5 letras para "Adivinar la palabra". Lista propia de palabras comunes del español
 * (scripts/contenido/palabras.txt), sin tildes. Contenido de TIM: sin licencia de terceros.
 */
export const PALABRAS: string[] = [
    "ACERO", "ACTOR", "AGRIO", "AHORA", "ALAMO", "ALBUM", "ALDEA", "ALGAS", "ALMAS", "ALTAR",
    "ALTOS", "AMIGO", "ANCHO", "ANDAR", "ANGEL", "ANIMO", "ANTES", "APOYO", "ARBOL", "ARCOS",
    "ARDER", "ARENA", "ARMAR", "AROMA", "ARROZ", "ASADO", "ATLAS", "AUDIO", "BAILE", "BAJAR",
    "BALON", "BANCO", "BARCO", "BARRO", "BESAR", "BICHO", "BLUSA", "BOLSA", "BOTAS", "BRAZO",
    "BRUJA", "BUENO", "BURRO", "CABLE", "CAJAS", "CALLE", "CALMA", "CALOR", "CAMPO", "CANAL",
    "CANTO", "CARGA", "CARNE", "CARRO", "CARTA", "CASAS", "CAUSA", "CAZAR", "CEBRA", "CERCA",
    "CERDO", "CHICO", "CIELO", "CINCO", "CINTA", "CIRCO", "CLARO", "CLAVE", "CLIMA", "COBRE",
    "COCHE", "COMER", "COPAS", "CORAL", "CORTE", "COSTA", "CREAR", "CREMA", "CRUCE", "CUERO",
    "CULPA", "CURSO", "DATOS", "DEBER", "DECIR", "DEDOS", "DISCO", "DOBLE", "DOLOR", "DONDE",
    "DRAMA", "DUCHA", "DULCE", "ECHAR", "ENERO", "ENTRE", "ERROR", "ESTAR", "ETAPA", "EXITO",
    "EXTRA", "FALDA", "FALTA", "FAROL", "FECHA", "FELIZ", "FERIA", "FIBRA", "FIRMA", "FLACO",
    "FLOTA", "FONDO", "FORMA", "FRASE", "FRENO", "FRESA", "FRUTA", "FUEGO", "FUNDA", "GAFAS",
    "GALLO", "GANAR", "GANSO", "GATOS", "GENIO", "GENTE", "GIRAR", "GLOBO", "GOLPE", "GORRA",
    "GOTAS", "GRADO", "GRANO", "GRASA", "GRAVE", "GRUPO", "GUAPO", "GUSTO", "HABLA", "HACER",
    "HIELO", "HIJOS", "HILOS", "HOJAS", "HONGO", "HORAS", "HOTEL", "HUESO", "HUEVO", "HUMOR",
    "IDEAS", "IGUAL", "ISLAS", "JAMON", "JARRA", "JOVEN", "JUEGO", "JUGAR", "JUNTO", "LABIO",
    "LADOS", "LAGOS", "LAPIZ", "LARGO", "LATAS", "LAVAR", "LECHE", "LEGAL", "LEJOS", "LENTO",
    "LETRA", "LIBRO", "LIMON", "LINEA", "LISTA", "LLAMA", "LLAVE", "LLENO", "LOCAL", "LUCHA",
    "LUGAR", "LUNES", "MADRE", "MAGIA", "MANGO", "MANOS", "MANTA", "MAPAS", "MARCO", "MAREA",
    "MARZO", "MATAR", "MAYOR", "MEDIO", "MENTA", "MESAS", "METAL", "METRO", "MIEDO", "MISMO",
    "MITAD", "MOLDE", "MONTE", "MORAL", "MOTOR", "MUNDO", "MUSEO", "NADAR", "NARIZ", "NAVES",
    "NEGRO", "NIDOS", "NIEVE", "NIVEL", "NOCHE", "NORTE", "NOTAS", "NOVIO", "NUBES", "NUEVO",
    "OBRAR", "OLIVO", "ONDAS", "OPERA", "ORDEN", "OREJA", "PADRE", "PAGAR", "PALMA", "PALOS",
    "PAPEL", "PARED", "PARTE", "PASEO", "PASTA", "PATIO", "PECES", "PEDIR", "PEINE", "PERRO",
    "PESCA", "PIANO", "PIEZA", "PILAR", "PIZZA", "PLATA", "PLATO", "PLAYA", "PLAZA", "PLUMA",
    "POEMA", "POLLO", "PONER", "PRADO", "PRIMO", "PULPO", "PUNTO", "QUESO", "RADIO", "RAMAS",
    "RATON", "REGLA", "REINA", "RELOJ", "RESTO", "RIEGO", "RITMO", "ROBOT", "ROCAS", "RONDA",
    "RUEDA", "RUIDO", "RUMBO", "SABER", "SABOR", "SALSA", "SALTO", "SALUD", "SANTO", "SELLO",
    "SENDA", "SERIE", "SIGLO", "SILLA", "SOBRE", "SOCIO", "SOLAR", "SONAR", "SUELO", "TABLA",
    "TALLA", "TANGO", "TARDE", "TAREA", "TARTA", "TECHO", "TEJER", "TEMAS", "TENER", "TIGRE",
    "TINTA", "TIROS", "TOMAR", "TORRE", "TORTA", "TRAJE", "TRATO", "TRIGO", "TRUCO", "TURNO",
    "UNICO", "UNIDO", "USTED", "VACAS", "VALLE", "VAPOR", "VASOS", "VECES", "VELAS", "VENTA",
    "VERDE", "VIAJE", "VIDAS", "VIEJO", "VINOS", "VISTA", "VIVIR", "VOLAR", "VUELO", "YEGUA",
    "ZORRO",
];

export const CRUCIGRAMAS: Record<string, string[]> = {
  "crucigrama-1@1": ["BOLSA", "R#E#U", "USTED", "J#R#I", "ALAMO"],
  "crucigrama-2@1": ["CALMA", "A#E#R", "NOCHE", "T#H#N", "OPERA"],
  "crucigrama-3@1": ["BOTAS", "E#I#U", "SERIE", "A#O#L", "RESTO"],
};

export const EINSTEIN: Record<string, Asignacion> = {
  "einstein-chico@1": {
    nombre: ["Bruno", "Ana", "Carla"],
    rol: ["datos", "pitch", "diseño"],
    bebida: ["té", "mate", "café"],
  },
  "einstein-equipo@1": {
    nombre: ["Dani", "Ana", "Carla", "Bruno"],
    rol: ["producto", "datos", "pitch", "diseño"],
    bebida: ["agua", "mate", "té", "café"],
  },
};
