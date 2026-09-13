"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirTicketSupport,
  obtenirMessagesTicketSupport,
  repondreTicketSupport,
  changerStatutTicket,
  TicketDetail,
  TicketMessage,
  StatutTicket,
} from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

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

export default function PageDetailTicketSupport() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [autorise, setAutorise] = useState(false);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [reponse, setReponse] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [changementStatutEnCours, setChangementStatutEnCours] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function charger(token: string) {
    const [t, m] = await Promise.all([obtenirTicketSupport(token, ticketId), obtenirMessagesTicketSupport(token, ticketId)]);
    setTicket(t);
    setMessages(m);
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
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 sm:px-8 py-6">
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
        </div>

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
    </main>
  );
}
