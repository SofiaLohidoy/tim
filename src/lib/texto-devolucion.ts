// Encabezados del formato de síntesis aportado por organización. Nunca se infieren
// niveles ni se reescribe el contenido: solo se agrupan líneas de la extracción PDF.
const titulos = new Set([
  "Aspectos valorados", "Para continuar",
  "Profundizar el diagnóstico y justificar la solución",
  "Llevar la propuesta a una prueba concreta",
  "Fortalecer el pitch y las respuestas",
  "Hacer visible el análisis propio",
  "Precisar el problema y validar sus causas",
  "Conectar las funcionalidades con acciones y resultados",
  "Revisar las barreras de entrada y el modelo económico",
  "Fortalecer la defensa de la propuesta",
  "Profundizar la comprensión del problema",
  "Distinguir las necesidades de los clientes",
  "Justificar los cambios y preservar el diferencial",
  "Fortalecer el relato y la defensa de la propuesta",
  "Precisar el problema y su relación con la solución",
  "Definir y dimensionar el mercado",
  "Aclarar la propuesta de valor y el funcionamiento del negocio",
  "Fortalecer los entregables y la defensa",
]);

export function bloquesDevolucion(texto:string) {
  const bloques:{tipo:"titulo"|"parrafo";texto:string}[]=[];
  let lineas:string[]=[];
  const cerrar=()=>{if(lineas.length)bloques.push({tipo:"parrafo",texto:lineas.join(" ")});lineas=[];};
  for(const raw of texto.replace(/\r\n?/g,"\n").split("\n")) {
    const linea=raw.trim().replace(/\s+/g," ");
    if(!linea){cerrar();continue;}
    if(titulos.has(linea)||/^Equipo .+\| Devolución del jurado$/.test(linea)||/^Hackat[oó]n TIM$/.test(linea)) {
      cerrar();bloques.push({tipo:"titulo",texto:linea});continue;
    }
    lineas.push(linea);
    // El PDF conserva el fin de cada párrafo pero corta sus líneas según el ancho
    // de la hoja. Se unen las líneas hasta el cierre de frase o el siguiente título.
    if(/[.!?][”"»)]?$/.test(linea))cerrar();
  }
  cerrar();return bloques;
}
