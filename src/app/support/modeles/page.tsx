"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirModelesReponse,
  creerModeleReponse,
  supprimerModeleReponse,
  ModeleReponse,
} from "@/lib/api";
import { HomeIcon, ProfileIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

type Utilisateur = { id: string; email: string; role: string; first_name?: string; last_name?: string };

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
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "purple", "blue"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const, actif: true },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function PageModelesReponse() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [modeles, setModeles] = useState<ModeleReponse[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
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
        const liste = await obtenirModelesReponse(token);
        setModeles(liste);
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

  async function gererCreation(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !titre.trim() || !contenu.trim()) return;

    setErreur("");
    setEnvoiEnCours(true);
    try {
      const nouveau = await creerModeleReponse(token, titre.trim(), contenu.trim());
      setModeles((precedent) => [...precedent, nouveau].sort((a, b) => a.titre.localeCompare(b.titre)));
      setTitre("");
      setContenu("");
      setFormulaireOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(id: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSuppressionEnCours(id);
    try {
      await supprimerModeleReponse(token, id);
      setModeles((precedent) => precedent.filter((m) => m.id !== id));
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
            <button
              key={lien.href}
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
              <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">Modèles de réponses</h1>
              <p className="text-[#7C8494] text-sm mt-1">Partagés par toute l&apos;équipe Service Client</p>
            </div>
            <button
              onClick={() => setFormulaireOuvert((v) => !v)}
              className="text-sm font-semibold bg-[#C9A227] text-[#0B0E14] px-3 py-1.5 rounded-md hover:bg-[#DDB63A] transition"
            >
              {formulaireOuvert ? "Annuler" : "+ Nouveau modèle"}
            </button>
          </div>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {formulaireOuvert && (
            <form onSubmit={gererCreation} className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Titre</label>
                <input value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex : Retard de paiement" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Contenu</label>
                <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} rows={4} className={CHAMP_CLASSES} placeholder="Le texte que tu veux réutiliser..." />
              </div>
              <button
                type="submit"
                disabled={envoiEnCours}
                className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
              >
                {envoiEnCours ? "Création..." : "Créer le modèle"}
              </button>
            </form>
          )}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            {modeles.length === 0 ? (
              <p className="text-sm text-[#5A6070] py-8 text-center">Aucun modèle pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {modeles.map((m) => (
                  <div key={m.id} className="border border-[#232733] rounded-md p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#E8E6DE]">{m.titre}</p>
                      <p className="text-xs text-[#7C8494] mt-1 whitespace-pre-wrap">{m.contenu}</p>
                      <p className="text-[10px] text-[#5A6070] mt-1.5">Créé le {formaterDate(m.cree_le)}</p>
                    </div>
                    <button
                      onClick={() => gererSuppression(m.id)}
                      disabled={suppressionEnCours === m.id}
                      className="shrink-0 text-[#F0A0A0] hover:text-[#FFB3B3] transition disabled:opacity-40"
                      title="Supprimer"
                    >
                      {Ic("trash", "w-4 h-4")}
                    </button>
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
