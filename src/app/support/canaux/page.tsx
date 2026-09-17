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
function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "resolu") return { bg: "#0F2420", text: "#3DDC97" };
  if (statut === "en_cours") return { bg: "#1B1706", text: "#C9A227" };
  if (statut === "en_attente") return { bg: "#241B33", text: "#C9A6F0" };
  return { bg: "#12203A", text: "#5B8DEF" };
}
function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

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
  reports: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
  faq: "M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-1.5 1.3-1.5 2.7 M12 17h.01",
  star: "M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.3l7-.8Z",
  channel: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
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
  { href: "/support/rapports", label: "Rapports", icone: "reports" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const, actif: true },
  { href: "/support/notifications", label: "Notifications", icone: "bell" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

const LIBELLES_CANAL: Record<string, string> = { app: "Application", telephone: "Téléphone", whatsapp: "WhatsApp", email: "Email", chat: "Chat" };
const ICONES_CANAL: Record<string, string> = { app: "📱", telephone: "📞", whatsapp: "💬", email: "📧", chat: "🗨️" };

export default function PageCanauxAcces() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [filtreCanal, setFiltreCanal] = useState<string | null>(null);
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

  const canaux = ["app", "telephone", "whatsapp", "email", "chat"].map((c) => ({
    canal: c,
    libelle: LIBELLES_CANAL[c],
    icone: ICONES_CANAL[c],
    compte: tickets.filter((t) => (t.canal || "app") === c).length,
  }));

  const ticketsFiltres = filtreCanal ? tickets.filter((t) => (t.canal || "app") === filtreCanal) : tickets;

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

        <nav className="flex-1 space-y-1">
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
        <div className="max-w-3xl mx-auto">
          <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE] mb-1">Canaux d&apos;accès</h1>
          <p className="text-[#7C8494] text-sm mb-6">D&apos;où viennent vos tickets</p>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <button
              onClick={() => setFiltreCanal(null)}
              className={`bg-[#12151C] border rounded-lg p-4 text-center transition ${filtreCanal === null ? "border-[#C9A227]" : "border-[#232733] hover:border-[#3A4050]"}`}
            >
              <p className="text-xl mb-1">🌐</p>
              <p className="text-lg font-mono font-semibold text-[#E8E6DE]">{tickets.length}</p>
              <p className="text-[10px] text-[#7C8494]">Tous</p>
            </button>
            {canaux.map((c) => (
              <button
                key={c.canal}
                onClick={() => setFiltreCanal(c.canal)}
                className={`bg-[#12151C] border rounded-lg p-4 text-center transition ${filtreCanal === c.canal ? "border-[#C9A227]" : "border-[#232733] hover:border-[#3A4050]"}`}
              >
                <p className="text-xl mb-1">{c.icone}</p>
                <p className="text-lg font-mono font-semibold text-[#E8E6DE]">{c.compte}</p>
                <p className="text-[10px] text-[#7C8494]">{c.libelle}</p>
              </button>
            ))}
          </div>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">
              {filtreCanal ? `Tickets — ${LIBELLES_CANAL[filtreCanal]}` : "Tous les tickets"}
            </p>
            {ticketsFiltres.length === 0 ? (
              <p className="text-sm text-[#5A6070] py-8 text-center">Aucun ticket pour ce canal.</p>
            ) : (
              <div className="space-y-2">
                {ticketsFiltres.slice(0, 30).map((t) => {
                  const couleur = couleurStatut(t.statut);
                  return (
                    <button
                      key={t.id}
                      onClick={() => router.push(`/support/${t.id}`)}
                      className="w-full text-left border border-[#232733] rounded-md p-3 hover:border-[#3A4050] transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span>{ICONES_CANAL[t.canal || "app"]}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-[#E8E6DE] truncate">{t.sujet}</p>
                          <p className="text-xs text-[#7C8494] mt-0.5">{formaterDate(t.cree_le)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                        {LIBELLES_STATUT[t.statut] || t.statut}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
