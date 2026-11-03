"use client";
import {useActionState} from "react";
import type {ReactNode} from "react";
import {Button} from "@/components/ui/button";
import {Mensaje} from "@/components/org/campos";
export type ResultadoVirtual={error?:string;mensaje?:string};
export function FormularioVirtual({action,boton,children}:{action:(p:ResultadoVirtual,f:FormData)=>Promise<ResultadoVirtual>;boton:string;children:ReactNode}){
 const [estado,accion,ocupado]=useActionState(action,{});
 return <form action={accion} className="grid gap-3"><fieldset disabled={ocupado} className="grid min-w-0 gap-3">{children}<Button type="submit" className="min-h-11 justify-self-start rounded-xl px-5">{ocupado?"Guardando…":boton}</Button></fieldset><Mensaje r={estado}/></form>;
}
