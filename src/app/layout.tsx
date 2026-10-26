import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Tipografías del manual de marca: Manrope en títulos y datos destacados, Inter en texto.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["700", "800"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const SITIO = process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: { default: "TIM — Tu capacidad, en evidencia.", template: "%s · TIM" },
  description:
    "Resolvé desafíos reales en equipo. Mentores observan cómo trabajás y esa evidencia queda en tu perfil.",
  applicationName: "TIM",
  openGraph: {
    title: "TIM — Tu capacidad, en evidencia.",
    description: "Resolvé desafíos reales en equipo. Mentores observan cómo trabajás y esa evidencia queda en tu perfil.",
    locale: "es_AR",
    type: "website",
    siteName: "TIM",
  },
  appleWebApp: { title: "TIM", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#17483F",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${manrope.variable} ${inter.variable} antialiased`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
