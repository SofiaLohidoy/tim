import Link from "next/link";
import { ArrowRight, Building2, Check, Lock, MessageSquareText, Plus, QrCode, Sprout } from "lucide-react";
import { Logo } from "@/components/marca";
import { NavLanding } from "./nav-landing";
import { Revelar } from "./revelar";
import { RubricaDemo } from "./rubrica-demo";
import { Medicion } from "./medicion";
import { TITULOS, type Variante } from "./variantes";

// Páginas públicas estáticas. Arquitectura por público: docs/landing-{principal,estudiantes,empresas}.md.
// Las cifras conservan las fuentes de docs/landing-contenido.md. El registro ocurre en /ingresar.

const PREGUNTAS = [
  {
    p: "¿Cuesta algo?",
    r: "No. Para estudiantes, TIM es gratis.",
  },
  {
    p: "¿Quién ve mis datos?",
    r: "Vos y el equipo TIM para organizar los desafíos. El recorrido de empresas se está desarrollando: tu nombre y tu contacto solo se compartirán si vos aceptás.",
  },
  {
    p: "¿Qué es un desafío?",
    r: "Un problema concreto para resolver en un tiempo acotado, solo o en equipo. Puede durar unos minutos o una jornada.",
  },
  {
    p: "¿Me garantiza un trabajo?",
    r: "No. TIM te da evidencia de lo que sabés hacer, para que una empresa lo pueda ver.",
  },
  {
    p: "Soy empresa: ¿el desafío es trabajo gratis?",
    r: "No. Un desafío es una instancia de evaluación y nunca se usa para obtener trabajo productivo.",
  },
  {
    p: "¿Qué mide TIM?",
    r: "Habilidades blandas observadas en un desafío. Son señales de cómo trabajaste, no una nota ni un test.",
  },
];

const RUBRICA = [
  "Comprensión del problema",
  "Análisis y fundamentación",
  "Resolución",
  "Comunicación y colaboración",
  "Iniciativa y adaptación",
];

