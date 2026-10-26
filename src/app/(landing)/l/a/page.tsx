import { Landing } from "../../landing";
import "../../landing.css";

// `/` se reescribe acá desde src/proxy.ts según la variante del visitante. Página estática (CDN).
export default function Pagina() {
  return <Landing variante="a" />;
}
