"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recupererMonProfilUtilisateur, obtenirTousLesTicketsSupport, obtenirFaqSupport, TicketDetail, FaqItem } from "@/lib/api";
import { HomeIcon, ProfileIcon, DocumentIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

type Utilisateur = { id: string; email: string; role: string; first_name?: string; last_name?: string };

const FILTRES = [
  { valeur: "tous", label: "Tous" },
  { valeur: "nouveau", label: "Nouveaux" },
  { valeur: "en_cours", label: "En cours" },
  { valeur: "en_attente", label: "En attente" },
  { valeur: "resolu", label: "Résolus" },
];

const LIBELLES_STATUT: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  en_attente: "En attente",
  resolu: "Résolu",
};

const LIBELLES_PRIORITE: Record<string, string> = { basse: "Basse", moyenne: "Moyenne", haute: "Haute" };
function couleurPriorite(priorite: string): { bg: string; text: string } {
  if (priorite === "haute") return { bg: "rgba(192,86,59,0.12)", text: "#c0563b" };
  if (priorite === "basse") return { bg: "rgba(63,168,115,0.12)", text: "#3fa873" };
  return { bg: "#2A2312", text: "#c99a4b" };
}

function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "resolu") return { bg: "rgba(63,168,115,0.12)", text: "#3fa873" };
  if (statut === "en_cours") return { bg: "rgba(201,154,75,0.15)", text: "#c99a4b" };
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
  faq: "M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-1.5 1.3-1.5 2.7 M12 17h.01",
  star: "M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.3l7-.8Z",
  channel: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  reports: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 5l7 7-7 7",
  chevronLeft: "M15 5l-7 7 7 7",
  headset: "M4 13v-1a8 8 0 0 1 16 0v1 M4 13v4a2 2 0 0 0 2 2h1v-7H5a1 1 0 0 0-1 1Z M20 13v4a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  document: DocumentIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "gold", "blue", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const, actif: true },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/rapports", label: "Rapports", icone: "reports" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/notifications", label: "Notifications", icone: "bell" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