export function Landing({ variante, publico = "principal" }: { variante: Variante; publico?: "principal" | "estudiante" | "empresa" }) {
  const titulo = publico === "empresa" ? { antes: "Conocé talento, ", destacado: "con evidencia.", despues: "" } : TITULOS[variante];
  return (
    <div className="tl" data-publico={publico}>
      {publico === "principal" && <Medicion variante={variante} />}
      <Revelar />
      <NavLanding />

      <header className="hero" data-seccion="hero">
        <div className="wrap hero-in">
          <div>
            <div className="aviso-qr">
              <p>¿Llegaste desde la hackatón? Creá tu cuenta en un minuto.</p>
              <Link href="/ingresar?origen=qr" className="btn btn-verde" data-cta="qr_hackaton">
                Entrar a la hackatón
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <p className="ojo">
              Habilidades blandas <i>·</i> Desafíos reales
            </p>
            <h1>
              {titulo.antes}
              <em>{titulo.destacado}</em>
              {titulo.despues}
            </h1>
            <p className="hero-sub">
              {publico === "empresa" ? "Conocé cómo resuelven desafíos las personas. Mentores y jurados observan el proceso y registran evidencia más allá del CV." : "Resolvé desafíos reales en equipo. Mentores observan cómo trabajás y esa evidencia queda en tu perfil."}
            </p>
            <div className="hero-cta">
              {publico !== "empresa" && <Link href="/ingresar?tipo=estudiante" className="btn btn-lila" data-cta="hero_estudiante">
                Quiero demostrar mi talento
                <ArrowRight aria-hidden="true" />
              </Link>}
              {publico !== "estudiante" && <Link href="/ingresar?tipo=empresa" className="btn btn-linea" data-cta="hero_empresa">
                Quiero contratar talento
              </Link>}
            </div>
            <p className="hero-hack">
              ¿Venís a la hackatón del 31/10?{" "}
              <Link href="/ingresar?modo=entrar" data-cta="hero_ingresar">
                Entrá con tu cuenta
              </Link>
            </p>
          </div>

          <div className="pila" aria-hidden="true">
            <div className="iso">
              <i className="m1" />
              <i className="m2" />
              <i className="m3" />
            </div>
            <div className="tarjeta a">
              <div className="t-cab">
                <span>Mentora · Equipo 3</span>
                <span>Individual</span>
              </div>
              <div className="t-dim">Comprensión del problema</div>
              <div className="t-niv">
                <span className="puntos">
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i />
                </span>
                Se observa con claridad
              </div>
            </div>
            <div className="tarjeta b">
              <div className="t-cab">
                <span>Jurado</span>
                <span>Equipo</span>
              </div>
              <div className="t-dim">Comunicación y colaboración</div>
              <div className="t-niv">
                <span className="puntos">
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                </span>
                Se destaca
              </div>
            </div>
            <div className="tarjeta c">
              <div className="t-cab">
                <span>Mentora · Equipo 3</span>
                <span>Individual</span>
              </div>
              <div className="t-dim">Iniciativa y adaptación</div>
              <div className="t-niv">
                <span className="puntos">
                  <i className="on" />
                  <i className="on" />
                  <i />
                  <i />
                </span>
                Se observa a veces
              </div>
            </div>
          </div>
        </div>

        <div className="prueba-hero">
          <ul className="wrap">
            <li>
              <span className="num">72 %</span>
              <p>
                de los jóvenes dice que la falta de experiencia es su principal obstáculo para conseguir trabajo.
                <span className="fuente">UCEMA, 2025 · 13.000 jóvenes de 18 a 29 años</span>
              </p>
            </li>
            <li>
              <span className="num">87,7 %</span>
              <p>
                se mostró interesado en resolver un desafío real, parecido a lo que haría en un puesto.
                <span className="fuente">Relevamiento TIM, sep-2026 · 50 de 57 personas</span>
              </p>
            </li>
          </ul>
        </div>
      </header>

      <main>

        {publico === "principal" && <section className="banda" aria-label="Elegí tu recorrido">
          <div className="wrap">
            <p className="ojo sec-ojo">Un espacio, dos caminos</p>
            <h2 className="sec-h">El talento se demuestra haciendo.</h2>
            <div className="recorridos">
              <article><Sprout aria-hidden="true" /><h3>Para estudiantes</h3><p>Resolvé desafíos, recibí devoluciones y construí un perfil con evidencia de cómo trabajás.</p><Link href="/estudiantes" className="enlace-texto">Conocé cómo funciona <ArrowRight aria-hidden="true" /></Link></article>
              <article><Building2 aria-hidden="true" /><h3>Para empresas</h3><p>Conocé la propuesta de TIM para evaluar talento a través de desafíos y evidencia observada.</p><Link href="/empresas" className="enlace-texto">Conocé la propuesta <ArrowRight aria-hidden="true" /></Link></article>
            </div>
          </div>
        </section>}
        {publico === "estudiante" && (<section className="banda" id="problema" data-seccion="problema">
          <div className="wrap problema-in">
            <div className="revela">
              <p className="ojo sec-ojo">El problema</p>
              <h2 className="sec-h">Tu CV no muestra cómo pensás.</h2>
              <p className="sec-p">
                Un CV dice dónde estudiaste. No dice cómo encarás un problema, cómo trabajás en equipo ni qué hacés
                cuando algo cambia. Y con IA, todos los CV se parecen.
              </p>
              <div className="dato">
                <span className="num">71 %</span>
                <p>
                  sintió que no logró mostrar su potencial en al menos una entrevista.
                  <span className="fuente" style={{ display: "block", marginTop: 4 }}>
                    Relevamiento TIM, sep-2026 · 93 personas con entrevistas en el último año
                  </span>
                </p>
              </div>
            </div>
            <div className="versus revela" aria-label="Comparación entre un CV y un perfil con evidencia">
              <div className="hoja cv">
                <span className="ojo">CV</span>
                <i className="m" />
                <i className="c" />
                <span className="sep" />
                <i className="l" />
                <i className="m" />
                <i className="c" />
                <span className="sep" />
                <i className="l" />
                <i className="m" />
                <i className="l" />
                <i className="c" />
              </div>
              <div className="hoja ev">
                <span className="ojo">Evidencia</span>
                <div className="fila">
                  <b>Comprensión del problema</b>
                  <span className="puntos">
                    <i className="on" />
                    <i className="on" />
                    <i className="on" />
                    <i />
                  </span>
                </div>
                <div className="fila">
                  <b>Resolución</b>
                  <span className="puntos">
                    <i className="on" />
                    <i className="on" />
                    <i className="on" />
                    <i className="on" />
                  </span>
                </div>
                <div className="fila">
                  <b>Iniciativa y adaptación</b>
                  <span className="puntos">
                    <i className="on" />
                    <i className="on" />
                    <i />
                    <i />
                  </span>
                </div>
                <q>Ordenó al equipo cuando cambió la consigna.</q>
              </div>
            </div>
          </div>
        </section>)}
        {publico === "estudiante" && (<section className="banda como" id="como-funciona" data-seccion="como_funciona">
          <div className="wrap">
            <div className="revela">
              <p className="ojo sec-ojo">Cómo funciona</p>
              <h2 className="sec-h">Tres pasos, un perfil real.</h2>
            </div>
            <ol className="pasos">
              <li className="paso revela">
                <span className="n">Paso 1</span>
                <h3>Resolvé un desafío.</h3>
                <p>Un problema real, en equipo, presencial o virtual.</p>
                <div className="demo">
                  <div className="demo-caja consigna">
                    <b>Una PyME de logística pierde pedidos los viernes.</b>
                    <p>¿Qué cambiarías primero y cómo lo medirías?</p>
                    <div className="reloj">
                      Tiempo
                      <span className="barra">
                        <i />
                      </span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="paso revela">
                <span className="n">Paso 2</span>
                <h3>Te observan.</h3>
                <p>Mentores y jurados registran cómo trabajás con una rúbrica de cinco capacidades.</p>
                <div className="demo">
                  <RubricaDemo />
                </div>
              </li>
              <li className="paso revela">
                <span className="n">Paso 3</span>
                <h3>Sumá evidencia.</h3>
                <p>Cada desafío agrega a tu perfil. No empezás de cero en cada búsqueda.</p>
                <div className="demo">
                  <div className="demo-caja perfil-demo">
                    {[
                      ["Comprensión", 3],
                      ["Análisis", 2],
                      ["Resolución", 3],
                      ["Comunicación", 4],
                      ["Iniciativa", 2],
                    ].map(([nombre, n], fila) => (
                      <div className="fila" key={nombre}>
                        <b>{nombre}</b>
                        <span className="chips">
                          {[0, 1, 2, 3].map((i) => (
                            <i
                              key={i}
                              className={i < Number(n) ? (fila === 3 && i === 3 ? "nuevo" : "on") : undefined}
                            />
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            </ol>
            <div className="rubrica-chips revela">
              {RUBRICA.map((d) => (
                <span key={d}>{d}</span>
              ))}
              <span className="fuente">Rúbrica del piloto, sin puntajes ni ponderaciones.</span>
            </div>
          </div>
        </section>)}
        {publico === "estudiante" && (<section className="banda" id="que-te-llevas" data-seccion="que_te_llevas">
          <div className="wrap lleva">
            <div className="revela">
              <p className="ojo sec-ojo">Qué te llevás</p>
              <h2 className="sec-h">Lo que hiciste, dicho por otros.</h2>
              <p className="sec-p">
                No es una autoevaluación. Es lo que vieron personas que te miraron trabajar, ordenado por capacidad.
              </p>
              <a href="/ingresar?tipo=estudiante" className="btn btn-verde" data-cta="lleva_estudiante">
                Quiero demostrar lo que sé
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <div className="revela">
              <ul className="lleva-lista">
                <li>
                  <span className="ico">
                    <MessageSquareText aria-hidden="true" />
                  </span>
                  <div>
                    <h3>Devolución por capacidad</h3>
                    <p>Qué se observó en vos y en tu equipo, en palabras de quien te vio trabajar.</p>
                  </div>
                </li>
                <li>
                  <span className="ico">
                    <Sprout aria-hidden="true" />
                  </span>
                  <div>
                    <h3>Perfil de habilidades blandas</h3>
                    <p>Crece con cada desafío y muestra tu evolución.</p>
                  </div>
                </li>
                <li>
                  <span className="ico">
                    <QrCode aria-hidden="true" />
                  </span>
                  <div>
                    <h3>
                      Para compartir <span className="pronto">Próximamente</span>
                    </h3>
                    <p>Un CV con evidencia y un QR que cualquiera puede verificar.</p>
                  </div>
                </li>
              </ul>
              <p className="privacidad">
                <Lock aria-hidden="true" />
                Tus datos son tuyos. Una empresa ve tu perfil sin tu nombre hasta que vos aceptás el contacto.
              </p>
            </div>
          </div>
        </section>)}
        {publico === "empresa" && (<section className="banda empresas" id="empresas" data-seccion="empresas">
          <div className="wrap empresas-in">
            <div className="revela">
              <p className="ojo sec-ojo">Para empresas</p>
              <h2 className="sec-h">Conocé cómo trabaja alguien antes de la entrevista.</h2>
              <p className="sec-p">
                TIM propone conocer cómo las personas encaran un desafío: el proceso, además del resultado.
                Hoy podés crear tu cuenta de empresa; la exploración de perfiles y el contacto se habilitarán en una próxima etapa.
              </p>
              <div className="pruebas-emp">
                <div>
                  <span className="num">10/15</span>
                  <p>
                    PyMEs sin área de selección no consiguieron candidatos adecuados.
                    <span className="fuente">Relevamiento TIM, sep-2026</span>
                  </p>
                </div>
                <div>
                  <span className="num">14/24</span>
                  <p>
                    empresas confiarían más en una evaluación que salga de una necesidad real; 12 de 24, si muestra el
                    proceso.
                    <span className="fuente">Relevamiento TIM, sep-2026 · respuesta múltiple</span>
                  </p>
                </div>
              </div>
              <ul className="puntos-emp">
                <li>
                  <Check aria-hidden="true" />
                  Talento que no llega por tu red de contactos.
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Perfiles anónimos hasta que la persona acepta el contacto.
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Un desafío es una evaluación, nunca trabajo gratis.
                </li>
              </ul>
            </div>
            <div className="revela">
              <div className="tarjeta-registro"><Building2 className="size-10" aria-hidden="true" /><h3>Tu empresa empieza acá.</h3><p>Creá tu cuenta y completá el perfil de tu empresa.</p><Link href="/ingresar?tipo=empresa" className="btn btn-verde">Crear mi cuenta de empresa<ArrowRight aria-hidden="true" /></Link><Link href="/ingresar?modo=entrar&tipo=empresa" className="enlace-texto">Ya tengo cuenta</Link></div>
            </div>
          </div>
        </section>)}
        {publico === "estudiante" && (<section className="banda" id="hackaton" data-seccion="hackaton">
          <div className="wrap hack-in">
            <div className="fecha revela" aria-hidden="true">
              <div className="mes">OCTUBRE</div>
              <div className="dia">31</div>
              <div className="sem">Sábado</div>
            </div>
            <div className="revela">
              <p className="ojo sec-ojo">La primera hackatón</p>
              <h2 className="sec-h">Primera hackatón TIM: sábado 31/10.</h2>
              <p className="sec-p">
                Equipos de estudiantes, un desafío real y un mentor por equipo. Cada participante se lleva su
                devolución.
              </p>
              <Link href="/ingresar?modo=entrar" className="btn btn-verde" data-cta="hackaton_ingresar">
                Entrá con tu cuenta
                <ArrowRight aria-hidden="true" />
              </Link>
              <p className="hack-datos">
                TIM nace de un relevamiento a 214 personas y 25 empresas, en septiembre de 2026.
              </p>
            </div>
          </div>
        </section>)}
        {publico !== "principal" && (<section className="banda faq" id="preguntas" data-seccion="preguntas">
          <div className="wrap faq-in">
            <div className="revela">
              <p className="ojo sec-ojo">Preguntas frecuentes</p>
              <h2 className="sec-h">Lo que nos preguntan.</h2>
            </div>
            <div className="revela">
              {PREGUNTAS.filter((p) => publico === "empresa" ? p.p !== "¿Cuesta algo?" && p.p !== "¿Me garantiza un trabajo?" : p.p !== "Soy empresa: ¿el desafío es trabajo gratis?").map((q) => (
                <details key={q.p}>
                  <summary>
                    {q.p}
                    <Plus aria-hidden="true" />
                  </summary>
                  <p>{q.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>)}
        <section className="banda final" aria-label="Crear tu cuenta">
          <div className="wrap cierre-registro"><p className="ojo sec-ojo">Sumate a TIM</p><h2 className="sec-h">Tu próximo paso empieza acá.</h2><div className="hero-cta">
            {publico !== "empresa" && <Link href="/ingresar?tipo=estudiante" className="btn btn-lila">Quiero demostrar mi talento<ArrowRight aria-hidden="true" /></Link>}
            {publico !== "estudiante" && <Link href="/ingresar?tipo=empresa" className="btn btn-linea">Quiero contratar talento<ArrowRight aria-hidden="true" /></Link>}
          </div><Link href="/ingresar?modo=entrar" className="enlace-texto">Ya tengo cuenta. Entrar</Link></div>
        </section>
      </main>

      <footer>
        <div className="wrap pie">
          <Logo className="logo" />
          <p>Tu capacidad, en evidencia.</p>
          <nav aria-label="Pie">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/ingresar?modo=entrar">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
