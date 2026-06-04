import clsx from "clsx";

type BlenkirLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizes = { sm: 36, md: 44, lg: 56 };

/** Logo institucional Blenkir (SVG) — naranja + azul */
export function BlenkirLogo({ size = "md", showText = true, className }: BlenkirLogoProps) {
  const px = sizes[size];
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Colegio Blenkir"
        className="shrink-0 drop-shadow-sm"
      >
        <rect width="64" height="64" rx="14" fill="#1F3A5F" />
        <path
          d="M18 44 L32 14 L46 44 Z"
          fill="#F47C20"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="38" r="6" fill="#FFFFFF" opacity="0.9" />
      </svg>
      {showText ? (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-[var(--sidebar-text)]">Colegio Blenkir</p>
          <p className="truncate text-[10px] font-medium text-[var(--sidebar-muted)]">
            Primaria · Huancayo
          </p>
        </div>
      ) : null}
    </div>
  );
}
