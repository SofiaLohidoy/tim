import { Suspense } from "react";
import { NavOrganizador } from "./nav";

export default function Layout({ children }: LayoutProps<"/organizador">) {
  return (
    <div className="min-h-dvh bg-background">
      <Suspense fallback={<div className="h-16 lg:h-0" />}>
        <NavOrganizador />
      </Suspense>
      <div className="lg:pl-64 print:pl-0">
        <main id="contenido-organizador" className="mx-auto w-full min-w-0 max-w-6xl px-5 py-6 pb-16 lg:px-8 lg:py-8 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
