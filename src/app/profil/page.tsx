"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirMonProfilClient,
  enregistrerMonProfilClient,
  obtenirMesDocuments,
  changerMonMotDePasse,
  supprimerMonCompte,
  envoyerMaPhotoDeProfil,
  urlPhotoDeProfil,
  obtenirStatutDeMonCompte,
  obtenirMonStatutIdentite,
  obtenirMonPlafond,
  ProfilClient,
  DocumentClient,
  StatutCompte,
  Plafond,
} from "@/lib/api";
import {
  HomeIcon,
  LoanIcon,
  LoanRequestIcon,
  RepaymentIcon,
  DocumentIcon,
  ProfileIcon,
  IconCircle,
  CouleurLotafinance,
  NiveauBadge,
  NiveauCode,
} from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

type Utilisateur = { id: string; email: string; role: string; created_at?: string };

const TYPES_EMPLOI = [
  { valeur: "", libelle: "Sélectionner..." },
  { valeur: "salarie", libelle: "Salarié" },
  { valeur: "independant", libelle: "Indépendant" },
  { valeur: "commercant", libelle: "Commerçant" },
  { valeur: "autre", libelle: "Autre" },
];

const CATEGORIES_PROFESSIONNELLES = [
  { valeur: "", libelle: "Sélectionner..." },
  { valeur: "fonctionnaire", libelle: "Fonctionnaire" },
  { valeur: "cdi", libelle: "CDI" },
  { valeur: "cdd_plus_2ans", libelle: "CDD (plus de 2 ans)" },
  { valeur: "cdd_moins_2ans", libelle: "CDD (moins de 2 ans)" },
  { valeur: "interimaire", libelle: "Intérimaire" },
];

const ANCIENNETES_RESIDENCE = [
  { valeur: "", libelle: "Sélectionner..." },
  { valeur: "plus_3ans", libelle: "Plus de 3 ans à la même adresse" },
  { valeur: "1_a_3ans", libelle: "1 à 3 ans à la même adresse" },
  { valeur: "nouvelle", libelle: "Nouvelle résidence" },
];

function couleurNiveau(code: string): { bg: string; text: string } {
  if (code === "platine") return { bg: "#1B2A3A", text: "#7DD3FC" };
  if (code === "or") return { bg: "#2A2312", text: "#C9A227" };
  if (code === "argent") return { bg: "#241B33", text: "#C9A6F0" };
  return { bg: "#0F2420", text: "#3DDC97" }; // bronze
}

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} width="20" height="20">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONES = {
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  loans: "M7 4h10v16l-5-3-5 3V4Z M9 9h6 M9 12h6",
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  plus: "M12 5v14M5 12h14",
  calendarCheck: "M4 6h16v14H4V6Z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  lock: "M6 11V7a6 6 0 1 1 12 0v4 M5 11h14v10H5V11Z",
  camera: "M4 8h3l2-2h6l2 2h3v12H4V8Z M12 12a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
  mailCheck: "M4 6h16v12H4V6Z M4 6l8 7 8-7 M17 14l2 2 3-3",
  mailX: "M4 6h16v12H4V6Z M4 6l8 7 8-7 M17.5 15.5l3 3 M20.5 15.5l-3 3",
  idCheck: "M4 4h16v16H4V4Z M8 9h1 M8 12h1 M12 9h4 M12 12h4 M8 16l1.5 1.5L12 15",
  idX: "M4 4h16v16H4V4Z M8 9h1 M8 12h1 M12 9h4 M12 12h4 M8.5 15.5l3 3 M11.5 15.5l-3 3",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
};function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  loans: LoanIcon,
  plus: LoanRequestIcon,
  calendarCheck: RepaymentIcon,
  document: DocumentIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "blue", "purple", "green", "orange", "red"];

const COULEURS_ICONES = ["#F4C95D", "#C9A6F0", "#8FD9A8", "#7DBEF0", "#F4A5C9", "#F4956D", "#F0D96A", "#9AD1E8", "#D9A6F0", "#8FE0C4"];

