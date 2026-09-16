"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "home", label: "Accueil", href: "/home" },
  { key: "historique", label: "Historique", href: "/historique" },
  { key: "robot", label: "Robot", href: "/robot" },
  { key: "formation", label: "Formation", href: "/formation" },
  { key: "profil", label: "Profil", href: "/profil" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="flex justify-around items-center px-2 pt-2.5 pb-4 border-t border-border bg-bg fixed bottom-0 left-0 right-0 max-w-md mx-auto">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`flex flex-col items-center gap-1 text-[10.5px] w-14 ${
              active ? "text-goldbright" : "text-dimmer"
            }`}
          >
            <span className="text-lg">●</span>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
