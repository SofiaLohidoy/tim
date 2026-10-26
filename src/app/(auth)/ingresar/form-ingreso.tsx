"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crearCuenta, ingresar, ingresarConGoogle, salir, type EstadoIngreso } from "../acciones";

type Modo = "crear" | "entrar";

export function FormIngreso(props: {
  siguiente: string;
  desdeQr: boolean;
  errorGoogle: boolean;
  google: boolean;
  email: string;
  invitacion: boolean;
  aviso: "otro_mail" | "inexistente" | null;
}) {
  const [modo, setModo] = useState<Modo>("crear");
  const [verClave, setVerClave] = useState(false);
  const [estadoCrear, accionCrear, creando] = useActionState<EstadoIngreso, FormData>(crearCuenta, {});
  const [estadoEntrar, accionEntrar, entrando] = useActionState<EstadoIngreso, FormData>(ingresar, {});
  const estado = modo === "crear" ? estadoCrear : estadoEntrar;
  const ocupado = creando || entrando;

  return (
    <div className="mt-8 flex flex-1 flex-col">
      <h1 className="font-heading text-[2rem] leading-[1.05] font-extrabold">
        {props.invitacion
          ? "Te invitaron a TIM."
          : props.desdeQr
            ? "Bienvenido a la hackatón."
            : modo === "crear"
              ? "Creá tu cuenta."
              : "Qué bueno verte de nuevo."}
      </h1>
      <p className="mt-2 text-primary-foreground/75">
        {props.invitacion
          ? `Entrá o creá tu cuenta con ${props.email || "el mail invitado"}.`
          : modo === "crear"
            ? "Te lleva menos de un minuto."
            : "Entrá con tu mail y tu contraseña."}
      </p>
      {props.aviso && (
        <p role="alert" className="mt-4 rounded-2xl bg-lila-claro px-4 py-3 text-sm font-medium text-verde-oscuro">
          {props.aviso === "otro_mail"
            ? "Esa invitación es para otro mail. Salí y entrá con el mail al que te llegó el link."
            : "No encontramos esa invitación. Pedile al equipo TIM un link nuevo."}
        </p>
      )}
      {props.aviso === "otro_mail" && (
        <form action={salir} className="mt-3">
          <Button type="submit" variant="secondary" className="h-11 rounded-xl">
            Salir de esta cuenta
          </Button>
        </form>
      )}

      <div className="mt-7 rounded-3xl bg-background p-5 text-foreground shadow-xl shadow-black/20">
        <div role="tablist" aria-label="Modo" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
          {(["crear", "entrar"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={modo === m}
              onClick={() => setModo(m)}
              className="h-10 rounded-xl text-sm font-semibold text-muted-foreground transition-colors aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-sm"
            >
              {m === "crear" ? "Crear cuenta" : "Ya tengo cuenta"}
            </button>
          ))}
        </div>

        {props.google && (
          <>
            <form action={ingresarConGoogle} className="mt-5">
              <input type="hidden" name="siguiente" value={props.siguiente} />
              <Button type="submit" variant="outline" className="h-12 w-full gap-3 rounded-xl text-[15px]">
                <GoogleIcono />
                Seguir con Google
              </Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />o con tu mail<span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        {props.errorGoogle && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No pudimos entrar con Google. Probá con tu mail y una contraseña.
          </p>
        )}

        <form action={modo === "crear" ? accionCrear : accionEntrar} className={props.google ? "grid gap-4" : "mt-5 grid gap-4"} key={modo}>
          <input type="hidden" name="siguiente" value={props.siguiente} />
          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              defaultValue={estado.email ?? props.email}
              className="h-12 rounded-xl border-0 bg-muted px-3.5 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={verClave ? "text" : "password"}
                autoComplete={modo === "crear" ? "new-password" : "current-password"}
                required
                minLength={8}
                className="h-12 w-full rounded-xl border-0 bg-muted pr-12 pl-3.5 text-base ring-1 ring-border outline-none ring-inset focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground"
                aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {verClave ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {modo === "crear" && <p className="text-xs text-muted-foreground">Al menos 8 caracteres.</p>}
          </div>
          {estado.error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {estado.error}
            </p>
          )}
          <Button type="submit" disabled={ocupado} className="h-12 rounded-xl text-[15px] font-semibold">
            {ocupado ? "Un momento…" : modo === "crear" ? "Crear mi cuenta" : "Entrar"}
          </Button>
          {modo === "entrar" && (
            <p className="text-center text-sm text-muted-foreground">
              ¿Te olvidaste la contraseña? Pedile al equipo TIM que te la restablezca.
            </p>
          )}
        </form>
      </div>
      <p className="mt-auto pt-8 text-center text-xs text-primary-foreground/60">
        Al crear tu cuenta aceptás que TIM guarde tus datos para organizar los desafíos.{" "}
        <a href="/privacidad" className="underline underline-offset-2">
          Privacidad
        </a>
      </p>
    </div>
  );
}

function GoogleIcono() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-2 3.2-4.8 3.2-8.2z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9L5.8 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}
