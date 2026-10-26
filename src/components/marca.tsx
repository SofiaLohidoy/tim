// Logo e isotipo de TIM, dibujados del manual esencial v1.0 (sep-2026).
// Las letras usan currentColor: crema sobre verde, verde sobre crema. Los módulos de la "i"
// (punto lila, cuadrado violeta) no cambian: el manual pide no alterar la secuencia cromática.

export const COLORES = {
  verde: "#17483F",
  verdeOscuro: "#102E28",
  violeta: "#8061EB",
  lila: "#AA8CFA",
  lilaClaro: "#E8DFFF",
  crema: "#FAF8F4",
} as const;

export function Logo({ className, titulo = "TIM" }: { className?: string; titulo?: string }) {
  return (
    <svg viewBox="0 0 236 100" className={className} role="img" aria-label={titulo} fill="currentColor">
      <path d="M0 0H84V26H56V100H28V26H0Z" />
      <circle cx="110" cy="13" r="13" fill={COLORES.lila} />
      <rect x="97" y="32" width="26" height="24" rx="4" fill={COLORES.violeta} />
      <rect x="97" y="62" width="26" height="38" rx="4" />
      <path d="M134 100V0H164L185 52L206 0H236V100H210V46L194 86H176L160 46V100Z" />
    </svg>
  );
}

/** Los tres módulos apilados: el perfil que se construye y acumula evidencia. */
export function Isotipo({ className, base = COLORES.crema }: { className?: string; base?: string }) {
  return (
    <svg viewBox="0 0 26 100" className={className} aria-hidden="true">
      <circle cx="13" cy="13" r="13" fill={COLORES.lila} />
      <rect y="32" width="26" height="24" rx="4" fill={COLORES.violeta} />
      <rect y="62" width="26" height="38" rx="4" fill={base} />
    </svg>
  );
}
