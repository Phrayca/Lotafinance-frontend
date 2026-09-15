"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirTicketSupport,
  obtenirMessagesTicketSupport,
  repondreTicketSupport,
  changerStatutTicket,
  obtenirFicheClient,
  obtenirModelesReponse,
  obtenirAgentsSupport,
  assignerTicket,
  obtenirTicketsDuClientSupport,
  definirCanalTicket,
  TicketDetail,
  TicketMessage,
  StatutTicket,
  ClientDetail,
  ModeleReponse,
  AgentApercu,
  Ticket,
} from "@/lib/api";
import { HomeIcon, ProfileIcon, DocumentIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

type Utilisateur = { id: string; email: string; role: string; first_name?: string; last_name?: string };

const LIBELLES_STATUT: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  en_attente: "En attente",
  resolu: "Résolu",
};

function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "resolu") return { bg: "#0F2420", text: "#3DDC97" };
  if (statut === "en_cours") return { bg: "#1B1706", text: "#C9A227" };
  if (statut === "en_attente") return { bg: "#241B33", text: "#C9A6F0" };
  return { bg: "#12203A", text: "#5B8DEF" };
}

function formaterDateHeure(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  document: DocumentIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

export default function PageDetailTicketSupport() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [reponse, setReponse] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [changementStatutEnCours, setChangementStatutEnCours] = useState(false);
  const [ficheClient, setFicheClient] = useState<ClientDetail | null>(null);
  const [ficheClientOuverte, setFicheClientOuverte] = useState(false);
  const [modeles, setModeles] = useState<ModeleReponse[]>([]);
  const [modelesOuvert, setModelesOuvert] = useState(false);
  const [agents, setAgents] = useState<AgentApercu[]>([]);
  const [assignationEnCours, setAssignationEnCours] = useState(false);
  const [historiqueClient, setHistoriqueClient] = useState<Ticket[]>([]);
  const [canalEnCours, setCanalEnCours] = useState(false);

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
        await charger(token);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function charger(token: string) {
    const [t, m] = await Promise.all([obtenirTicketSupport(token, ticketId), obtenirMessagesTicketSupport(token, ticketId)]);
    setTicket(t);
    setMessages(m);
    obtenirFicheClient(token, t.client_id).then(setFicheClient).catch(() => {});
    obtenirModelesReponse(token).then(setModeles).catch(() => {});
    obtenirAgentsSupport(token).then(setAgents).catch(() => {});
    obtenirTicketsDuClientSupport(token, t.client_id)
      .then((liste) => setHistoriqueClient(liste.filter((x) => x.id !== ticketId)))
      .catch(() => {});
  }

  async function gererEnvoi(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !reponse.trim()) return;

    setEnvoiEnCours(true);
    try {
      await repondreTicketSupport(token, ticketId, reponse.trim());
      setReponse("");
      await charger(token);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererChangementStatut(nouveauStatut: StatutTicket) {
    const token = localStorage.getItem("token");
    if (!token) return;

    setChangementStatutEnCours(true);
    try {
      await changerStatutTicket(token, ticketId, nouveauStatut);
      await charger(token);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors du changement de statut");
    } finally {
      setChangementStatutEnCours(false);
    }
  }

  async function gererAssignation(agentId: string) {
    const token = localStorage.getItem("token");
    if (!token || !agentId) return;

    setAssignationEnCours(true);
    try {
      await assignerTicket(token, ticketId, agentId);
      await charger(token);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'assignation");
    } finally {
      setAssignationEnCours(false);
    }
  }

  async function gererChangementCanal(canal: string) {
    const token = localStorage.getItem("token");
    if (!token || !canal) return;

    setCanalEnCours(true);
    try {
      await definirCanalTicket(token, ticketId, canal);
      await charger(token);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors du changement de canal");
    } finally {
      setCanalEnCours(false);
    }
  }

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

  if (!ticket) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#F0A0A0]">{erreur || "Ticket introuvable"}</p>
      </main>
    );
  }

  const couleur = couleurStatut(ticket.statut);

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
              {!sidebarReduite && i === 4 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Outils</p>}
              <button
                onClick={() => router.push(lien.href)}
                title={sidebarReduite ? lien.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm transition ${sidebarReduite ? "justify-center px-0" : "px-3"} text-[#B8BAC4] hover:bg-[#12151C]`}
              >
                <IconCircle color={COULEURS_NAV[i % COULEURS_NAV.length]} size={28}>
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
          <button onClick={() => router.push("/support")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
            ← Retour aux tickets
          </button>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">{ticket.sujet}</h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                {LIBELLES_STATUT[ticket.statut] || ticket.statut}
              </span>
            </div>
            <p className="text-xs text-[#7C8494] mb-1">
              {ticket.client_first_name} {ticket.client_last_name} · {ticket.client_phone} · Ouvert le {formaterDateHeure(ticket.cree_le)}
            </p>
            {ticket.categorie && <p className="text-xs text-[#5A6070] mb-4">Catégorie : {ticket.categorie}</p>}
            <p className="text-sm text-[#B8BAC4] whitespace-pre-wrap border-t border-[#1B1F29] pt-4 mt-3">{ticket.description}</p>
          </div>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg mb-4 overflow-hidden">
            <button
              onClick={() => setFicheClientOuverte((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#171B24] transition"
            >
              <span className="text-sm font-medium text-[#E8E6DE]">Fiche client</span>
              <span className="text-[#7C8494] text-xs">{ficheClientOuverte ? "▲ Réduire" : "▼ Voir les détails"}</span>
            </button>
            {ficheClientOuverte && (
              <div className="px-6 pb-6 border-t border-[#1B1F29] pt-4">
                {!ficheClient ? (
                  <p className="text-xs text-[#5A6070]">Chargement de la fiche...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoClient label="Nom complet" valeur={`${ficheClient.first_name} ${ficheClient.last_name}`} />
                    <InfoClient label="Email" valeur={ficheClient.email} />
                    <InfoClient label="Téléphone" valeur={ficheClient.phone} />
                    <InfoClient label="Adresse" valeur={ficheClient.address || "—"} />
                    <InfoClient label="Profession" valeur={ficheClient.profession || "—"} />
                    <InfoClient label="Employeur" valeur={ficheClient.employer || "—"} />
                    <InfoClient label="Client depuis" valeur={formaterDateHeure(ficheClient.created_at)} />
                    <InfoClient
                      label="Identité"
                      valeur={ficheClient.identity_verified ? "✅ Vérifiée" : ficheClient.identity_rejected ? "⚠️ Rejetée" : "En attente"}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Actions</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => gererChangementStatut("en_cours")}
                disabled={changementStatutEnCours || ticket.statut === "en_cours"}
                className="text-xs font-medium bg-[#1B1706] border border-[#3A3013] text-[#C9A227] px-3 py-1.5 rounded-md hover:bg-[#241E09] transition disabled:opacity-40"
              >
                Prendre en charge
              </button>
              <button
                onClick={() => gererChangementStatut("en_attente")}
                disabled={changementStatutEnCours || ticket.statut === "en_attente"}
                className="text-xs font-medium bg-[#241B33] border border-[#3A2A4D] text-[#C9A6F0] px-3 py-1.5 rounded-md hover:bg-[#2E2340] transition disabled:opacity-40"
              >
                Mettre en attente
              </button>
              <button
                onClick={() => gererChangementStatut("resolu")}
                disabled={changementStatutEnCours || ticket.statut === "resolu"}
                className="text-xs font-medium bg-[#0F2420] border border-[#1E4A3D] text-[#3DDC97] px-3 py-1.5 rounded-md hover:bg-[#153530] transition disabled:opacity-40"
              >
                Marquer résolu
              </button>
              {ticket.statut === "resolu" && (
                <button
                  onClick={() => gererChangementStatut("en_cours")}
                  disabled={changementStatutEnCours}
                  className="text-xs font-medium bg-[#0B0E14] border border-[#232733] text-[#7C8494] px-3 py-1.5 rounded-md hover:text-[#E8E6DE] transition disabled:opacity-40"
                >
                  Rouvrir
                </button>
              )}
            </div>

            <div className="border-t border-[#1B1F29] mt-4 pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1.5">Assigné à</label>
                <select
                  value={ticket.agent_id || ""}
                  disabled={assignationEnCours}
                  onChange={(e) => gererAssignation(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] focus:outline-none focus:border-[#C9A227] transition disabled:opacity-50"
                >
                  <option value="">— Non assigné —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name || a.last_name ? `${a.first_name || ""} ${a.last_name || ""}`.trim() : a.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1.5">Canal</label>
                <select
                  value={ticket.canal || "app"}
                  disabled={canalEnCours}
                  onChange={(e) => gererChangementCanal(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] focus:outline-none focus:border-[#C9A227] transition disabled:opacity-50"
                >
                  <option value="app">📱 Application</option>
                  <option value="telephone">📞 Téléphone</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="email">📧 Email</option>
                  <option value="chat">🗨️ Chat</option>
                </select>
              </div>
            </div>

            {ticket.satisfaction_note && (
              <div className="border-t border-[#1B1F29] mt-4 pt-4">
                <p className="text-xs font-medium text-[#B8BAC4] mb-1">Satisfaction client</p>
                <p className="text-lg">{"⭐".repeat(ticket.satisfaction_note)}{"☆".repeat(5 - ticket.satisfaction_note)}</p>
                {ticket.satisfaction_commentaire && (
                  <p className="text-xs text-[#7C8494] italic mt-1">« {ticket.satisfaction_commentaire} »</p>
                )}
              </div>
            )}
          </div>

          {historiqueClient.length > 0 && (
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
              <h2 className="text-sm font-medium text-[#E8E6DE] mb-1">Historique de ce client</h2>
              <p className="text-xs text-[#7C8494] mb-3">
                {historiqueClient.length} autre{historiqueClient.length > 1 ? "s" : ""} ticket{historiqueClient.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {historiqueClient.map((t) => {
                  const c = couleurStatut(t.statut);
                  return (
                    <button
                      key={t.id}
                      onClick={() => router.push(`/support/${t.id}`)}
                      className="w-full text-left border border-[#232733] rounded-md p-3 hover:border-[#3A4050] transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-[#E8E6DE] truncate">{t.sujet}</p>
                        <p className="text-xs text-[#7C8494] mt-0.5">{formaterDateHeure(t.cree_le)}</p>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: c.bg, color: c.text }}>
                        {LIBELLES_STATUT[t.statut] || t.statut}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Échanges</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-[#5A6070] py-4 text-center">Aucun échange pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.auteur === "agent" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                        m.auteur === "agent" ? "bg-[#1B1706] text-[#E8E6DE]" : "bg-[#0B0E14] border border-[#232733] text-[#B8BAC4]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.contenu}</p>
                      <p className="text-[10px] text-[#5A6070] mt-1">
                        {m.auteur === "agent" ? "Toi" : `${ticket.client_first_name}`} · {formaterDateHeure(m.envoye_le)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {modeles.length > 0 && (
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => setModelesOuvert((v) => !v)}
                className="text-xs font-medium text-[#C9A227] border border-[#3A3013] bg-[#1B1706] rounded-md px-3 py-1.5 hover:bg-[#241E09] transition"
              >
                📋 Utiliser un modèle de réponse
              </button>
              {modelesOuvert && (
                <div className="absolute left-0 bottom-9 w-80 max-h-64 overflow-y-auto bg-[#12151C] border border-[#232733] rounded-md shadow-xl z-10">
                  {modeles.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setReponse(m.contenu);
                        setModelesOuvert(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#171B24] transition border-b border-[#1B1F29] last:border-0"
                    >
                      <p className="text-xs font-medium text-[#E8E6DE]">{m.titre}</p>
                      <p className="text-[11px] text-[#7C8494] truncate mt-0.5">{m.contenu}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={gererEnvoi} className="flex gap-2">
            <input
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Répondre au client..."
              className="flex-1 bg-[#12151C] border border-[#232733] rounded-md px-3 py-2.5 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
            />
            <button
              type="submit"
              disabled={envoiEnCours || !reponse.trim()}
              className="bg-[#C9A227] text-[#0B0E14] text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function InfoClient({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-[#7C8494] text-xs">{label}</p>
      <p className="text-[#E8E6DE] font-medium">{valeur}</p>
    </div>
  );
}