export default function PageServiceClient() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [filtre, setFiltre] = useState("tous");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [notifOuvertes, setNotifOuvertes] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);

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
        setUtilisateur(profil);
        obtenirFaqSupport(token).then(setFaqItems).catch(() => {});
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !utilisateur) return;
    obtenirTousLesTicketsSupport(token, filtre)
      .then(setTickets)
      .catch((err) => setErreur(err instanceof Error ? err.message : "Une erreur est survenue"));
  }, [filtre, utilisateur]);

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
    if (recherche.trim()) router.push(`/support/recherche?q=${encodeURIComponent(recherche.trim())}`);
  }

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#8e99a8] font-mono">Chargement...</p>
      </main>
    );
  }

  const compteurs = {
    nouveau: tickets.filter((t) => t.statut === "nouveau").length,
    en_cours: tickets.filter((t) => t.statut === "en_cours").length,
    en_attente: tickets.filter((t) => t.statut === "en_attente").length,
    resolu: tickets.filter((t) => t.statut === "resolu").length,
  };

  const ticketsNotes = tickets.filter((t) => t.satisfaction_note != null);
  const satisfactionMoyenne = ticketsNotes.length > 0 ? ticketsNotes.reduce((s, t) => s + (t.satisfaction_note || 0), 0) / ticketsNotes.length : null;

  const resolus = tickets.filter((t) => t.resolu_le);
  const dureesEnHeures = resolus.map((t) => (new Date(t.resolu_le!).getTime() - new Date(t.cree_le).getTime()) / (1000 * 60 * 60));
  const dureeMoyenneHeures = dureesEnHeures.length > 0 ? dureesEnHeures.reduce((s, d) => s + d, 0) / dureesEnHeures.length : null;
  const libelleDureeMoyenne =
    dureeMoyenneHeures == null ? "—" : dureeMoyenneHeures < 24 ? `${dureeMoyenneHeures.toFixed(1)} h` : `${(dureeMoyenneHeures / 24).toFixed(1)} j`;

  const activiteRecente = [...tickets].sort((a, b) => b.mis_a_jour_le.localeCompare(a.mis_a_jour_le)).slice(0, 6);

  const donutCounts = [
    { label: "Nouveaux", value: compteurs.nouveau, color: "#5B8DEF" },
    { label: "En cours", value: compteurs.en_cours, color: "#c99a4b" },
    { label: "En attente", value: compteurs.en_attente, color: "#C9A6F0" },
    { label: "Résolus", value: compteurs.resolu, color: "#3fa873" },
  ].filter((c) => c.value > 0);

  const LIBELLES_CANAL: Record<string, string> = { app: "Application", telephone: "Téléphone", whatsapp: "WhatsApp", email: "Email", chat: "Chat" };
  const ICONES_CANAL: Record<string, string> = { app: "📱", telephone: "📞", whatsapp: "💬", email: "📧", chat: "🗨️" };
  const canaux = ["telephone", "whatsapp", "email", "chat"].map((c) => ({
    canal: c,
    libelle: LIBELLES_CANAL[c],
    icone: ICONES_CANAL[c],
    compte: tickets.filter((t) => (t.canal || "app") === c).length,
  })).filter((c) => c.compte > 0);

  // Tickets où le client attend une réponse : nouveaux sans réponse, ou dernier message venant du client
  const prefNouveaux = typeof window !== "undefined" ? localStorage.getItem("notif_nouveaux_tickets") !== "0" : true;
  const prefReponses = typeof window !== "undefined" ? localStorage.getItem("notif_reponses_client") !== "0" : true;

  const ticketsNecessitantReponse = tickets.filter((t) => {
    if (t.statut === "resolu") return false;
    if (!t.dernier_message_client_le && !t.dernier_message_agent_le) return t.statut === "nouveau" && prefNouveaux;
    if (!t.dernier_message_client_le) return false;
    if (!t.dernier_message_agent_le) return prefReponses;
    return t.dernier_message_client_le > t.dernier_message_agent_le && prefReponses;
  });

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex">
      <aside className={`${sidebarReduite ? "w-16" : "w-60"} shrink-0 border-r border-[rgba(255,255,255,0.08)] flex flex-col py-6 px-3 transition-all duration-200`}>
        <div className={`flex items-center gap-2 mb-8 ${sidebarReduite ? "justify-center px-0" : "px-2"}`}>
          <span className="w-9 h-9 rounded-lg bg-[#c99a4b] flex items-center justify-center text-[#10151c] font-bold font-['Sora',sans-serif] shrink-0">L</span>
          {!sidebarReduite && (
            <div>
              <p className="text-sm font-semibold text-[#eef1f4] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#8e99a8]">Service Client</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {LIENS_NAV.map((lien, i) => (
            <div key={lien.href}>
              {!sidebarReduite && i === 0 && <p className="text-[10px] text-[#66707d] uppercase tracking-wide px-3 mb-1">Gestion</p>}
              {!sidebarReduite && i === 2 && <p className="text-[10px] text-[#66707d] uppercase tracking-wide px-3 mb-1 mt-3">Rapports</p>}
              {!sidebarReduite && i === 5 && <p className="text-[10px] text-[#66707d] uppercase tracking-wide px-3 mb-1 mt-3">Outils</p>}
              <button
                onClick={() => router.push(lien.href)}
                title={sidebarReduite ? lien.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm transition ${sidebarReduite ? "justify-center px-0" : "px-3"} ${
                  lien.actif ? "bg-[#c99a4b] text-[#10151c] font-medium" : "text-[#8e99a8] hover:bg-[#1a212b]"
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
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs text-[#8e99a8] hover:bg-[#1a212b] hover:text-[#eef1f4] transition"
        >
          {Ic(sidebarReduite ? "chevronRight" : "chevronLeft", "w-4 h-4")}
          {!sidebarReduite && "Réduire"}
        </button>

        <button
          onClick={seDeconnecter}
          title={sidebarReduite ? "Déconnexion" : undefined}
          className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm text-[#8e99a8] hover:bg-[#1a212b] transition ${sidebarReduite ? "justify-center px-0" : "px-3"}`}
        >
          {Ic("logout")}
          {!sidebarReduite && "Déconnexion"}
        </button>
      </aside>

      <div className="flex-1 px-4 sm:px-8 py-6 overflow-x-auto">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={gererRecherche} className="relative mb-5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66707d]">{Ic("search", "w-4 h-4")}</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un client, ticket, téléphone..."
              className="w-full bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-md pl-9 pr-3 py-2.5 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition"
            />
          </form>

          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <h1 className="font-['Sora',sans-serif] text-2xl text-[#eef1f4]">Bonjour {utilisateur?.first_name || ""} 👋</h1>
              <p className="text-[#8e99a8] text-sm mt-1">Voici les réclamations à traiter.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.push("/support/faq")}
              title="Base de connaissances"
              className="text-[#8e99a8] hover:text-[#eef1f4] transition p-2"
            >
              {Ic("headset", "w-5 h-5")}
            </button>
            <div className="relative">
              <button onClick={() => setNotifOuvertes((v) => !v)} className="relative text-[#8e99a8] hover:text-[#eef1f4] transition p-2" title="Notifications">
                {Ic("bell", "w-5 h-5")}
                {ticketsNecessitantReponse.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C24545] text-white text-[9px] flex items-center justify-center">
                    {ticketsNecessitantReponse.length}
                  </span>
                )}
              </button>
              {notifOuvertes && (
                <div className="absolute right-0 top-10 w-80 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-md shadow-xl z-20 overflow-hidden">
                  <p className="text-xs font-medium text-[#8e99a8] uppercase tracking-wide px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
                    Tickets en attente d&apos;une réponse
                  </p>
                  <div className="max-h-80 overflow-y-auto">
                    {ticketsNecessitantReponse.length === 0 ? (
                      <p className="text-xs text-[#66707d] text-center py-6">Aucune notification pour le moment</p>
                    ) : (
                      ticketsNecessitantReponse.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setNotifOuvertes(false); router.push(`/support/${t.id}`); }}
                          className="w-full text-left px-4 py-3 hover:bg-[#212a35] transition border-b border-[rgba(255,255,255,0.08)] last:border-0"
                        >
                          <p className="text-xs text-[#c99a4b] font-medium">{t.statut === "nouveau" ? "Nouveau ticket" : "Réponse du client en attente"}</p>
                          <p className="text-xs text-[#8e99a8] truncate mt-0.5">{t.sujet}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setMenuOuvert((v) => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition">
                <span className="w-7 h-7 rounded-full bg-[#212a35] border border-[rgba(255,255,255,0.08)] text-[#c99a4b] flex items-center justify-center overflow-hidden shrink-0">
                  {Ic("user", "w-3.5 h-3.5")}
                </span>
                <span className="text-xs text-[#8e99a8]">{utilisateur?.first_name || utilisateur?.email?.split("@")[0]}</span>
                {Ic("chevronDown", "w-3 h-3 text-[#8e99a8]")}
              </button>
              {menuOuvert && (
                <div className="absolute right-0 top-10 w-44 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-md shadow-xl z-10 overflow-hidden">
                  <button onClick={() => router.push("/support/profil")} className="w-full text-left px-3 py-2 text-sm text-[#8e99a8] hover:bg-[#212a35] transition">
                    Mon profil
                  </button>
                  <button onClick={seDeconnecter} className="w-full text-left px-3 py-2 text-sm text-[#c0563b] hover:bg-[#212a35] transition">
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>

          {erreur && (
            <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <CarteKpi label="Nouveaux" valeur={compteurs.nouveau} couleur="#5B8DEF" />
            <CarteKpi label="En cours" valeur={compteurs.en_cours} couleur="#c99a4b" />
            <CarteKpi label="En attente" valeur={compteurs.en_attente} couleur="#C9A6F0" />
            <CarteKpi label="Résolus" valeur={compteurs.resolu} couleur="#3fa873" />
            <CarteKpi label="Satisfaction" valeur={satisfactionMoyenne != null ? `${satisfactionMoyenne.toFixed(1)}/5` : "—"} couleur="#F4C95D" texte />
            <CarteKpi label="Temps moyen" valeur={libelleDureeMoyenne} couleur="#7DBEF0" texte />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
              <div className="flex gap-2 mb-5 flex-wrap">
                {FILTRES.map((f) => (
                  <button
                    key={f.valeur}
                    onClick={() => setFiltre(f.valeur)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                      filtre === f.valeur ? "bg-[#c99a4b] text-[#10151c]" : "bg-[#10151c] border border-[rgba(255,255,255,0.08)] text-[#8e99a8] hover:text-[#eef1f4]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {tickets.length === 0 ? (
                <p className="text-sm text-[#66707d] py-8 text-center">Aucun ticket pour ce filtre.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[560px]">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-[#8e99a8] border-b border-[rgba(255,255,255,0.08)]">
                        <th className="pb-2 font-medium pr-3">ID</th>
                        <th className="pb-2 font-medium pr-3">Client</th>
                        <th className="pb-2 font-medium pr-3">Sujet</th>
                        <th className="pb-2 font-medium pr-3">Priorité</th>
                        <th className="pb-2 font-medium pr-3">Agent</th>
                        <th className="pb-2 font-medium pr-3">Statut</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => {
                        const couleur = couleurStatut(t.statut);
                        const couleurPrio = couleurPriorite(t.priorite);
                        return (
                          <tr
                            key={t.id}
                            onClick={() => router.push(`/support/${t.id}`)}
                            className="border-b border-[rgba(255,255,255,0.08)] last:border-0 cursor-pointer hover:bg-[#212a35] transition"
                          >
                            <td className="py-3 pr-3 text-[#66707d] font-mono text-xs whitespace-nowrap">#{t.id.slice(0, 6)}</td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-7 h-7 rounded-full bg-[#212a35] border border-[rgba(255,255,255,0.08)] text-[#c99a4b] text-[10px] font-semibold flex items-center justify-center shrink-0">
                                  {t.client_first_name[0]}{t.client_last_name[0]}
                                </span>
                                <span className="text-[#eef1f4] truncate">{t.client_first_name} {t.client_last_name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-[#8e99a8] truncate max-w-[160px]">{t.sujet}</td>
                            <td className="py-3 pr-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: couleurPrio.bg, color: couleurPrio.text }}>
                                {LIBELLES_PRIORITE[t.priorite] || t.priorite}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-[#8e99a8] text-xs whitespace-nowrap">{t.agent_email ? t.agent_email.split("@")[0] : "—"}</td>
                            <td className="py-3 pr-3">
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                                {LIBELLES_STATUT[t.statut] || t.statut}
                              </span>
                            </td>
                            <td className="py-3 text-[#66707d] text-xs whitespace-nowrap">{formaterDate(t.cree_le)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-4">Tickets par statut</p>
                {donutCounts.length > 0 ? (
                  <DonutMini counts={donutCounts} />
                ) : (
                  <p className="text-xs text-[#66707d] text-center py-4">Aucun ticket</p>
                )}
              </div>

              {canaux.length > 0 && (
                <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                  <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-3">Canaux d&apos;accès</p>
                  <div className="grid grid-cols-2 gap-2">
                    {canaux.map((c) => (
                      <button
                        key={c.canal}
                        onClick={() => router.push("/support/canaux")}
                        className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-2.5 text-center hover:border-[rgba(255,255,255,0.16)] transition"
                      >
                        <p className="text-base">{c.icone}</p>
                        <p className="text-sm font-mono font-semibold text-[#eef1f4]">{c.compte}</p>
                        <p className="text-[9px] text-[#8e99a8]">{c.libelle}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-3">Accès rapides</p>
                <div className="space-y-1">
                  <AccesRapideItem label="Nouvelle demande" onClick={() => router.push("/support/nouveau-ticket")} />
                  <AccesRapideItem label="Rechercher un client" onClick={() => router.push("/support/clients")} />
                  <AccesRapideItem label="Modèles de réponses" onClick={() => router.push("/support/modeles")} />
                  <AccesRapideItem label="Base de connaissances" onClick={() => router.push("/support/faq")} />
                </div>
              </div>

              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-3">Activité récente</p>
                {activiteRecente.length === 0 ? (
                  <p className="text-xs text-[#66707d] text-center py-4">Aucune activité pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {activiteRecente.map((t) => (
                      <button key={t.id} onClick={() => router.push(`/support/${t.id}`)} className="w-full text-left flex items-start gap-2 hover:opacity-80 transition">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c99a4b] mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-[#8e99a8] truncate">
                            {t.statut === "resolu" ? "Résolu : " : t.statut === "nouveau" ? "Nouveau : " : "Mis à jour : "}{t.sujet}
                          </p>
                          <p className="text-[10px] text-[#66707d]">{formaterDate(t.mis_a_jour_le)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {faqItems.filter((f) => f.publiee).length > 0 && (
                <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-[#8e99a8] uppercase tracking-wide">FAQ populaires</p>
                    <button onClick={() => router.push("/support/faq")} className="text-[10px] text-[#c99a4b] hover:text-[#e4b565] transition">Voir tout</button>
                  </div>
                  <div className="space-y-2">
                    {[...faqItems].filter((f) => f.publiee).sort((a, b) => b.vues - a.vues).slice(0, 5).map((f) => (
                      <button key={f.id} onClick={() => router.push("/support/faq")} className="w-full flex items-center justify-between gap-2 text-left hover:opacity-80 transition">
                        <span className="text-xs text-[#8e99a8] truncate">{f.question}</span>
                        <span className="text-[10px] text-[#66707d] shrink-0">{f.vues} vues</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CarteKpi({ label, valeur, couleur, texte }: { label: string; valeur: number | string; couleur: string; texte?: boolean }) {
  return (
    <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-4">
      <p className="text-xs text-[#8e99a8] mb-1">{label}</p>
      <p className="text-2xl font-mono font-semibold" style={{ color: couleur }}>{valeur}</p>
    </div>
  );
}

function AccesRapideItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-[#212a35] transition text-left">
      <span className="text-sm text-[#8e99a8]">{label}</span>
      <span className="text-[#66707d]">›</span>
    </button>
  );
}

function DonutMini({ counts }: { counts: { label: string; value: number; color: string }[] }) {
  const total = counts.reduce((s, c) => s + c.value, 0);
  const rayon = 40;
  const circonference = 2 * Math.PI * rayon;
  let cumule = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={rayon} fill="none" stroke="#212a35" strokeWidth="12" />
          {total > 0 &&
            counts.map((c) => {
              const frac = c.value / total;
              const dash = frac * circonference;
              const el = (
                <circle
                  key={c.label}
                  cx="50" cy="50" r={rayon} fill="none" stroke={c.color} strokeWidth="12"
                  strokeDasharray={`${dash} ${circonference - dash}`}
                  strokeDashoffset={-cumule}
                />
              );
              cumule += dash;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-mono font-semibold text-[#eef1f4]">{total}</span>
          <span className="text-[9px] text-[#8e99a8]">Total</span>
        </div>
      </div>
      <div className="w-full space-y-1">
        {counts.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-[#8e99a8] flex-1">{c.label}</span>
            <span className="text-[#8e99a8] font-mono">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
