"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { creerTicket, obtenirMesTickets, Ticket } from "@/lib/api";
import { HomeIcon, LoanIcon, LoanRequestIcon, RepaymentIcon, DocumentIcon, ProfileIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition";

const CATEGORIES = [
  { valeur: "remboursement", libelle: "Remboursement" },
  { valeur: "echeance", libelle: "Échéance" },
  { valeur: "compte", libelle: "Mon compte" },
  { valeur: "document", libelle: "Documents" },
  { valeur: "autre", libelle: "Autre" },
];

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

function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/documents", label: "Docs", Icone: DocumentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

export default function PageReclamations() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [sujet, setSujet] = useState("");
  const [categorie, setCategorie] = useState("autre");
  const [description, setDescription] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    chargerTickets(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function chargerTickets(token: string) {
    try {
      const liste = await obtenirMesTickets(token);
      setTickets(liste);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  async function gererCreation(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!sujet.trim() || !description.trim()) {
      setErreur("Merci de remplir le sujet et la description.");
      return;
    }

    setErreur("");
    setEnvoiEnCours(true);
    try {
      await creerTicket(token, sujet.trim(), description.trim(), categorie);
      setSujet("");
      setDescription("");
      setCategorie("autre");
      setFormulaireOuvert(false);
      await chargerTickets(token);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#8e99a8] font-mono">Chargement...</p>
      </main>
    );
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10 pb-28 md:pb-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#8e99a8] hover:text-[#eef1f4] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4]">Mes réclamations</h1>
            <button
              onClick={() => setFormulaireOuvert((v) => !v)}
              className="text-sm font-semibold bg-[#c99a4b] text-[#10151c] px-3 py-1.5 rounded-md hover:bg-[#e4b565] transition"
            >
              {formulaireOuvert ? "Annuler" : "+ Nouvelle réclamation"}
            </button>
          </div>
          <p className="text-[#8e99a8] text-sm">
            {tickets.length} réclamation{tickets.length > 1 ? "s" : ""}
          </p>
        </div>

        {erreur && (
          <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}

        {formulaireOuvert && (
          <form onSubmit={gererCreation} className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8e99a8] mb-1">Sujet</label>
              <input value={sujet} onChange={(e) => setSujet(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex : échéance mal prélevée" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8e99a8] mb-1">Catégorie</label>
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={CHAMP_CLASSES}>
                {CATEGORIES.map((c) => (
                  <option key={c.valeur} value={c.valeur}>{c.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8e99a8] mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={CHAMP_CLASSES}
                placeholder="Décris ton problème en détail..."
              />
            </div>
            <button
              type="submit"
              disabled={envoiEnCours}
              className="w-full bg-[#c99a4b] text-[#10151c] text-sm font-semibold py-2.5 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50"
            >
              {envoiEnCours ? "Envoi..." : "Envoyer la réclamation"}
            </button>
          </form>
        )}

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          {tickets.length === 0 ? (
            <p className="text-sm text-[#66707d] py-8 text-center">Aucune réclamation pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const couleur = couleurStatut(t.statut);
                const vu = localStorage.getItem(`ticket_vu_${t.id}`);
                const nouvelleReponse = !!t.dernier_message_agent_le && (!vu || t.dernier_message_agent_le > vu);
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/reclamations/${t.id}`)}
                    className="w-full text-left border border-[rgba(255,255,255,0.08)] rounded-md p-4 hover:border-[rgba(255,255,255,0.16)] transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {nouvelleReponse && <span className="w-2 h-2 rounded-full bg-[#C24545] shrink-0" title="Nouvelle réponse" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#eef1f4] truncate">{t.sujet}</p>
                        <p className="text-xs text-[#8e99a8] mt-0.5">{formaterDate(t.cree_le)}</p>
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

      {/* Barre de navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#10151c]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around py-2 px-1">
        {LIENS_NAV_MOBILE.map((lien) => {
          const Icone = lien.Icone;
          return (
            <button key={lien.href} onClick={() => router.push(lien.href)} className="flex flex-col items-center gap-0.5 flex-1 py-1">
              <span className="text-[#8e99a8]">
                <Icone size={20} />
              </span>
              <span className="text-[9px] text-[#8e99a8]">{lien.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
