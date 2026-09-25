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
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition";

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
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  faq: "M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-1.5 1.3-1.5 2.7 M12 17h.01",
  star: "M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.3l7-.8Z",
  channel: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  reports: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
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
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "gold", "blue", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/rapports", label: "Rapports", icone: "reports" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const, actif: true },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/notifications", label: "Notifications", icone: "bell" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
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
        <p className="text-sm text-[#8e99a8] font-mono">Chargement...</p>
      </main>
    );
  }

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

      <div className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <h1 className="font-['Sora',sans-serif] text-2xl text-[#eef1f4]">Modèles de réponses</h1>
              <p className="text-[#8e99a8] text-sm mt-1">Partagés par toute l&apos;équipe Service Client</p>
            </div>
            <button
              onClick={() => setFormulaireOuvert((v) => !v)}
              className="text-sm font-semibold bg-[#c99a4b] text-[#10151c] px-3 py-1.5 rounded-md hover:bg-[#e4b565] transition"
            >
              {formulaireOuvert ? "Annuler" : "+ Nouveau modèle"}
            </button>
          </div>

          {erreur && (
            <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {formulaireOuvert && (
            <form onSubmit={gererCreation} className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#8e99a8] mb-1">Titre</label>
                <input value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex : Retard de paiement" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8e99a8] mb-1">Contenu</label>
                <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} rows={4} className={CHAMP_CLASSES} placeholder="Le texte que tu veux réutiliser..." />
              </div>
              <button
                type="submit"
                disabled={envoiEnCours}
                className="w-full bg-[#c99a4b] text-[#10151c] text-sm font-semibold py-2.5 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50"
              >
                {envoiEnCours ? "Création..." : "Créer le modèle"}
              </button>
            </form>
          )}

          <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
            {modeles.length === 0 ? (
              <p className="text-sm text-[#66707d] py-8 text-center">Aucun modèle pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {modeles.map((m) => (
                  <div key={m.id} className="border border-[rgba(255,255,255,0.08)] rounded-md p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#eef1f4]">{m.titre}</p>
                      <p className="text-xs text-[#8e99a8] mt-1 whitespace-pre-wrap">{m.contenu}</p>
                      <p className="text-[10px] text-[#66707d] mt-1.5">Créé le {formaterDate(m.cree_le)}</p>
                    </div>
                    <button
                      onClick={() => gererSuppression(m.id)}
                      disabled={suppressionEnCours === m.id}
                      className="shrink-0 text-[#c0563b] hover:text-[#d97a63] transition disabled:opacity-40"
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
