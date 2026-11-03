import {Suspense} from "react";
import {BarraEstudiante} from "@/components/app/barra-estudiante";

export default function Layout({children}:{children:React.ReactNode}){
 return <>{children}<Suspense fallback={null}><BarraEstudiante/></Suspense></>;
}
