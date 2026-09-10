"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { obtenirMessagesDunClient, repondreAUnClient, telechargerFichierChat, MessageAssistance } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

function formaterHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function clefJour(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function libelleSeparateurJour(iso: string) {
  const date = new Date(iso);
  const aujourdhui = new Date();
  const hier = new Date();
  hier.setDate(aujourdhui.getDate() - 1);

  if (clefJour(iso) === clefJour(aujourdhui.toISOString())) return "Aujourd'hui";
  if (clefJour(iso) === clefJour(hier.toISOString())) return "Hier";

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PageConversationAnalyste() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const [messages, setMessages] = useState<MessageAssistance[]>([]);
  const [saisie, setSaisie] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const finDesMessages = useRef<HTMLDivElement>(null);
  const inputFichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    obtenirMessagesDunClient(token, clientId)
      .then(setMessages)
      .catch((err) => setErreur(err instanceof Error ? err.message : "Une erreur est survenue"))
      .finally(() => setChargement(false));
  }, [router, clientId]);

  useEffect(() => {
    finDesMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function gererEnvoi(e: React.FormEvent) {
    e.preventDefault();
    if (!saisie.trim() && !fichier) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setEnvoi(true);
    setErreur("");
    try {
      const nouveauMessage = await repondreAUnClient(token, clientId, saisie.trim(), fichier || undefined);
      setMessages((precedent) => [...precedent, nouveauMessage]);
      setSaisie("");
      setFichier(null);
      if (inputFichier.current) inputFichier.current.value = "";
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setEnvoi(false);
    }
  }

  async function gererTelechargement(m: MessageAssistance) {
    const token = localStorage.getItem("token");
    if (!token || !m.fichier_nom) return;
    try {
      await telechargerFichierChat(token, m.id, m.fichier_nom);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur de téléchargement");
    }
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/analyste/messages")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour aux messages
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg flex flex-col h-[70vh]">
          <div className="px-5 py-4 border-b border-[#232733]">
            <h1 className="font-['Source_Serif_4',serif] text-lg text-[#E8E6DE]">Conversation</h1>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {chargement ? (
              <p className="text-sm text-[#7C8494] font-mono text-center">Chargement...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[#5A6070] text-center py-8">Aucun message.</p>
            ) : (
              messages.map((m, index) => {
                const messagePrecedent = messages[index - 1];
                const nouveauJour = !messagePrecedent || clefJour(m.envoye_le) !== clefJour(messagePrecedent.envoye_le);

                return (
                  <div key={m.id}>
                    {nouveauJour && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-[#7C8494] bg-[#0B0E14] border border-[#232733] rounded-full px-3 py-1">
                          {libelleSeparateurJour(m.envoye_le)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${m.auteur === "support" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          m.auteur === "support" ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#1B2030] text-[#E8E6DE] border border-[#232733]"
                        }`}
                      >
                        {m.contenu && <p>{m.contenu}</p>}
                        {m.fichier_nom && (
                          <button
                            onClick={() => gererTelechargement(m)}
                            className={`flex items-center gap-1.5 text-xs mt-1 underline ${m.auteur === "support" ? "text-[#5A4A0A]" : "text-[#C9A227]"}`}
                          >
                            📎 {m.fichier_nom}
                          </button>
                        )}
                        <p className={`text-[10px] mt-1 ${m.auteur === "support" ? "text-[#5A4A0A]" : "text-[#7C8494]"}`}>
                          {formaterHeure(m.envoye_le)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={finDesMessages} />
          </div>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border-t border-[#4A2222] px-5 py-2">{erreur}</p>
          )}

          {fichier && (
            <div className="px-5 py-2 border-t border-[#232733] flex items-center justify-between text-xs text-[#C9A227]">
              <span>📎 {fichier.name}</span>
              <button onClick={() => { setFichier(null); if (inputFichier.current) inputFichier.current.value = ""; }} className="text-[#7C8494] hover:text-[#E8E6DE]">
                ✕
              </button>
            </div>
          )}

          <form onSubmit={gererEnvoi} className="border-t border-[#232733] p-3 flex gap-2 items-center">
            <label className="shrink-0 cursor-pointer text-[#7C8494] hover:text-[#E8E6DE] transition p-2" title="Joindre un fichier">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M21 11.5V17a4 4 0 0 1-4 4H8a5 5 0 0 1-5-5V8a4 4 0 0 1 4-4h4.5a1 1 0 0 1 .7.29l6.5 6.5a1 1 0 0 1 .3.71Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                ref={inputFichier}
                type="file"
                className="hidden"
                onChange={(e) => setFichier(e.target.files?.[0] || null)}
              />
            </label>
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Répondre..."
              className="flex-1 bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
            />
            <button
              type="submit"
              disabled={envoi || (!saisie.trim() && !fichier)}
              className="shrink-0 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold px-4 py-2 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
