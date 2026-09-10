"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirConversations,
  obtenirStatistiques,
  urlPhotoDeProfil,
  StatMois,
} from "@/lib/api";
import {
  HomeIcon,
  LoanIcon,
  RepaymentIcon,
  ClientsIcon,
  ScoreIcon,
  ReportsIcon,
  AuditIcon,
  SettingsIcon,
  MessagesIcon,
  ProfileIcon,
  IconCircle,
  CouleurLotafinance,
} from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

type Utilisateur = { id: string; email: string; role: string };

function formaterMontant(m: number) {
  return `${m.toLocaleString("fr-FR")} F`;
}

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} width="20" height="20">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONES = {
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.7-1.6L13.4 2h-2.8l-.4 2.8a7 7 0 0 0-2.7 1.6l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.06 1 .2 1.6l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.7 1.6l.4 2.8h2.8l.4-2.8a7 7 0 0 0 2.7-1.6l2.3.9 2-3.4-2-1.5c.14-.5.2-1 .2-1.6Z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01",
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  loans: "M7 4h10v16l-5-3-5 3V4Z M9 9h6 M9 12h6",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  mail: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  calendarCheck: "M4 6h16v14H4V6Z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  chevronDown: "M6 9l6 6 6-6",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  download: "M12 3v12 M7 10l5 5 5-5 M4 21h16",
  history: "M3 3v5h5 M3.05 13a9 9 0 1 0 2.13-7.36L3 8",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  loans: LoanIcon,
  calendarCheck: RepaymentIcon,
  users: ClientsIcon,
  target: ScoreIcon,
  chart: ReportsIcon,
  history: AuditIcon,
  gear: SettingsIcon,
  mail: MessagesIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "blue", "purple", "green", "orange", "red"];

const COULEURS_ICONES = ["#F4C95D", "#C9A6F0", "#8FD9A8", "#7DBEF0", "#F4A5C9", "#F4956D", "#F0D96A", "#9AD1E8", "#D9A6F0", "#8FE0C4", "#F0C08A", "#A8C9F0", "#F0A6B8"];

const LIENS_NAV = [
  { href: "/analyste", label: "Tableau de bord", icone: "home" as const },
  { href: "/analyste/toutes", label: "Toutes les demandes", icone: "loans" as const },
  { href: "/analyste/toutes?statut=approuve", label: "Dossiers approuvés", icone: "loans" as const },
  { href: "/analyste/toutes?statut=refuse", label: "Dossiers refusés", icone: "loans" as const },
  { href: "/analyste/remboursements", label: "Remboursements", icone: "calendarCheck" as const },
  { href: "/analyste/clients", label: "Clients", icone: "users" as const },
  { href: "/analyste/analyse-scoring", label: "Analyse & Scoring", icone: "target" as const },
  { href: "/analyste/rapports", label: "Rapports & Statistiques", icone: "chart" as const, actif: true },
  { href: "/analyste/audit", label: "Audit & Logs", icone: "history" as const },
  { href: "/analyste/parametres", label: "Paramètres", icone: "gear" as const },
  { href: "/analyste/utilisateurs", label: "Gestion des utilisateurs", icone: "users" as const },
  { href: "/analyste/messages", label: "Messages", icone: "mail" as const },
  { href: "/analyste/profil", label: "Mon profil", icone: "user" as const },
];

