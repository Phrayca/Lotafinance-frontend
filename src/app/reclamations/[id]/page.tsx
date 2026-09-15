"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { obtenirMonTicket, obtenirMessagesDeMonTicket, repondreAMonTicket, noterSatisfactionTicket, TicketDetail, TicketMessage } from "@/lib/api";

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

export default function PageDetailReclamation() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [reponse, setReponse] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [noteChoisie, setNoteChoisie] = useState(0);
  const [commentaireSatisfaction, setCommentaireSatisfaction] = useState("");
  const [envoiNoteEnCours, setEnvoiNoteEnCours] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    charger(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function charger(token: string) {
    try {
      const [t, m] = await Promise.all([obtenirMonTicket(token, ticketId), obtenirMessagesDeMonTicket(token, ticketId)]);
      setTicket(t);
      setMessages(m);
      localStorage.setItem(`ticket_vu_${ticketId}`, new Date().toISOString());
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  async function gererEnvoi(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !reponse.trim()) return;

    setEnvoiEnCours(true);
    try {
      await repondreAMonTicket(token, ticketId, reponse.trim());
      setReponse("");
      const m = await obtenirMessagesDeMonTicket(token, ticketId);
      setMessages(m);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererEnvoiSatisfaction() {
    const token = localStorage.getItem("token");
    if (!token || noteChoisie < 1) return;

    setEnvoiNoteEnCours(true);
    try {
      const misAJour = await noterSatisfactionTicket(token, ticketId, noteChoisie, commentaireSatisfaction.trim() || undefined);
      setTicket((precedent) => (precedent ? { ...precedent, satisfaction_note: misAJour.satisfaction_note, satisfaction_commentaire: misAJour.satisfaction_commentaire } : precedent));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'envoi de votre avis");
    } finally {
      setEnvoiNoteEnCours(false);
    }
  }

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#F0A0A0]">{erreur || "Réclamation introuvable"}</p>
      </main>
    );
  }

  const couleur = couleurStatut(ticket.statut);

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10 pb-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/reclamations")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour à mes réclamations
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">{ticket.sujet}</h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
              {LIBELLES_STATUT[ticket.statut] || ticket.statut}
            </span>
          </div>
          <p className="text-xs text-[#7C8494] mb-4">Ouverte le {formaterDateHeure(ticket.cree_le)}</p>
          <p className="text-sm text-[#B8BAC4] whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {erreur && (
          <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
          <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Échanges</h2>
          {messages.length === 0 ? (
            <p className="text-sm text-[#5A6070] py-4 text-center">Aucun échange pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.auteur === "client" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                      m.auteur === "client" ? "bg-[#1B1706] text-[#E8E6DE]" : "bg-[#0B0E14] border border-[#232733] text-[#B8BAC4]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.contenu}</p>
                    <p className="text-[10px] text-[#5A6070] mt-1">{m.auteur === "client" ? "Toi" : "Service client"} · {formaterDateHeure(m.envoye_le)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {ticket.statut !== "resolu" ? (
          <form onSubmit={gererEnvoi} className="flex gap-2">
            <input
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Écris un message..."
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
        ) : ticket.satisfaction_note ? (
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 text-center">
            <p className="text-sm text-[#3DDC97] font-medium">Merci pour ton avis !</p>
            <p className="text-2xl mt-1">{"⭐".repeat(ticket.satisfaction_note)}{"☆".repeat(5 - ticket.satisfaction_note)}</p>
          </div>
        ) : (
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            <p className="text-sm font-medium text-[#E8E6DE] mb-1">Cette réclamation est résolue</p>
            <p className="text-xs text-[#7C8494] mb-4">Comment évalues-tu la façon dont ça a été traité ?</p>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setNoteChoisie(n)} className="text-2xl transition hover:scale-110">
                  {n <= noteChoisie ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <textarea
              value={commentaireSatisfaction}
              onChange={(e) => setCommentaireSatisfaction(e.target.value)}
              placeholder="Un commentaire (optionnel)..."
              rows={2}
              className="w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition mb-3"
            />
            <button
              onClick={gererEnvoiSatisfaction}
              disabled={noteChoisie < 1 || envoiNoteEnCours}
              className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              {envoiNoteEnCours ? "Envoi..." : "Envoyer mon avis"}
            </button>
            <p className="text-xs text-[#5A6070] text-center mt-3">Ouvre une nouvelle réclamation si le problème persiste.</p>
          </div>
        )}
      </div>
    </main>
  );
}
