"use client";

/**
 * Système d'icônes centralisé Lotafinance.
 *
 * Chaque icône est un composant réutilisable (pas juste un tracé), pensé pour
 * être présenté dans un cercle coloré via <IconCircle>. Style : fintech
 * premium, arrondi, sobre — plusieurs formes superposées plutôt qu'un simple
 * trait unique, mais sans tomber dans l'illustration lourde ou le cartoon.
 *
 * Utilisation :
 *   <IconCircle color="gold"><LoanIcon /></IconCircle>
 *   <NiveauBadge niveau="argent" />
 */

import React from "react";

export type IconProps = { className?: string; size?: number };

const BASE = "none";

function Svg({ children, className, size = 20 }: { children: React.ReactNode; className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill={BASE} width={size} height={size} className={className}>
      {children}
    </svg>
  );
}

/* ---------------------------- Navigation générale ---------------------------- */

export function HomeIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9.2a.8.8 0 0 0 .8.8H9.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h2.7a.8.8 0 0 0 .8-.8V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17.3" cy="7" r="1.3" fill="currentColor" opacity="0.5" />
    </Svg>
  );
}

export function LoanIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="3" y="7" width="18" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10.5h18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="14.5" r="1.6" fill="currentColor" opacity="0.55" />
      <path d="M7 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function LoanRequestIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="5" y="3" width="11" height="14" rx="1.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 7h6M7.5 10h6M7.5 13h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17.5" cy="17.5" r="3.7" fill="currentColor" opacity="0.16" />
      <path d="M17.5 15.6v3.8 M16 17.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function RepaymentIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="3.5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9h14 M7.5 3.5v3 M13.5 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17.5" cy="16.5" r="4" fill="currentColor" opacity="0.14" />
      <path d="M15.7 15a2.6 2.6 0 1 1 .3 3.4 M15.7 15v1.6h1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DocumentIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5H9l2 2h8a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 19 18.5H4.5A1.5 1.5 0 0 1 3 17V7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.5 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </Svg>
  );
}

export function ProfileIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="12" cy="9.8" r="3.1" fill="currentColor" opacity="0.55" />
      <path d="M5.6 18.2c1-2.6 3.6-4.2 6.4-4.2s5.4 1.6 6.4 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function SupportIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="3" y="12.5" width="3.2" height="5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="17.8" y="12.5" width="3.2" height="5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17.8 17.5v.6a2.4 2.4 0 0 1-2.4 2.4h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </Svg>
  );
}

export function SimulatorIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="4" y="3" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.5 6.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7.5" cy="10.3" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="10" cy="10.3" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="12.5" cy="10.3" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="7.5" cy="13.3" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="10" cy="13.3" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="12.5" cy="13.3" r="0.9" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="16.5" r="3.6" fill="currentColor" opacity="0.16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M18 15v3 M16.9 16h2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

export function ReferralIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="8" cy="7.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 18c.7-2.6 2.4-4 4.5-4s3.8 1.4 4.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="6.5" r="1.7" fill="currentColor" opacity="0.5" />
      <path d="M13.7 12.2c.6-1.5 1.9-2.3 3.3-2.3s2.6.8 3.2 2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
      <circle cx="17.3" cy="17.3" r="3.3" fill="currentColor" opacity="0.16" stroke="currentColor" strokeWidth="1.3" />
      <path d="M17.3 15.6v3.4 M15.7 17.3h3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

export function NotificationIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.6 1.3 4.9 1.3 4.9H4.7S6 14.1 6 10.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.7 18.5a2.3 2.3 0 0 0 4.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17.5" cy="6" r="2" fill="currentColor" opacity="0.6" />
    </Svg>
  );
}

export function SettingsIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5l.9 2 2.2.4 1.1 1.9 1.8 1.2-.3 2.1 1.1 1.9-1.1 1.9.3 2.1-1.8 1.2-1.1 1.9-2.2.4-.9 2-.9-2-2.2-.4-1.1-1.9-1.8-1.2.3-2.1L4.5 12l1.1-1.9-.3-2.1 1.8-1.2 1.1-1.9 2.2-.4.9-2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </Svg>
  );
}

export function SearchIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15.3 15.3 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function LogoutIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15.5 16l4.2-4-4.2-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 12H9.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M7.5 12.3l3 3 6-6.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ------------------------------ Espace analyste ------------------------------ */

export function ClientsIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="8.5" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.3 18.3c.9-2.9 2.8-4.5 5.2-4.5s4.3 1.6 5.2 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="7.5" r="2" fill="currentColor" opacity="0.5" />
      <path d="M14.3 13.3c.8-1.2 1.9-1.8 3-1.8 1.7 0 3.2 1.3 3.9 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
    </Svg>
  );
}

export function ApprovedIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h8 M8 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <circle cx="15.5" cy="15.5" r="4" fill="currentColor" opacity="0.16" />
      <path d="M13.6 15.6l1.3 1.3 2.2-2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RejectedIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h8 M8 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <circle cx="15.5" cy="15.5" r="4" fill="currentColor" opacity="0.16" />
      <path d="M14 14l3 3 M17 14l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function RiskIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3.3l7 2.6v5.4c0 4.6-3 7.7-7 9.4-4-1.7-7-4.8-7-9.4V5.9l7-2.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.3 12.1l1.9 1.9 3.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </Svg>
  );
}

export function ScoreIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 15.5a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 15.5 15.3 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" opacity="0.6" />
      <path d="M4 15.5h1.6 M18.4 15.5H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </Svg>
  );
}

