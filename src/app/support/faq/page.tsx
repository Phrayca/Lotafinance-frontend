"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirFaqSupport,
  creerFaqItem,
  modifierFaqItem,
  supprimerFaqItem,
  FaqItem,
} from "@/lib/api";
import { HomeIcon, ClientsIcon, ReportsIcon, DocumentIcon, ProfileIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

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
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
  pencil: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
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
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const, actif: true },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

export default function PageFaqSupport() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [itemEnEdition, setItemEnEdition] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState("");
  const [reponseTexte, setReponseTexte] = useState("");
  const [categorie, setCategorie] = useState("");
  const [publiee, setPubliee] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);

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
        const liste = await obtenirFaqSupport(token);
        setItems(liste);
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

  function ouvrirNouveau() {
    setItemEnEdition(null);
    setQuestion("");
    setReponseTexte("");
    setCategorie("");
    setPubliee(true);
    setFormulaireOuvert(true);
  }
  function ouvrirEdition(item: FaqItem) {
    setItemEnEdition(item);
    setQuestion(item.question);
    setReponseTexte(item.reponse);
    setCategorie(item.categorie || "");
    setPubliee(item.publiee);
    setFormulaireOuvert(true);
  }

  async function gererEnregistrement(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !question.trim() || !reponseTexte.trim()) return;

    setErreur("");
    setEnvoiEnCours(true);
    try {
      if (itemEnEdition) {
        const misAJour = await modifierFaqItem(token, itemEnEdition.id, question.trim(), reponseTexte.trim(), categorie.trim(), publiee);
        setItems((precedent) => precedent.map((i) => (i.id === misAJour.id ? misAJour : i)));
      } else {
        const nouveau = await creerFaqItem(token, question.trim(), reponseTexte.trim(), categorie.trim(), publiee);
        setItems((precedent) => [nouveau, ...precedent]);
      }
      setFormulaireOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSuppressionEnCours(id);
    try {
      await supprimerFaqItem(token, id);
      setItems((precedent) => precedent.filter((i) => i.id !== id));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setSuppressionEnCours(null);
    }
  }

  if (chargement || !autorise) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
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

        <nav className="flex-1 space-y-1">
          {LIENS_NAV.map((lien, i) => (
            <div key={lien.href}>
              {!sidebarReduite && i === 0 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1">Gestion</p>}
              {!sidebarReduite && i === 2 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Rapports</p>}
              {!sidebarReduite && i === 4 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Outils</p>}
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
              <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">FAQ & Réponses</h1>
              <p className="text-[#7C8494] text-sm mt-1">Visible par les clients si publiée</p>
            </div>
            <button
              onClick={() => (formulaireOuvert ? setFormulaireOuvert(false) : ouvrirNouveau())}
              className="text-sm font-semibold bg-[#C9A227] text-[#0B0E14] px-3 py-1.5 rounded-md hover:bg-[#DDB63A] transition"
            >
              {formulaireOuvert ? "Annuler" : "+ Nouvelle question"}
            </button>
          </div>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {formulaireOuvert && (
            <form onSubmit={gererEnregistrement} className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Question</label>
                <input value={question} onChange={(e) => setQuestion(e.target.value)} className={CHAMP_CLASSES} placeholder="Comment faire une demande de prêt ?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Réponse</label>
                <textarea value={reponseTexte} onChange={(e) => setReponseTexte(e.target.value)} rows={4} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Catégorie (optionnel)</label>
                <input value={categorie} onChange={(e) => setCategorie(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex : Prêts, Remboursement..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={publiee} onChange={(e) => setPubliee(e.target.checked)} className="accent-[#C9A227]" />
                <span className="text-sm text-[#B8BAC4]">Visible par les clients</span>
              </label>
              <button
                type="submit"
                disabled={envoiEnCours}
                className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
              >
                {envoiEnCours ? "Enregistrement..." : itemEnEdition ? "Mettre à jour" : "Créer"}
              </button>
            </form>
          )}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            {items.length === 0 ? (
              <p className="text-sm text-[#5A6070] py-8 text-center">Aucune question pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="border border-[#232733] rounded-md p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#E8E6DE]">{item.question}</p>
                        <p className="text-xs text-[#7C8494] mt-1 whitespace-pre-wrap">{item.reponse}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {item.categorie && (
                            <span className="text-[10px] text-[#7C8494] bg-[#0B0E14] border border-[#232733] rounded-full px-2 py-0.5">{item.categorie}</span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.publiee ? "text-[#3DDC97] bg-[#0F2420]" : "text-[#7C8494] bg-[#1B1F29]"}`}>
                            {item.publiee ? "Publiée" : "Brouillon"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => ouvrirEdition(item)} className="text-[#7C8494] hover:text-[#E8E6DE] transition" title="Modifier">
                          {Ic("pencil", "w-4 h-4")}
                        </button>
                        <button
                          onClick={() => gererSuppression(item.id)}
                          disabled={suppressionEnCours === item.id}
                          className="text-[#F0A0A0] hover:text-[#FFB3B3] transition disabled:opacity-40"
                          title="Supprimer"
                        >
                          {Ic("trash", "w-4 h-4")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
