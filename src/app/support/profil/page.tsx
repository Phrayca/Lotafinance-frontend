"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recupererMonProfilUtilisateur, enregistrerMesInformations, changerMonMotDePasse } from "@/lib/api";
import { HomeIcon, ProfileIcon, DocumentIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] focus:outline-none focus:border-[#C9A227] transition";

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
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  reports: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  lock: "M6 11V7a6 6 0 1 1 12 0v4 M5 11h14v10H5V11Z",
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
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "gold", "blue", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/rapports", label: "Rapports", icone: "reports" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/notifications", label: "Notifications", icone: "bell" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const, actif: true },
];

export default function PageProfilAgent() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [enregistrementInfosEnCours, setEnregistrementInfosEnCours] = useState(false);
  const [erreurInfos, setErreurInfos] = useState("");
  const [succesInfos, setSuccesInfos] = useState(false);

  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [changementEnCours, setChangementEnCours] = useState(false);
  const [erreurMotDePasse, setErreurMotDePasse] = useState("");
  const [succesMotDePasse, setSuccesMotDePasse] = useState(false);

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
        setPrenom(profil.first_name || "");
        setNom(profil.last_name || "");
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

  async function gererEnregistrementInfos(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setErreurInfos("");
    setSuccesInfos(false);
    setEnregistrementInfosEnCours(true);
    try {
      const misAJour = await enregistrerMesInformations(token, prenom.trim(), nom.trim());
      setUtilisateur((precedent) => (precedent ? { ...precedent, first_name: misAJour.first_name, last_name: misAJour.last_name } : precedent));
      setSuccesInfos(true);
    } catch (err) {
      setErreurInfos(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setEnregistrementInfosEnCours(false);
    }
  }

  async function gererChangementMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setErreurMotDePasse("");
    setSuccesMotDePasse(false);

    if (nouveauMotDePasse !== confirmationMotDePasse) {
      setErreurMotDePasse("Les deux mots de passe ne correspondent pas");
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      setErreurMotDePasse("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setChangementEnCours(true);
    try {
      await changerMonMotDePasse(token, motDePasseActuel, nouveauMotDePasse);
      setSuccesMotDePasse(true);
      setMotDePasseActuel("");
      setNouveauMotDePasse("");
      setConfirmationMotDePasse("");
    } catch (err) {
      setErreurMotDePasse(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setChangementEnCours(false);
    }
  }

  if (chargement) {
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
              {!sidebarReduite && i === 5 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Outils</p>}
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
        <div className="max-w-xl mx-auto">
          <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE] mb-1">Mon profil</h1>
          <p className="text-[#7C8494] text-sm mb-6">Informations de ton compte Service Client</p>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4 flex items-center gap-4">
            <span className="w-14 h-14 shrink-0 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] flex items-center justify-center">
              {Ic("user", "w-6 h-6")}
            </span>
            <div className="min-w-0">
              <p className="text-base font-medium text-[#E8E6DE] truncate">
                {utilisateur?.first_name || utilisateur?.last_name ? `${utilisateur?.first_name || ""} ${utilisateur?.last_name || ""}`.trim() : utilisateur?.email}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5B8DEF] bg-[#12203A] border border-[#1E3A6B] rounded-full px-2.5 py-1 mt-1.5">
                Service client
              </span>
            </div>
          </div>

          <form onSubmit={gererEnregistrementInfos} className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-4">Informations personnelles</h2>

            {erreurInfos && (
              <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-3">{erreurInfos}</p>
            )}
            {succesInfos && (
              <p className="text-sm text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-md px-3 py-2 mb-3">Informations mises à jour.</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Prénom</label>
                <input required value={prenom} onChange={(e) => setPrenom(e.target.value)} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Nom</label>
                <input required value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP_CLASSES} />
              </div>
            </div>

            <button
              type="submit"
              disabled={enregistrementInfosEnCours}
              className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              {enregistrementInfosEnCours ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>

          <form onSubmit={gererChangementMotDePasse} className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-4 flex items-center gap-2">{Ic("lock", "w-4 h-4")} Changer mon mot de passe</h2>

            {erreurMotDePasse && (
              <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-3">{erreurMotDePasse}</p>
            )}
            {succesMotDePasse && (
              <p className="text-sm text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-md px-3 py-2 mb-3">Mot de passe mis à jour avec succès.</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Mot de passe actuel</label>
                <input type="password" value={motDePasseActuel} onChange={(e) => setMotDePasseActuel(e.target.value)} required className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Nouveau mot de passe</label>
                <input type="password" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} required minLength={6} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Confirmer le nouveau mot de passe</label>
                <input type="password" value={confirmationMotDePasse} onChange={(e) => setConfirmationMotDePasse(e.target.value)} required minLength={6} className={CHAMP_CLASSES} />
              </div>
            </div>

            <button
              type="submit"
              disabled={changementEnCours}
              className="mt-4 w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              {changementEnCours ? "..." : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