export function ReportsIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 20V11 M10 20V6 M16 20v-8 M20 20H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="9.3" r="1.3" fill="currentColor" opacity="0.55" />
      <circle cx="10" cy="4.3" r="1.3" fill="currentColor" opacity="0.55" />
      <circle cx="16" cy="10.3" r="1.3" fill="currentColor" opacity="0.55" />
    </Svg>
  );
}

export function AuditIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3.5 9.5A8.5 8.5 0 1 1 6 15.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3.3 5v4.5H7.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4.3l3 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </Svg>
  );
}

export function UsersManageIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="9" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 18c.9-2.9 2.9-4.5 5.5-4.5s4.6 1.6 5.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18" cy="7.5" r="2.7" fill="currentColor" opacity="0.16" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14.5 10.6a5 5 0 0 1 8-.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
    </Svg>
  );
}

export function MessagesIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6A2.5 2.5 0 0 1 17.5 15H10l-4.5 3.6V15A2.5 2.5 0 0 1 3 12.5v-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="8" cy="9.5" r="1" fill="currentColor" opacity="0.55" />
      <circle cx="12" cy="9.5" r="1" fill="currentColor" opacity="0.55" />
      <circle cx="16" cy="9.5" r="1" fill="currentColor" opacity="0.55" />
    </Svg>
  );
}

export function CapitalIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <ellipse cx="12" cy="7" rx="7.5" ry="2.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 7v5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.5 12v5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
    </Svg>
  );
}

export function ProfitIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4 16l4.5-5 3.5 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 7h4.5v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
    </Svg>
  );
}

export function OverdueIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 9v4l2.6 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 3.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </Svg>
  );
}

/* --------------------------------- Divers --------------------------------- */

export function ChevronLeftIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ------------------------------ Cercle porteur ------------------------------ */

export const PALETTE_LOTAFINANCE = {
  gold: "#C9A227",
  purple: "#A78BFA",
  green: "#3DDC97",
  blue: "#5B8DEF",
  red: "#F0645C",
  orange: "#F0A557",
  white: "#E8E6DE",
} as const;

export type CouleurLotafinance = keyof typeof PALETTE_LOTAFINANCE;

/**
 * Place n'importe quelle icône dans un cercle légèrement coloré — le motif
 * visuel de base repris partout dans l'app (menus, actions rapides, KPI).
 */
export function IconCircle({
  children,
  color = "gold",
  size = 36,
  actif = false,
}: {
  children: React.ReactNode;
  color?: CouleurLotafinance | string;
  size?: number;
  actif?: boolean;
}) {
  const teinte = (PALETTE_LOTAFINANCE as Record<string, string>)[color] || color;
  if (actif) {
    return <span className="flex items-center justify-center shrink-0" style={{ width: size, height: size }}>{children}</span>;
  }
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: teinte, color: "#0B0E14" }}
    >
      {children}
    </span>
  );
}

/* --------------------------------- Niveaux --------------------------------- */

export type NiveauCode = "bronze" | "argent" | "or" | "platine";

const NIVEAUX_INFO: Record<NiveauCode, { libelle: string; couleurs: [string, string]; anneau: string }> = {
  bronze: { libelle: "Bronze", couleurs: ["#C9976B", "#8B6640"], anneau: "#C9976B" },
  argent: { libelle: "Argent", couleurs: ["#D7DEE8", "#9AA6B8"], anneau: "#B9C2D0" },
  or: { libelle: "Or", couleurs: ["#F0D479", "#C9A227"], anneau: "#E0BC4C" },
  platine: { libelle: "Platine", couleurs: ["#E4F4FF", "#7DD3FC"], anneau: "#9FE0FF" },
};

/**
 * Badge de niveau de confiance Lotafinance (Bronze/Argent/Or/Platine).
 * Médaille à deux tons avec anneau lumineux subtil — pas d'animation lourde.
 */
export function NiveauBadge({
  niveau,
  size = 56,
  className,
}: {
  niveau: NiveauCode;
  size?: number;
  className?: string;
}) {
  const info = NIVEAUX_INFO[niveau];
  const idDegrade = `degrade-niveau-${niveau}`;
  return (
    <div className={`relative inline-flex items-center justify-center ${className || ""}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full opacity-40 blur-[6px]" style={{ backgroundColor: info.anneau }} />
      <svg viewBox="0 0 56 56" width={size} height={size} className="relative">
        <defs>
          <linearGradient id={idDegrade} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={info.couleurs[0]} />
            <stop offset="100%" stopColor={info.couleurs[1]} />
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r="25" fill="#0B0E14" stroke={info.anneau} strokeWidth="1.4" opacity="0.9" />
        <circle cx="28" cy="28" r="20.5" fill={`url(#${idDegrade})`} />
        <circle cx="28" cy="28" r="20.5" fill="none" stroke="#0B0E14" strokeWidth="1" opacity="0.25" />
        <path d="M18 30.5l7 6.5 13-15" stroke="#0B0E14" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" fill="none" />
      </svg>
    </div>
  );
}

/** Petit badge textuel (pastille) — version compacte pour listes et en-têtes. */
export function NiveauPastille({ niveau, nombrePrets }: { niveau: NiveauCode; nombrePrets?: number }) {
  const info = NIVEAUX_INFO[niveau];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full pl-1 pr-2.5 py-0.5"
      style={{ backgroundColor: info.anneau + "22", color: info.anneau }}
    >
      <NiveauBadge niveau={niveau} size={18} />
      Niveau {info.libelle}
      {nombrePrets != null && <span className="opacity-70">· {nombrePrets} prêt{nombrePrets > 1 ? "s" : ""}</span>}
    </span>
  );
}

export function libelleNiveau(code: string): string {
  return NIVEAUX_INFO[code as NiveauCode]?.libelle || code;
}
