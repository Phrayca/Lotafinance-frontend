"use client";
import Link from "next/link";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-lg2 p-5 ${className}`}>{children}</div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "dangerText";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const base = "w-full flex items-center justify-center rounded-md2 font-bold text-[15px] py-[15px] px-[18px] transition-colors";
  const styles: Record<string, string> = {
    primary: "bg-gold text-[#1c1406] active:bg-goldbright disabled:opacity-50",
    ghost: "bg-transparent text-dim border border-border",
    danger: "bg-red text-white",
    dangerText: "bg-transparent text-red font-semibold text-[14.5px] py-2 w-full",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12.5px] text-dim mb-[7px]">{children}</label>;
}

export function Chip({ children, tone = "dim" }: { children: React.ReactNode; tone?: "green" | "gold" | "dim" }) {
  const tones: Record<string, string> = {
    green: "bg-greenbg text-green",
    gold: "bg-[rgba(201,154,75,0.15)] text-goldbright",
    dim: "bg-surface2 text-dim",
  };
  return <span className={`text-xs font-bold px-[10px] py-1 rounded-full ${tones[tone]}`}>{children}</span>;
}

export function Switch({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`w-[46px] h-[27px] rounded-full relative flex-none cursor-pointer transition-colors ${
        on ? "bg-green" : "bg-surface3"
      }`}
    >
      <div
        className={`absolute top-[3px] w-[21px] h-[21px] rounded-full bg-white transition-all ${
          on ? "left-[22px]" : "left-[3px]"
        }`}
      />
    </div>
  );
}

export function RowItem({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between bg-surface border border-border rounded-md2 px-4 py-[15px] cursor-pointer active:bg-surface2">
      {children}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return <div onClick={onClick}>{content}</div>;
}

export function BackHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center gap-3.5 px-5 pt-2 pb-3.5">
      <Link
        href={backHref}
        className="w-[34px] h-[34px] rounded-full bg-surface border border-border flex items-center justify-center flex-none"
      >
        ‹
      </Link>
      <h1 className="text-lg font-bold m-0 heading-font">{title}</h1>
    </div>
  );
}
