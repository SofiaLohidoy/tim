import Link from "next/link";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/marca";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
          <Link href="/continuar" aria-label="TIM, inicio">
            <Logo className="h-6 w-auto" />
          </Link>
          <Link href="/perfil" className="grid size-10 place-items-center rounded-full" aria-label="Perfil">
            <UserRound className="size-5" />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-5 pt-5 pb-10">{children}</main>
    </div>
  );
}