function GraphiquePortefeuille({ data }: { data: StatMois[] }) {
  if (data.length === 0) return null;
  const maxValeur = Math.max(1, ...data.flatMap((d) => [d.capital_prete, d.montant_encaisse]));
  const espacement = 70;
  const hauteurMax = 130;
  const largeurBarre = 20;
  const largeurTotale = data.length * espacement + 20;

  return (
    <div>
      <svg viewBox={`0 0 ${largeurTotale} 175`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <line x1="10" y1="150" x2={largeurTotale - 10} y2="150" stroke="#232733" strokeWidth="1" />
        {data.map((d, i) => {
          const x = 25 + i * espacement;
          const hCapital = (d.capital_prete / maxValeur) * hauteurMax;
          const hEncaisse = (d.montant_encaisse / maxValeur) * hauteurMax;
          return (
            <g key={d.mois + i}>
              <rect x={x} y={150 - hCapital} width={largeurBarre} height={Math.max(hCapital, 1)} fill="#C9A227" rx="2" />
              <rect x={x + largeurBarre + 4} y={150 - hEncaisse} width={largeurBarre} height={Math.max(hEncaisse, 1)} fill="#3DDC97" rx="2" />
              <text x={x + largeurBarre + 2} y="166" textAnchor="middle" fontSize="10" fill="#7C8494">{d.mois}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 mt-2 text-xs">
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-2.5 rounded-sm bg-[#C9A227]" /> Capital prêté</span>
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-2.5 rounded-sm bg-[#3DDC97]" /> Montant encaissé</span>
      </div>
    </div>
  );
}

function LigneEvolution({ data }: { data: StatMois[] }) {
  if (data.length === 0) return null;
  const maxV = Math.max(1, ...data.flatMap((d) => [d.nombre_dossiers_traites, d.nombre_approuves]));
  const w = 700, h = 150, pad = 20;
  const stepX = data.length > 1 ? (w - 2 * pad) / (data.length - 1) : 0;

  function points(cle: "nombre_dossiers_traites" | "nombre_approuves") {
    return data.map((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (d[cle] / maxV) * (h - 2 * pad);
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <polyline points={points("nombre_dossiers_traites")} fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points("nombre_approuves")} fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <text key={d.mois} x={pad + i * stepX} y={h + 14} textAnchor="middle" fontSize="10" fill="#7C8494">{d.mois}</text>
        ))}
      </svg>
      <div className="flex items-center gap-5 mt-2 text-xs">
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-0.5 bg-[#5B8DEF]" /> Dossiers traités</span>
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-0.5 bg-[#3DDC97]" /> Approuvés</span>
      </div>
    </div>
  );
}

const PERIODES = [
  { valeur: 3, label: "3 mois" },
  { valeur: 6, label: "6 mois" },
  { valeur: 12, label: "12 mois" },
];

export default function PageRapports() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [totalNonLus, setTotalNonLus] = useState(0);

  const [periode, setPeriode] = useState(6);
  const [statistiques, setStatistiques] = useState<StatMois[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    (async () => {
      try {
        const profil = await recupererMonProfilUtilisateur(token);
        if (profil.role !== "analyste" && profil.role !== "admin") {
          router.push("/tableau-de-bord");
          return;
        }
        setUtilisateur(profil);
        setAvatarUrl(urlPhotoDeProfil(profil.id));
        const stats = await obtenirStatistiques(token, periode);
        setStatistiques(stats);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    obtenirConversations(token)
      .then((liste) => setTotalNonLus(liste.reduce((s, c) => s + c.non_lus, 0)))
      .catch(() => {});

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    obtenirStatistiques(token, periode)
      .then(setStatistiques)
      .catch(() => {});
  }, [periode]);

  function seDeconnecter() {
    localStorage.removeItem("token");
    router.push("/");
  }

  function basculerSidebar() {
    setSidebarReduite((v) => {
      const nouveau = !v;
      localStorage.setItem("sidebar_reduite", nouveau ? "1" : "0");
      return nouveau;
    });
  }

  function gererRecherche(e: React.FormEvent) {
    e.preventDefault();
    if (recherche.trim()) router.push(`/analyste/recherche?q=${encodeURIComponent(recherche.trim())}`);
  }

  function exporterCSV() {
    const entetes = ["Mois", "Capital prêté (F)", "Montant encaissé (F)", "Dossiers traités", "Dossiers approuvés"];
    const lignes = statistiques.map((d) => [d.mois, d.capital_prete, d.montant_encaisse, d.nombre_dossiers_traites, d.nombre_approuves]);
    const csv = [entetes, ...lignes].map((ligne) => ligne.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `lotafinance_statistiques_${periode}mois.csv`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex">
      <aside className={`${sidebarReduite ? "w-16" : "w-60"} shrink-0 border-r border-[#1B1F29] flex flex-col py-6 px-3 transition-all duration-200`}>
        <div className={`flex items-center gap-2 mb-8 ${sidebarReduite ? "justify-center px-0" : "px-2"}`}>
          <span className="w-9 h-9 rounded-lg bg-[#C9A227] flex items-center justify-center text-[#0B0E14] font-bold font-['Source_Serif_4',serif] shrink-0">L</span>
          {!sidebarReduite && (
            <div>
              <p className="text-sm font-semibold text-[#E8E6DE] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#7C8494]">Espace analyste</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {LIENS_NAV.map((lien, i) => (
            <button
              key={lien.href}
              onClick={() => router.push(lien.href)}
              title={sidebarReduite ? lien.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm transition ${sidebarReduite ? "justify-center px-0" : "px-3"} ${
                lien.actif ? "bg-[#C9A227] text-[#0B0E14] font-medium" : "text-[#B8BAC4] hover:bg-[#12151C]"
              }`}
            >
                            <IconCircle color={COULEURS_NAV[i % COULEURS_NAV.length]} size={28} actif={lien.actif}>
                {(() => {
                  const IconeRiche = ICONES_RICHES[lien.icone];
                  return IconeRiche ? <IconeRiche size={16} /> : Ic(lien.icone, "w-4 h-4");
                })()}
              </IconCircle>
              {!sidebarReduite && <span className="flex-1 text-left">{lien.label}</span>}
              {lien.href === "/analyste/messages" && totalNonLus > 0 && (
                <span className={`${sidebarReduite ? "absolute translate-x-3 -translate-y-3" : ""} w-5 h-5 rounded-full bg-[#C24545] text-white text-[10px] flex items-center justify-center shrink-0`}>
                  {totalNonLus}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button
          onClick={basculerSidebar}
          title={sidebarReduite ? "Déplier le menu" : "Réduire le menu"}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs text-[#7C8494] hover:bg-[#12151C] hover:text-[#E8E6DE] transition"
        >
          {Ic(sidebarReduite ? "chevronRight" : "chevronLeft", "w-4 h-4")}
          {!sidebarReduite && "Réduire"}
        </button>
      </aside>

      <div className="flex-1 px-8 py-6 overflow-x-auto">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <form onSubmit={gererRecherche} className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6070]">{Ic("search", "w-4 h-4")}</span>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un dossier, client, numéro de téléphone..."
                className="w-full bg-[#12151C] border border-[#232733] rounded-md pl-9 pr-3 py-2.5 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
              />
            </form>

            <button onClick={() => router.push("/analyste/messages")} title="Messages" className="relative shrink-0 text-[#7C8494] hover:text-[#E8E6DE] transition p-2">
              {Ic("mail", "w-5 h-5")}
              {totalNonLus > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C24545] text-white text-[9px] flex items-center justify-center">{totalNonLus}</span>
              )}
            </button>

            <div className="relative shrink-0">
              <button onClick={() => setMenuProfilOuvert((v) => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-[#232733] hover:border-[#3A4050] transition">
                <span className="w-7 h-7 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] flex items-center justify-center overflow-hidden shrink-0">
                  {utilisateur && avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    Ic("user", "w-3.5 h-3.5")
                  )}
                </span>
                <span className="text-xs text-[#B8BAC4] hidden md:inline">{utilisateur?.email?.split("@")[0]}</span>
                {Ic("chevronDown", "w-3 h-3 text-[#7C8494]")}
              </button>
              {menuProfilOuvert && (
                <div className="absolute right-0 top-10 w-44 bg-[#12151C] border border-[#232733] rounded-md shadow-xl z-10 overflow-hidden">
                  <button onClick={() => router.push("/analyste/profil")} className="w-full text-left px-3 py-2 text-sm text-[#B8BAC4] hover:bg-[#171B24] transition">
                    Mon profil
                  </button>
                  <button onClick={seDeconnecter} className="w-full text-left px-3 py-2 text-sm text-[#F0A0A0] hover:bg-[#171B24] transition">
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">Rapports & Statistiques</h1>
              <p className="text-[#7C8494] text-sm mt-1">Évolution du portefeuille et journal des décisions</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-[#12151C] border border-[#232733] rounded-md p-1">
                {PERIODES.map((p) => (
                  <button
                    key={p.valeur}
                    onClick={() => setPeriode(p.valeur)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition ${periode === p.valeur ? "bg-[#C9A227] text-[#0B0E14]" : "text-[#7C8494] hover:text-[#E8E6DE]"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exporterCSV}
                disabled={statistiques.length === 0}
                className="flex items-center gap-1.5 text-xs font-medium text-[#C9A227] border border-[#3A3013] bg-[#1B1706] rounded-md px-3 py-1.5 hover:bg-[#241E09] transition disabled:opacity-40"
              >
                {Ic("download", "w-3.5 h-3.5")} Exporter CSV
              </button>
            </div>
          </div>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {chargement ? (
            <p className="text-sm text-[#7C8494] font-mono text-center py-8">Chargement...</p>
          ) : (
            <>
              <div className="bg-[#12151C] border border-[#232733] rounded-lg px-5 py-4 mb-4">
                <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Évolution des demandes et approbations ({periode} mois)</p>
                {statistiques.length > 0 ? <LigneEvolution data={statistiques} /> : <p className="text-sm text-[#5A6070] py-8 text-center">Pas assez de données.</p>}
              </div>

              <div className="bg-[#12151C] border border-[#232733] rounded-lg px-5 py-4 mb-4">
                <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Évolution du portefeuille — montants ({periode} mois)</p>
                {statistiques.length > 0 ? <GraphiquePortefeuille data={statistiques} /> : <p className="text-sm text-[#5A6070] py-8 text-center">Pas assez de données.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