const LIENS_NAV = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icone: "home" as const },
  { href: "/mes-demandes", label: "Mes prêts", icone: "loans" as const },
  { href: "/demande-pret", label: "Demande de prêt", icone: "plus" as const },
  { href: "/remboursements", label: "Mes remboursements", icone: "calendarCheck" as const },
  { href: "/documents", label: "Mes documents", icone: "document" as const },
  { href: "/profil", label: "Mon profil", icone: "user" as const, actif: true },
];

const PROFIL_VIDE: ProfilClient = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  birth_date: "",
  national_id_number: "",
  profession: "",
  employer: "",
  employment_type: "",
  monthly_income: undefined,
  monthly_expenses: undefined,
  activity_seniority_months: undefined,
  categorie_professionnelle: "",
  anciennete_residence: "",
  autres_credits_mensuels: undefined,
  code_parrainage_utilise: "",
};

function PageProfilClientContenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeOnboarding = searchParams.get("onboarding") === "1";
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [profil, setProfil] = useState<ProfilClient>(PROFIL_VIDE);
  const [documents, setDocuments] = useState<DocumentClient[]>([]);
  const [statutCompte, setStatutCompte] = useState<StatutCompte | null>(null);
  const [plafond, setPlafond] = useState<Plafond | null>(null);
  const [statutIdentite, setStatutIdentite] = useState<{ identity_verified: boolean; identity_rejected: boolean; identity_rejection_reason?: string }>({ identity_verified: false, identity_rejected: false });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [erreur, setErreur] = useState("");

  const [envoiPhotoEnCours, setEnvoiPhotoEnCours] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState("");

  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [erreurProfil, setErreurProfil] = useState("");
  const [succesProfil, setSuccesProfil] = useState(false);

  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [changementEnCours, setChangementEnCours] = useState(false);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  const [texteConfirmationSuppression, setTexteConfirmationSuppression] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState("");
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
        const u = await recupererMonProfilUtilisateur(token);
        setUtilisateur(u);
        setAvatarUrl(urlPhotoDeProfil(u.id));

        const p = await obtenirMonProfilClient(token);
        if (p) setProfil({ ...PROFIL_VIDE, ...p });

        obtenirStatutDeMonCompte(token).then(setStatutCompte).catch(() => {});
        obtenirMonPlafond(token).then(setPlafond).catch(() => {});
        obtenirMonStatutIdentite(token).then(setStatutIdentite).catch(() => {});
        obtenirMesDocuments(token).then(setDocuments).catch(() => {});
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
  }, []);

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

  function majChamp<K extends keyof ProfilClient>(champ: K, valeur: ProfilClient[K]) {
    setProfil((precedent) => ({ ...precedent, [champ]: valeur }));
  }

  async function gererEnvoiPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const token = localStorage.getItem("token");
    if (!token || !utilisateur) return;

    setErreurPhoto("");
    setEnvoiPhotoEnCours(true);
    try {
      await envoyerMaPhotoDeProfil(token, fichier);
      setAvatarUrl(`${urlPhotoDeProfil(utilisateur.id)}?t=${Date.now()}`);
      setStatutCompte((precedent) => (precedent ? { ...precedent, has_avatar: true } : precedent));
    } catch (err) {
      setErreurPhoto(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo");
    } finally {
      setEnvoiPhotoEnCours(false);
      e.target.value = "";
    }
  }

  async function gererEnregistrementProfil(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setErreurProfil("");
    setSuccesProfil(false);
    setEnregistrementEnCours(true);
    try {
      await enregistrerMonProfilClient(token, profil);
      setSuccesProfil(true);
      if (modeOnboarding) {
        router.push("/documents?onboarding=1");
        return;
      }
    } catch (err) {
      setErreurProfil(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setEnregistrementEnCours(false);
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

  async function gererSuppressionCompte() {
    const token = localStorage.getItem("token");
    if (!token || texteConfirmationSuppression !== "SUPPRIMER") return;

    setErreurSuppression("");
    setSuppressionEnCours(true);
    try {
      await supprimerMonCompte(token);
      localStorage.removeItem("token");
      router.push("/");
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : "Erreur lors de la suppression du compte");
    } finally {
      setSuppressionEnCours(false);
    }
  }

  if (chargement || !utilisateur) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  const identiteEnvoyee = documents.some((d) => d.document_type === "piece_identite");

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex">
      <aside className={`${sidebarReduite ? "w-16" : "w-60"} shrink-0 border-r border-[#1B1F29] flex flex-col py-6 px-3 transition-all duration-200`}>
        <div className={`flex items-center gap-2 mb-8 ${sidebarReduite ? "justify-center px-0" : "px-2"}`}>
          <span className="w-9 h-9 rounded-lg bg-[#C9A227] flex items-center justify-center text-[#0B0E14] font-bold font-['Source_Serif_4',serif] shrink-0">L</span>
          {!sidebarReduite && (
            <div>
              <p className="text-sm font-semibold text-[#E8E6DE] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#7C8494]">Votre partenaire financier</p>
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
              {!sidebarReduite && lien.label}
            </button>
          ))}
        </nav>

        <button
          onClick={basculerSidebar}
          title={sidebarReduite ? "Déplier le menu" : "Réduire le menu"}
          className="w-full flex items-center justify-center gap-2 py-2 mb-1 rounded-md text-xs text-[#7C8494] hover:bg-[#12151C] hover:text-[#E8E6DE] transition"
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

      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-xl">
          <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE] mb-1">{modeOnboarding ? "Complétez votre profil (étape 2/3)" : "Mon profil"}</h1>
          <p className="text-[#7C8494] text-sm mb-6">
            {modeOnboarding
              ? "Ces informations sont nécessaires pour calculer votre score de solvabilité dès votre première demande."
              : "Vos informations personnelles chez Lotafinance"}
          </p>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {/* Photo + identité */}
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4 flex items-center gap-4">
            <label className="relative w-14 h-14 shrink-0 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] flex items-center justify-center overflow-hidden cursor-pointer group">
              {statutCompte?.has_avatar && avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Photo de profil" className="w-full h-full object-cover" onError={() => setStatutCompte((p) => (p ? { ...p, has_avatar: false } : p))} />
              ) : (
                Ic("user", "w-6 h-6")
              )}
              <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[#E8E6DE]">
                {Ic("camera", "w-4 h-4")}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={gererEnvoiPhoto} disabled={envoiPhotoEnCours} />
            </label>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-[#E8E6DE] truncate">{utilisateur.email}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {statutCompte && (
                  statutCompte.email_verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-full px-2.5 py-1">
                      {Ic("mailCheck", "w-3.5 h-3.5")} Email vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A227] bg-[#1B1706] border border-[#3A3013] rounded-full px-2.5 py-1">
                      {Ic("mailX", "w-3.5 h-3.5")} Email non vérifié
                    </span>
                  )
                )}
                {statutIdentite.identity_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-full px-2.5 py-1">
                    {Ic("idCheck", "w-3.5 h-3.5")} Identité vérifiée
                  </span>
                ) : statutIdentite.identity_rejected ? (
                  <button
                    onClick={() => router.push("/documents")}
                    title={statutIdentite.identity_rejection_reason}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-full px-2.5 py-1 hover:bg-[#3A1A1A] transition"
                  >
                    {Ic("idX", "w-3.5 h-3.5")} Identité rejetée — renvoyer
                  </button>
                ) : identiteEnvoyee ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A227] bg-[#1B1706] border border-[#3A3013] rounded-full px-2.5 py-1">
                    {Ic("idCheck", "w-3.5 h-3.5")} Identité envoyée — en attente de vérification
                  </span>
                ) : (
                  <button
                    onClick={() => router.push("/documents")}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-full px-2.5 py-1 hover:bg-[#3A1A1A] transition"
                  >
                    {Ic("idX", "w-3.5 h-3.5")} Identité non envoyée — envoyer
                  </button>
                )}
                {plafond && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                    style={{ backgroundColor: couleurNiveau(plafond.niveau_code).bg, color: couleurNiveau(plafond.niveau_code).text }}
                    title={`${plafond.nombre_prets_reussis} prêt(s) remboursé(s) avec succès`}
                  >
                    <NiveauBadge niveau={plafond.niveau_code as NiveauCode} size={16} /> Niveau {plafond.niveau_libelle}
                  </span>
                )}
              </div>
              {envoiPhotoEnCours && <p className="text-[11px] text-[#7C8494] mt-1">Envoi de la photo...</p>}
              {erreurPhoto && <p className="text-[11px] text-[#F0A0A0] mt-1">{erreurPhoto}</p>}
              {statutIdentite.identity_rejected && statutIdentite.identity_rejection_reason && (
                <p className="text-[11px] text-[#F0A0A0] mt-1.5">Motif : {statutIdentite.identity_rejection_reason}</p>
              )}
            </div>
          </div>

          {/* Infos personnelles et professionnelles */}
          <form onSubmit={gererEnregistrementProfil} className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-4">Informations personnelles</h2>

            {erreurProfil && (
              <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-3">{erreurProfil}</p>
            )}
            {succesProfil && (
              <p className="text-sm text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-md px-3 py-2 mb-3">Profil mis à jour avec succès.</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Prénom *</label>
                <input required value={profil.first_name} onChange={(e) => majChamp("first_name", e.target.value)} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Nom *</label>
                <input required value={profil.last_name} onChange={(e) => majChamp("last_name", e.target.value)} className={CHAMP_CLASSES} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Téléphone *</label>
                <input required value={profil.phone} onChange={(e) => majChamp("phone", e.target.value)} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Date de naissance</label>
                <input type="date" value={profil.birth_date || ""} onChange={(e) => majChamp("birth_date", e.target.value)} className={CHAMP_CLASSES} />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Adresse</label>
              <input value={profil.address || ""} onChange={(e) => majChamp("address", e.target.value)} className={CHAMP_CLASSES} />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Numéro de pièce d'identité</label>
              <input value={profil.national_id_number || ""} onChange={(e) => majChamp("national_id_number", e.target.value)} className={CHAMP_CLASSES} />
            </div>

            <h2 className="text-sm font-medium text-[#E8E6DE] mb-4 border-t border-[#232733] pt-4">Informations professionnelles</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Profession</label>
                <input value={profil.profession || ""} onChange={(e) => majChamp("profession", e.target.value)} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Employeur</label>
                <input value={profil.employer || ""} onChange={(e) => majChamp("employer", e.target.value)} className={CHAMP_CLASSES} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Type d'emploi</label>
                <select value={profil.employment_type || ""} onChange={(e) => majChamp("employment_type", e.target.value)} className={CHAMP_CLASSES}>
                  {TYPES_EMPLOI.map((t) => (
                    <option key={t.valeur} value={t.valeur}>{t.libelle}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Ancienneté (mois)</label>
                <input
                  type="number" min={0}
                  value={profil.activity_seniority_months ?? ""}
                  onChange={(e) => majChamp("activity_seniority_months", e.target.value ? Number(e.target.value) : undefined)}
                  className={CHAMP_CLASSES}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Catégorie professionnelle</label>
                <select value={profil.categorie_professionnelle || ""} onChange={(e) => majChamp("categorie_professionnelle", e.target.value)} className={CHAMP_CLASSES}>
                  {CATEGORIES_PROFESSIONNELLES.map((c) => (
                    <option key={c.valeur} value={c.valeur}>{c.libelle}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#5A6070] mt-1">Utilisée pour le calcul de votre score Lotafinance.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Ancienneté à votre adresse</label>
                <select value={profil.anciennete_residence || ""} onChange={(e) => majChamp("anciennete_residence", e.target.value)} className={CHAMP_CLASSES}>
                  {ANCIENNETES_RESIDENCE.map((a) => (
                    <option key={a.valeur} value={a.valeur}>{a.libelle}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Revenu mensuel (F)</label>
                <input
                  type="number" min={0}
                  value={profil.monthly_income ?? ""}
                  onChange={(e) => majChamp("monthly_income", e.target.value ? Number(e.target.value) : undefined)}
                  className={CHAMP_CLASSES}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Charges mensuelles (F)</label>
                <input
                  type="number" min={0}
                  value={profil.monthly_expenses ?? ""}
                  onChange={(e) => majChamp("monthly_expenses", e.target.value ? Number(e.target.value) : undefined)}
                  className={CHAMP_CLASSES}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Autres crédits mensuels (F)</label>
                <input
                  type="number" min={0}
                  value={profil.autres_credits_mensuels ?? ""}
                  onChange={(e) => majChamp("autres_credits_mensuels", e.target.value ? Number(e.target.value) : undefined)}
                  className={CHAMP_CLASSES}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Code de parrainage (optionnel)</label>
              <input
                value={profil.code_parrainage_utilise ?? ""}
                onChange={(e) => majChamp("code_parrainage_utilise", e.target.value.toUpperCase())}
                className={CHAMP_CLASSES}
                placeholder="Ex: A1B2C3D4"
              />
              <p className="text-[10px] text-[#5A6070] mt-1">
                Si un proche vous a partagé son code, indiquez-le ici. Utilisable une seule fois, à la création de votre profil.
              </p>
            </div>

            <button
              type="submit"
              disabled={enregistrementEnCours}
              className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
            >
              {enregistrementEnCours ? "Enregistrement..." : modeOnboarding ? "Continuer vers les documents" : "Enregistrer mon profil"}
            </button>
          </form>

          {/* Mot de passe */}
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
                <input type="password" required value={motDePasseActuel} onChange={(e) => setMotDePasseActuel(e.target.value)} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Nouveau mot de passe</label>
                <input type="password" required minLength={6} value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} className={CHAMP_CLASSES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Confirmer le nouveau mot de passe</label>
                <input type="password" required minLength={6} value={confirmationMotDePasse} onChange={(e) => setConfirmationMotDePasse(e.target.value)} className={CHAMP_CLASSES} />
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

          {!modeOnboarding && (
            <div className="bg-[#2A1414] border border-[#4A2222] rounded-lg p-6 mt-4">
              <h2 className="text-sm font-semibold text-[#F0A0A0] mb-1">Zone sensible</h2>
              <p className="text-xs text-[#B8807E] mb-4">
                La suppression de votre compte est définitive et irréversible : profil, documents, historique de
                prêts et messages seront effacés. Impossible si un prêt est en cours de remboursement.
              </p>

              {erreurSuppression && (
                <p className="text-sm text-[#F0A0A0] bg-[#1A0F0F] border border-[#4A2222] rounded-md px-3 py-2 mb-3">{erreurSuppression}</p>
              )}

              {!confirmationSuppressionOuverte ? (
                <button
                  onClick={() => setConfirmationSuppressionOuverte(true)}
                  className="text-sm font-medium text-[#F0A0A0] border border-[#6B2E2E] rounded-md px-4 py-2 hover:bg-[#3A1A1A] transition"
                >
                  Supprimer mon compte
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#F0A0A0]">Tapez SUPPRIMER pour confirmer</label>
                  <input
                    value={texteConfirmationSuppression}
                    onChange={(e) => setTexteConfirmationSuppression(e.target.value)}
                    className="w-full bg-[#1A0F0F] border border-[#4A2222] rounded-md px-3 py-2 text-sm text-[#E8E6DE] focus:outline-none focus:border-[#F0A0A0] transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={gererSuppressionCompte}
                      disabled={texteConfirmationSuppression !== "SUPPRIMER" || suppressionEnCours}
                      className="flex-1 bg-[#4A2222] text-[#F0A0A0] border border-[#6B2E2E] text-sm font-semibold py-2 rounded-md hover:bg-[#5A2828] transition disabled:opacity-40"
                    >
                      {suppressionEnCours ? "Suppression..." : "Confirmer la suppression définitive"}
                    </button>
                    <button
                      onClick={() => { setConfirmationSuppressionOuverte(false); setTexteConfirmationSuppression(""); setErreurSuppression(""); }}
                      className="text-sm font-medium text-[#7C8494] px-3 py-2 hover:text-[#E8E6DE] transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PageProfilClient() {
  return (
    <Suspense fallback={null}>
      <PageProfilClientContenu />
    </Suspense>
  );
}
