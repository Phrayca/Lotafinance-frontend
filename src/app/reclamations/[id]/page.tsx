"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { obtenirMonTicket, obtenirMessagesDeMonTicket, repondreAMonTicket, noterSatisfactionTicket, TicketDetail, TicketMessage } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
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
  if (statut === "resolu") return { bg: "rgba(63,168,115,0.12)", text: "#3fa873" };
  if (statut === "en_cours") return { bg: "rgba(201,154,75,0.15)", text: "#c99a4b" };
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
        <p className="text-sm text-[#8e99a8] font-mono">Chargement...</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#c0563b]">{erreur || "Réclamation introuvable"}</p>
      </main>
    );
  }

  const couleur = couleurStatut(ticket.statut);

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10 pb-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/reclamations")} className="text-sm text-[#8e99a8] hover:text-[#eef1f4] mb-4 transition">
          ← Retour à mes réclamations
        </button>

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4]">{ticket.sujet}</h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
              {LIBELLES_STATUT[ticket.statut] || ticket.statut}
            </span>
          </div>
          <p className="text-xs text-[#8e99a8] mb-4">Ouverte le {formaterDateHeure(ticket.cree_le)}</p>
          <p className="text-sm text-[#8e99a8] whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {erreur && (
          <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4">
          <h2 className="text-sm font-medium text-[#eef1f4] mb-3">Échanges</h2>
          {messages.length === 0 ? (
            <p className="text-sm text-[#66707d] py-4 text-center">Aucun échange pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.auteur === "client" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                      m.auteur === "client" ? "bg-[rgba(201,154,75,0.15)] text-[#eef1f4]" : "bg-[#10151c] border border-[rgba(255,255,255,0.08)] text-[#8e99a8]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.contenu}</p>
                    <p className="text-[10px] text-[#66707d] mt-1">{m.auteur === "client" ? "Toi" : "Service client"} · {formaterDateHeure(m.envoye_le)}</p>
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
              className="flex-1 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition"
            />
            <button
              type="submit"
              disabled={envoiEnCours || !reponse.trim()}
              className="bg-[#c99a4b] text-[#10151c] text-sm font-semibold px-4 py-2.5 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        ) : ticket.satisfaction_note ? (
          <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 text-center">
            <p className="text-sm text-[#3fa873] font-medium">Merci pour ton avis !</p>
            <p className="text-2xl mt-1">{"⭐".repeat(ticket.satisfaction_note)}{"☆".repeat(5 - ticket.satisfaction_note)}</p>
          </div>
        ) : (
          <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
            <p className="text-sm font-medium text-[#eef1f4] mb-1">Cette réclamation est résolue</p>
            <p className="text-xs text-[#8e99a8] mb-4">Comment évalues-tu la façon dont ça a été traité ?</p>
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
              className="w-full bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition mb-3"
            />
            <button
              onClick={gererEnvoiSatisfaction}
              disabled={noteChoisie < 1 || envoiNoteEnCours}
              className="w-full bg-[#c99a4b] text-[#10151c] text-sm font-semibold py-2.5 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50"
            >
              {envoiNoteEnCours ? "Envoi..." : "Envoyer mon avis"}
            </button>
            <p className="text-xs text-[#66707d] text-center mt-3">Ouvre une nouvelle réclamation si le problème persiste.</p>
          </div>
        )}
      </div>
    </main>
  );
}
