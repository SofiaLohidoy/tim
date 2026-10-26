import type { Metadata } from "next";
import { Landing } from "../landing";
import "../landing.css";
export const metadata: Metadata = { title: "TIM para estudiantes" };
export default function Pagina() { return <Landing variante="a" publico="estudiante" />; }
