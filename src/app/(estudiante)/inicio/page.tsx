import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, QrCode, Users } from "lucide-react";
import { Logo } from "@/components/marca";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirUsuario } from "@/lib/sesion";
import { eventoActual, fechaLarga, nombreDe } from "@/lib/eventos";
import { FormCodigo, FormEntrega, SubirCv } from "./piezas";
import { SubirEntrega } from "@/components/app/subir-entrega";

export const metadata: Metadata = { title: "Inicio" };

export default function Pagina({ searchParams }: PageProps<"/inicio">) {
  return (
    <main className="mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28">
      <Suspense fallback={<Esqueleto />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/inicio">["searchParams"] }) {
  const [u, params] = await Promise.all([exigirUsuario("/inicio"), searchParams]);
  if (!u.onboardingCompleto && !u.roles.some((r) => r !== "estudiante")) redirect("/bienvenida");

  const db = await clienteServidor();
  const evento = await eventoActual(db);

  const [asistencia, miembro, desafio, devolucion, estudiante] = await Promise.all([
    evento
      ? db.from("asistencias").select("creado_en").eq("evento_id", evento.id).eq("usuario_id", u.id).maybeSingle()
      : null,
    evento
      ? db
          .from("miembros_equipo")
          .select("equipo_id, equipos(nombre, entrega_url)")
          .eq("evento_id", evento.id)
          .eq("usuario_id", u.id)
          .maybeSingle()
      : null,
    evento
      ? db.from("desafios").select("titulo, consigna").eq("evento_id", evento.id).neq("estado", "borrador").maybeSingle()
      : null,
    evento ? db.from("devoluciones").select("id").eq("evento_id", evento.id).maybeSingle() : null,
    db.from("estudiantes").select("cv_path").eq("usuario_id", u.id).maybeSingle(),
  ]);

  const equipoId = miembro?.data?.equipo_id;
  const companeros = equipoId
    ? await db.from("miembros_equipo").select("usuario_id, perfiles(nombre, apellido, email)").eq("equipo_id", equipoId)
    : null;
  const equipo = miembro?.data?.equipos;
  const estuvo = Boolean(asistencia?.data);
  const avisoAsistencia = params.asistencia;

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h1 className="text-[1.7rem] leading-tight font-extrabold">{u.nombre ?? nombreDe({ ...u })}</h1>
        </div>
        <Link href="/inicio" aria-label="TIM, inicio" className="shrink-0 text-primary"><Logo className="h-8 w-auto sm:h-10" /></Link>
      </header>

      <Link href="/hackaton/bienvenida" className="flex min-h-16 items-center justify-between gap-3 rounded-3xl bg-lila-claro p-5 font-semibold text-verde-oscuro"><span>Tu guía de la hackatón<span className="mt-1 block text-sm font-normal">Información, dinámica y reglas pendientes.</span></span><ArrowRight className="size-5 shrink-0" aria-hidden="true"/></Link>
      {avisoAsistencia === "ok" && (
        <Aviso tono="ok">Listo, quedó marcada tu asistencia. ¡Que lo disfrutes!</Aviso>
      )}
      {avisoAsistencia === "vencido" && (
        <Aviso tono="error">Ese QR ya cambió. Escaneá el de la pantalla de nuevo o escribí el código abajo.</Aviso>
      )}
      {avisoAsistencia === "error" && (
        <Aviso tono="error">No pudimos marcar tu asistencia. Probá de nuevo o avisale al equipo TIM.</Aviso>
      )}

      {!evento ? (
        <Tarjeta>
          <p className="font-heading text-lg font-bold">Todavía no hay un desafío abierto.</p>
          <p className="mt-1 text-muted-foreground">Te avisamos cuando abra el próximo.</p>
        </Tarjeta>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <div className="p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-lila-texto uppercase">
                {evento.estado === "cerrado" ? "Terminó" : evento.estado === "en_curso" ? "En curso" : "Próximo"}
              </p>
              <h2 className="mt-1.5 text-2xl font-extrabold">{evento.nombre}</h2>
              <div className="mt-3 grid gap-1.5 text-sm text-primary-foreground/80">
                <span className="flex items-center gap-2 capitalize">
                  <CalendarDays className="size-4" /> {fechaLarga(evento.fecha)}
                </span>
                {evento.lugar && (
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4" /> {evento.lugar}
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 bg-black/10 p-5">
              {estuvo ? (
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="size-5 text-lila" /> Estuviste ahí.
                </p>
              ) : evento.estado === "cerrado" ? (
                <p className="text-primary-foreground/80">No quedó registrada tu asistencia.</p>
              ) : (
                <div className="grid gap-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <QrCode className="size-5 text-lila" /> Al llegar, escaneá el QR de la pantalla.
                  </p>
                  <div className="rounded-2xl bg-background p-4 text-foreground">
                    <FormCodigo />
                  </div>
                </div>
              )}
            </div>
          </section>

          {desafio?.data && (
            <Tarjeta>
              <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">El desafío</p>
              <h2 className="mt-1.5 text-xl font-extrabold">{desafio.data.titulo}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
                {desafio.data.consigna}
              </p>
            </Tarjeta>
          )}

          <Tarjeta>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">
              <Users className="size-4" /> Tu equipo
            </p>
            {equipo && equipoId ? (
              <>
                <h2 className="mt-1.5 text-xl font-extrabold">{equipo.nombre}</h2>
                <ul className="mt-3 grid gap-2">
                  {(companeros?.data ?? []).map((c) => (
                    <li key={c.usuario_id} className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-lila-claro text-sm font-bold text-verde-oscuro">
                        {nombreDe(c.perfiles).slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-[15px]">
                        {nombreDe(c.perfiles)}
                        {c.usuario_id === u.id && <span className="text-muted-foreground"> (vos)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                {evento.estado !== "cerrado" && (
                  <div className="mt-5 border-t border-border pt-4">
                    <FormEntrega equipo={equipoId} actual={equipo.entrega_url} />
                    <SubirEntrega equipo={equipoId} />
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Todavía no tenés equipo. El equipo TIM los arma el día del evento.
              </p>
            )}
          </Tarjeta>

          <Tarjeta>
            <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Tu devolución</p>
            {devolucion?.data ? (
              <Link href="/devolucion" className="mt-2 flex items-center justify-between gap-3">
                <span className="font-heading text-lg font-bold">Ya está lista. Miralo.</span>
                <ArrowRight className="size-5 text-violeta-texto" />
              </Link>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Mentores y jurados te observan durante el desafío. Tu devolución llega cuando el equipo TIM la
                publique.
              </p>
            )}
          </Tarjeta>
        </>
      )}

      {u.roles.includes("estudiante") && (
        <Tarjeta>
          <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">CV (opcional)</p>
          <p className="mt-2 mb-4 text-[15px] text-muted-foreground">
            Lo usamos para comparar qué dice tu CV y qué se observó en el desafío. Solo lo ve el equipo TIM.
          </p>
          <SubirCv usuarioId={u.id} tieneCv={Boolean(estudiante.data?.cv_path)} />
        </Tarjeta>
      )}
    </div>
  );
}

function Tarjeta({ children }: { children: React.ReactNode }) {
  return <section className="rounded-3xl bg-card p-5 ring-1 ring-border">{children}</section>;
}

function Aviso({ children, tono }: { children: React.ReactNode; tono: "ok" | "error" }) {
  return (
    <p
      role="status"
      className={
        tono === "ok"
          ? "rounded-2xl bg-lila-claro px-4 py-3 font-medium text-verde-oscuro"
          : "rounded-2xl bg-destructive/10 px-4 py-3 font-medium text-destructive"
      }
    >
      {children}
    </p>
  );
}

function Esqueleto() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <div className="h-14 w-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-3xl bg-muted" />
      <div className="h-32 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}
