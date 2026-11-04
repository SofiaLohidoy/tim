import {describe,it,expect} from "vitest";
import {entregaVirtual,validarEntregaVirtual,camposTexto,fechaInputArgentina} from "./desafios-virtuales";
describe("entrega virtual",()=>{
 const vacia={via:"",investigacion_url:"",repo_url:"",demo_url:"",video_url:"",decisiones:""};
 it("permite guardar un borrador incompleto pero rechaza enlaces inseguros o con credenciales",()=>{
  expect(entregaVirtual.safeParse(vacia).success).toBe(true);
  for(const repo_url of ["javascript:alert(1)","http://ejemplo.com","https://usuario:clave@ejemplo.com"])
   expect(entregaVirtual.safeParse({...vacia,repo_url}).success).toBe(false);
  expect(entregaVirtual.safeParse({...vacia,repo_url:"https://github.com/prueba/demo"}).success).toBe(true);
 });
 it("exige cuatro entregables al enviar y acepta informe adjunto o por enlace",()=>{
  const enlaces={investigacion_url:"https://example.com/informe",repo_url:"https://github.com/prueba/demo",demo_url:"https://prueba.vercel.app",video_url:"https://www.loom.com/share/prueba"};
  expect(validarEntregaVirtual({},false,false).errores).toEqual({});
  expect(Object.keys(validarEntregaVirtual({},false,true).errores)).toHaveLength(4);
  expect(validarEntregaVirtual(enlaces,false,true).errores).toEqual({});
  expect(validarEntregaVirtual({...enlaces,investigacion_url:""},true,true).errores).toEqual({});
  for(const campo of Object.keys(enlaces))expect(validarEntregaVirtual({...enlaces,[campo]:""},false,true).errores).toHaveProperty(campo);
  expect(validarEntregaVirtual({...enlaces,demo_url:"javascript:alert(1)"},true,true).errores).toHaveProperty("demo_url");
 });
 it("convierte las citas a hora argentina y descarta campos no textuales",()=>{
  expect(fechaInputArgentina("2026-11-03T17:30:00Z")).toBe("2026-11-03T14:30");
  expect(camposTexto({comentario:"Hola",privado:{secreto:true}})).toEqual({comentario:"Hola"});
 });
});
