import type { Metadata } from "next";
import { Landing } from "../landing";
import "../landing.css";
export const metadata: Metadata = { title: "TIM para empresas" };
export default function Pagina() { return <Landing variante="a" publico="empresa" />; }
