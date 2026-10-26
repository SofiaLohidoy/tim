import Link from "next/link";
import { Logo } from "@/components/marca";
import { NavOrganizador } from "./nav";

export default function Layout({ children }: LayoutProps<"/organizador">) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 bg-primary print:hidden pt-[env(safe-area-inset-top)] text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/organizador" className="flex items-center gap-3" aria-label="Panel de organización">
            <Logo className="h-6 w-auto" />
            <span className="hidden text-sm font-semibold text-primary-foreground/70 sm:inline">Organización</span>
          </Link>
          <Link href="/perfil" className="text-sm font-semibold text-primary-foreground/80 hover:text-primary-foreground">
            Mi perfil
          </Link>
        </div>
        <NavOrganizador />
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-6 pb-16 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
