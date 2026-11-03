import {describe,it,expect} from "vitest";
import {entregaVirtual,camposTexto,fechaInputArgentina} from "./desafios-virtuales";
describe("entrega virtual",()=>{
 const vacia={via:"",investigacion_url:"",repo_url:"",demo_url:"",video_url:"",decisiones:""};
 it("permite guardar un borrador incompleto pero rechaza enlaces inseguros o con credenciales",()=>{
  expect(entregaVirtual.safeParse(vacia).success).toBe(true);
  for(const repo_url of ["javascript:alert(1)","http://ejemplo.com","https://usuario:clave@ejemplo.com"])
   expect(entregaVirtual.safeParse({...vacia,repo_url}).success).toBe(false);
  expect(entregaVirtual.safeParse({...vacia,repo_url:"https://github.com/prueba/demo"}).success).toBe(true);
 });
 it("convierte las citas a hora argentina y descarta campos no textuales",()=>{
  expect(fechaInputArgentina("2026-11-03T17:30:00Z")).toBe("2026-11-03T14:30");
  expect(camposTexto({comentario:"Hola",privado:{secreto:true}})).toEqual({comentario:"Hola"});
 });
});
