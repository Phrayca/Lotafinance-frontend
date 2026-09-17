"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recupererMonProfilUtilisateur, obtenirTousLesTicketsSupport, TicketDetail } from "@/lib/api";
import { HomeIcon, ClientsIcon, ReportsIcon, DocumentIcon, ProfileIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const LIBELLES_STATUT: Record<string, string> = { nouveau: "Nouveau", en_cours: "En cours", en_attente: "En attente", resolu: "Résolu" };

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} width="20" height="20">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONES = {
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  faq: "M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-1.5 1.3-1.5 2.7 M12 17h.01",
  star: "M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.3l7-.8Z",
  channel: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  reports: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  download: "M12 3v12 M7 10l5 5 5-5 M5 21h14",
  chevronRight: "M9 5l7 7-7 7",
  chevronLeft: "M15 5l-7 7 7 7",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  users: ClientsIcon,
  chart: ReportsIcon,
  document: DocumentIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "gold", "blue", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/rapports", label: "Rapports", icone: "reports" as const, actif: true },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/notifications", label: "Notifications", icone: "bell" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function echapperCsv(valeur: string) {
  if (valeur.includes(",") || valeur.includes('"') || valeur.includes("\n")) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

export default function PageRapports() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [periode, setPeriode] = useState<"7" | "30" | "tous">("30");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    (async () => {
      try {
        const profil = await recupererMonProfilUtilisateur(token);
        if (profil.role !== "support" && profil.role !== "admin") {
          router.push("/tableau-de-bord");
          return;
        }
        setAutorise(true);
        const liste = await obtenirTousLesTicketsSupport(token, "tous");
        setTickets(liste);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
  }, [router]);

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

  if (chargement || !autorise) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  const maintenant = Date.now();
  const ticketsPeriode = tickets.filter((t) => {
    if (periode === "tous") return true;
    const jours = periode === "7" ? 7 : 30;
    return maintenant - new Date(t.cree_le).getTime() <= jours * 24 * 60 * 60 * 1000;
  });

  const resolus = ticketsPeriode.filter((t) => t.statut === "resolu").length;
  const tauxResolution = ticketsPeriode.length > 0 ? Math.round((resolus / ticketsPeriode.length) * 100) : 0;
  const notes = ticketsPeriode.filter((t) => t.satisfaction_note != null);
  const satisfactionMoyenne = notes.length > 0 ? notes.reduce((s, t) => s + (t.satisfaction_note || 0), 0) / notes.length : null;

  function exporterCsv() {
    const entetes = ["ID", "Sujet", "Client", "Statut", "Priorité", "Canal", "Agent", "Date de création", "Date de résolution", "Note"];
    const lignes = ticketsPeriode.map((t) => [
      t.id,
      t.sujet,
      `${t.client_first_name} ${t.client_last_name}`,
      LIBELLES_STATUT[t.statut] || t.statut,
      t.priorite,
      t.canal || "app",
      t.agent_email || "",
      formaterDate(t.cree_le),
      formaterDate(t.resolu_le),
      t.satisfaction_note != null ? String(t.satisfaction_note) : "",
    ].map((v) => echapperCsv(String(v))).join(","));
    const csv = [entetes.join(","), ...lignes].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `rapport-tickets-lotafinance-${new Date().toISOString().slice(0, 10)}.csv`;
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
              <p className="text-[10px] text-[#7C8494]">Service Client</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {LIENS_NAV.map((lien, i) => (
            <div key={lien.href}>
              {!sidebarReduite && i === 0 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1">Gestion</p>}
              {!sidebarReduite && i === 2 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Rapports</p>}
              {!sidebarReduite && i === 5 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Outils</p>}
              <button
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
              </button>
            </div>
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

        <button
          onClick={seDeconnecter}
          title={sidebarReduite ? "Déconnexion" : undefined}
          className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm text-[#7C8494] hover:bg-[#12151C] transition ${sidebarReduite ? "justify-center px-0" : "px-3"}`}
        >
          {Ic("logout")}
          {!sidebarReduite && "Déconnexion"}
        </button>
      </aside>

      <div className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">Rapports</h1>
              <p className="text-[#7C8494] text-sm mt-1">Résumé de l&apos;activité et export des données</p>
            </div>
            <div className="flex gap-2">
              {(["7", "30", "tous"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                    periode === p ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#0B0E14] border border-[#232733] text-[#7C8494] hover:text-[#E8E6DE]"
                  }`}
                >
                  {p === "7" ? "7 jours" : p === "30" ? "30 jours" : "Tout"}
                </button>
              ))}
            </div>
          </div>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
              <p className="text-xs text-[#7C8494] mb-1">Tickets</p>
              <p className="text-2xl font-mono font-semibold text-[#E8E6DE]">{ticketsPeriode.length}</p>
            </div>
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
              <p className="text-xs text-[#7C8494] mb-1">Taux résolution</p>
              <p className="text-2xl font-mono font-semibold text-[#3DDC97]">{tauxResolution}%</p>
            </div>
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
              <p className="text-xs text-[#7C8494] mb-1">Satisfaction</p>
              <p className="text-2xl font-mono font-semibold text-[#F4C95D]">{satisfactionMoyenne != null ? `${satisfactionMoyenne.toFixed(1)}/5` : "—"}</p>
            </div>
          </div>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            <p className="text-sm font-medium text-[#E8E6DE] mb-1">Export des données</p>
            <p className="text-xs text-[#7C8494] mb-4">
              Télécharge un fichier CSV avec le détail des {ticketsPeriode.length} ticket{ticketsPeriode.length > 1 ? "s" : ""} de la période sélectionnée (ouvrable dans Excel).
            </p>
            <button
              onClick={exporterCsv}
              disabled={ticketsPeriode.length === 0}
              className="flex items-center gap-2 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              {Ic("download", "w-4 h-4")} Exporter en CSV
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
