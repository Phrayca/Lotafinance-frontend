"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  obtenirDossier,
  obtenirDocumentsDuClient,
  telechargerDocument,
  deciderDossier,
  obtenirEcheancesAnalyste,
  confirmerPaiementEcheance,
  obtenirConversations,
  obtenirPretsDuClient,
  supprimerDossier,
  obtenirJournalDecisions,
  verifierIdentiteClient,
  rejeterIdentiteClient,
  obtenirStatutIdentiteClient,
  recupererMonProfilUtilisateur,
  urlPhotoDeProfil,
  LoanDetailOut,
  LoanOut,
  DocumentClient,
  Echeance,
  DecisionLog,
  IdentityStatus,
} from "@/lib/api";
import {
  HomeIcon,
  LoanIcon,
  RepaymentIcon,
  ClientsIcon,
  ScoreIcon,
  ReportsIcon,
  AuditIcon,
  SettingsIcon,
  MessagesIcon,
  ProfileIcon,
  IconCircle,
  CouleurLotafinance,
} from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

const LIBELLES_DOCUMENTS: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  carte_residence: "Carte de résidence (Dakar)",
  contrat_travail: "Contrat de travail",
  certificat_travail: "Certificat de travail",
};

const LIBELLES_STATUT: Record<string, string> = {
  soumis: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
  infos_demandees: "Infos demandées",
};

function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "approuve") return { bg: "#0F2420", text: "#3DDC97" };
  if (statut === "refuse") return { bg: "#2A1414", text: "#F0A0A0" };
  return { bg: "#2A2312", text: "#C9A227" };
}

function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function formaterMontant(m?: number | null) {
  if (m == null) return "—";
  return `${m.toLocaleString("fr-FR")} F`;
}
function formaterDuree(semaines: number) {
  if (semaines === 4) return "1 mois";
  return `${semaines} semaine${semaines > 1 ? "s" : ""}`;
}
function estEnRetard(e: Echeance) {
  return !e.payee && new Date(e.date_echeance).getTime() < Date.now();
}
function joursDeRetard(e: Echeance) {
  const diff = Date.now() - new Date(e.date_echeance).getTime();
  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
}
const SEUIL_RETARD_CRITIQUE = 3;
// Frais de traitement fixes, encaissés dès le déboursement (n'affectent pas le total à rembourser)
const FRAIS_DE_TRAITEMENT = 1000;

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
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  mail: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  calendarCheck: "M4 6h16v14H4V6Z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  alert: "M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
  idCheck: "M4 4h16v16H4V4Z M8 9h1 M8 12h1 M12 9h4 M12 12h4 M8 16l1.5 1.5L12 15",
  idX: "M4 4h16v16H4V4Z M8 9h1 M8 12h1 M12 9h4 M12 12h4 M8.5 15.5l3 3 M11.5 15.5l-3 3",
  history: "M3 3v5h5 M3.05 13a9 9 0 1 0 2.13-7.36L3 8",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.7-1.6L13.4 2h-2.8l-.4 2.8a7 7 0 0 0-2.7 1.6l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.06 1 .2 1.6l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.7 1.6l.4 2.8h2.8l.4-2.8a7 7 0 0 0 2.7-1.6l2.3.9 2-3.4-2-1.5c.14-.5.2-1 .2-1.6Z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  chevronDown: "M6 9l6 6 6-6",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  loans: LoanIcon,
  calendarCheck: RepaymentIcon,
  users: ClientsIcon,
  target: ScoreIcon,
  chart: ReportsIcon,
  history: AuditIcon,
  gear: SettingsIcon,
  mail: MessagesIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "blue", "purple", "green", "orange", "red"];

const COULEURS_ICONES = ["#F4C95D", "#C9A6F0", "#8FD9A8", "#7DBEF0", "#F4A5C9", "#F4956D", "#F0D96A", "#9AD1E8", "#D9A6F0", "#8FE0C4", "#F0C08A", "#A8C9F0", "#F0A6B8"];

const LIENS_NAV = [
  { href: "/analyste", label: "Tableau de bord", icone: "home" as const },
  { href: "/analyste/toutes", label: "Toutes les demandes", icone: "loans" as const },
  { href: "/analyste/toutes?statut=approuve", label: "Dossiers approuvés", icone: "loans" as const },
  { href: "/analyste/toutes?statut=refuse", label: "Dossiers refusés", icone: "loans" as const },
  { href: "/analyste/remboursements", label: "Remboursements", icone: "calendarCheck" as const },
  { href: "/analyste/clients", label: "Clients", icone: "users" as const },
  { href: "/analyste/analyse-scoring", label: "Analyse & Scoring", icone: "target" as const },
  { href: "/analyste/rapports", label: "Rapports & Statistiques", icone: "chart" as const },
  { href: "/analyste/audit", label: "Audit & Logs", icone: "history" as const },
  { href: "/analyste/parametres", label: "Paramètres", icone: "gear" as const },
  { href: "/analyste/utilisateurs", label: "Gestion des utilisateurs", icone: "users" as const },
  { href: "/analyste/messages", label: "Messages", icone: "mail" as const },
  { href: "/analyste/profil", label: "Mon profil", icone: "user" as const },
];

export default function PageDossierAnalyste() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [utilisateur, setUtilisateur] = useState<{ id: string; email: string; role: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const params = useParams();
  const loanId = params.id as string;

  const [dossier, setDossier] = useState<LoanDetailOut | null>(null);
  const [documents, setDocuments] = useState<DocumentClient[]>([]);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [pretsPrecedents, setPretsPrecedents] = useState<LoanOut[]>([]);
  const [journal, setJournal] = useState<DecisionLog[]>([]);
  const [monRole, setMonRole] = useState<string>("");
  const [statutIdentite, setStatutIdentite] = useState<IdentityStatus>({ identity_verified: false, identity_rejected: false });
  const [verificationIdentiteEnCours, setVerificationIdentiteEnCours] = useState(false);
  const [motifRejetOuvert, setMotifRejetOuvert] = useState(false);
  const [motifRejet, setMotifRejet] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [decisionEnCours, setDecisionEnCours] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [montantApprouve, setMontantApprouve] = useState("");
  const [confirmationEnCours, setConfirmationEnCours] = useState<string | null>(null);
  const [totalNonLus, setTotalNonLus] = useState(0);
  const [demandeSuppression, setDemandeSuppression] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    (async () => {
      try {
        const d = await obtenirDossier(token, loanId);
        setDossier(d);
        setMontantApprouve(String(d.amount_requested));
        const docs = await obtenirDocumentsDuClient(token, d.client_id);
        setDocuments(docs);
        if (d.status === "approuve") {
          const ech = await obtenirEcheancesAnalyste(token, loanId);
          setEcheances(ech);
        }
        const prets = await obtenirPretsDuClient(token, d.client_id);
        setPretsPrecedents(prets.filter((p) => p.id !== loanId));

        const j = await obtenirJournalDecisions(token, loanId);
        setJournal(j);

        const statutIdentiteRecu = await obtenirStatutIdentiteClient(token, d.client_id);
        setStatutIdentite(statutIdentiteRecu);

        const monProfil = await recupererMonProfilUtilisateur(token);
        setMonRole(monProfil.role);
        setUtilisateur(monProfil);
        setAvatarUrl(urlPhotoDeProfil(monProfil.id));
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    obtenirConversations(token)
      .then((liste) => setTotalNonLus(liste.reduce((somme, c) => somme + c.non_lus, 0)))
      .catch(() => {});
  }, [router, loanId]);


  useEffect(() => {
    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
  }, []);

  function basculerSidebar() {
    setSidebarReduite((v) => {
      const nouveau = !v;
      localStorage.setItem("sidebar_reduite", nouveau ? "1" : "0");
      return nouveau;
    });
  }

  function seDeconnecter() {
    localStorage.removeItem("token");
    router.push("/");
  }

  function gererRecherche(e: React.FormEvent) {
    e.preventDefault();
    if (recherche.trim()) router.push(`/analyste/recherche?q=${encodeURIComponent(recherche.trim())}`);
  }

  async function gererTelechargement(doc: DocumentClient) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await telechargerDocument(token, doc.id, doc.original_file_name);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur de téléchargement");
    }
  }

  async function gererDecision(decision: "approuve" | "refuse" | "infos_demandees") {
    const token = localStorage.getItem("token");
    if (!token) return;

    setErreur("");
    setDecisionEnCours(true);
    try {
      const montant = decision === "approuve" && montantApprouve ? Number(montantApprouve) : undefined;
      const misAJour = await deciderDossier(token, loanId, decision, commentaire, montant);
      setDossier((precedent) => (precedent ? { ...precedent, ...misAJour } : null));
      if (decision === "approuve") {
        const ech = await obtenirEcheancesAnalyste(token, loanId);
        setEcheances(ech);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setDecisionEnCours(false);
    }
  }

  async function gererConfirmationPaiement(installmentId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    setConfirmationEnCours(installmentId);
    try {
      const misAJour = await confirmerPaiementEcheance(token, loanId, installmentId);
      setEcheances((precedent) => precedent.map((e) => (e.id === misAJour.id ? misAJour : e)));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setConfirmationEnCours(null);
    }
  }

  async function gererVerificationIdentite() {
    const token = localStorage.getItem("token");
    if (!token || !dossier) return;

    setVerificationIdentiteEnCours(true);
    try {
      const resultat = await verifierIdentiteClient(token, dossier.client_id);
      setStatutIdentite(resultat);
      setMotifRejetOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la vérification");
    } finally {
      setVerificationIdentiteEnCours(false);
    }
  }

  async function gererRejetIdentite() {
    const token = localStorage.getItem("token");
    if (!token || !dossier) return;
    if (!motifRejet.trim()) {
      setErreur("Merci d'indiquer un motif de rejet.");
      return;
    }

    setVerificationIdentiteEnCours(true);
    try {
      const resultat = await rejeterIdentiteClient(token, dossier.client_id, motifRejet.trim());
      setStatutIdentite(resultat);
      setMotifRejetOuvert(false);
      setMotifRejet("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors du rejet");
    } finally {
      setVerificationIdentiteEnCours(false);
    }
  }

  async function gererSuppression() {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!demandeSuppression) {
      setDemandeSuppression(true);
      return;
    }

    setSuppressionEnCours(true);
    setErreur("");
    try {
      await supprimerDossier(token, loanId);
      router.push("/analyste/toutes");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setSuppressionEnCours(false);
      setDemandeSuppression(false);
    }
  }

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  if (!dossier) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#F0A0A0]">{erreur || "Dossier introuvable"}</p>
      </main>
    );
  }

  const dejaDecide = dossier.status !== "soumis";
  const scoreFaible = (dossier.credit_score ?? 100) < 50;
  const risqueEleve = (dossier.risk_level || "").toLowerCase().includes("élev") || (dossier.risk_level || "").toLowerCase().includes("risqu");

  // Retards
  const echeancesEnRetard = echeances.filter(estEnRetard);

  // Rentabilité
  const capital = dossier.approved_amount ?? dossier.amount_requested;
  const totalPrevu = dossier.total_to_repay ?? 0;
  const interetsPrevus = Math.max(totalPrevu - capital, 0);
  const dejaEncaisse = echeances.filter((e) => e.payee).reduce((s, e) => s + e.montant, 0);
  const resteAPercevoir = Math.max(totalPrevu - dejaEncaisse, 0);

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex">
      <aside className={`${sidebarReduite ? "w-16" : "w-60"} shrink-0 border-r border-[#1B1F29] flex flex-col py-6 px-3 transition-all duration-200`}>
        <div className={`flex items-center gap-2 mb-8 ${sidebarReduite ? "justify-center px-0" : "px-2"}`}>
          <span className="w-9 h-9 rounded-lg bg-[#C9A227] flex items-center justify-center text-[#0B0E14] font-bold font-['Source_Serif_4',serif] shrink-0">L</span>
          {!sidebarReduite && (
            <div>
              <p className="text-sm font-semibold text-[#E8E6DE] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#7C8494]">Espace analyste</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {LIENS_NAV.map((lien, i) => (
            <button
              key={lien.href}
              onClick={() => router.push(lien.href)}
              title={sidebarReduite ? lien.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm text-[#B8BAC4] hover:bg-[#12151C] transition ${sidebarReduite ? "justify-center px-0" : "px-3"}`}
            >
                            <IconCircle color={COULEURS_NAV[i % COULEURS_NAV.length]} size={28} actif={lien.actif}>
                {(() => {
                  const IconeRiche = ICONES_RICHES[lien.icone];
                  return IconeRiche ? <IconeRiche size={16} /> : Ic(lien.icone, "w-4 h-4");
                })()}
              </IconCircle>
              {!sidebarReduite && <span className="flex-1 text-left">{lien.label}</span>}
              {lien.href === "/analyste/messages" && totalNonLus > 0 && (
                <span className={`${sidebarReduite ? "absolute translate-x-3 -translate-y-3" : ""} w-5 h-5 rounded-full bg-[#C24545] text-white text-[10px] flex items-center justify-center shrink-0`}>
                  {totalNonLus}
                </span>
              )}
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
      </aside>

      <div className="flex-1 px-8 py-6 overflow-x-auto">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <form onSubmit={gererRecherche} className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6070]">{Ic("search", "w-4 h-4")}</span>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un dossier, client, numéro de téléphone..."
                className="w-full bg-[#12151C] border border-[#232733] rounded-md pl-9 pr-3 py-2.5 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
              />
            </form>

            <button onClick={() => router.push("/analyste/messages")} title="Messages" className="relative shrink-0 text-[#7C8494] hover:text-[#E8E6DE] transition p-2">
              {Ic("mail", "w-5 h-5")}
              {totalNonLus > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C24545] text-white text-[9px] flex items-center justify-center">{totalNonLus}</span>
              )}
            </button>

            <div className="relative shrink-0">
              <button onClick={() => setMenuProfilOuvert((v) => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-[#232733] hover:border-[#3A4050] transition">
                <span className="w-7 h-7 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] flex items-center justify-center overflow-hidden shrink-0">
                  {utilisateur && avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    Ic("user", "w-3.5 h-3.5")
                  )}
                </span>
                <span className="text-xs text-[#B8BAC4] hidden md:inline">{utilisateur?.email?.split("@")[0]}</span>
                {Ic("chevronDown", "w-3 h-3 text-[#7C8494]")}
              </button>
              {menuProfilOuvert && (
                <div className="absolute right-0 top-10 w-44 bg-[#12151C] border border-[#232733] rounded-md shadow-xl z-10 overflow-hidden">
                  <button onClick={() => router.push("/analyste/profil")} className="w-full text-left px-3 py-2 text-sm text-[#B8BAC4] hover:bg-[#171B24] transition">
                    Mon profil
                  </button>
                  <button onClick={seDeconnecter} className="w-full text-left px-3 py-2 text-sm text-[#F0A0A0] hover:bg-[#171B24] transition">
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => router.back()} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
            ← Retour
          </button>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {echeancesEnRetard.length > 0 && (() => {
            const critiques = echeancesEnRetard.filter((e) => joursDeRetard(e) >= SEUIL_RETARD_CRITIQUE);
            const critique = critiques.length > 0;
            const pireRetard = Math.max(...echeancesEnRetard.map(joursDeRetard));
            return (
              <div
                className={`flex items-center gap-2 rounded-md px-4 py-3 mb-4 text-sm ${
                  critique ? "bg-[#3A1010] border border-[#7A2E2E] text-[#FFB3B3]" : "bg-[#2A1414] border border-[#4A2222] text-[#F0A0A0]"
                }`}
              >
                {Ic("alert", "w-4 h-4 shrink-0")}
                {echeancesEnRetard.length} échéance{echeancesEnRetard.length > 1 ? "s" : ""} en retard sur ce dossier
                {critique ? ` — dont ${critiques.length} en retard critique (${pireRetard} jours)` : ` (jusqu'à ${pireRetard} jour${pireRetard > 1 ? "s" : ""})`}.
              </div>
            );
          })()}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
              <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">
                {dossier.client_first_name} {dossier.client_last_name}
              </h1>
              <div className="flex items-center gap-2">
                {statutIdentite.identity_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-full px-2.5 py-1">
                    {Ic("idCheck", "w-3.5 h-3.5")} Identité vérifiée
                  </span>
                ) : statutIdentite.identity_rejected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-full px-2.5 py-1">
                    {Ic("idX", "w-3.5 h-3.5")} Identité rejetée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A227] bg-[#1B1706] border border-[#3A3013] rounded-full px-2.5 py-1">
                    {Ic("idCheck", "w-3.5 h-3.5")} Identité en attente
                  </span>
                )}
                {!statutIdentite.identity_verified && (
                  <button
                    onClick={gererVerificationIdentite}
                    disabled={verificationIdentiteEnCours}
                    className="text-xs font-medium text-[#3DDC97] border border-[#2A6B57] rounded-full px-2.5 py-1 hover:bg-[#0F2420] transition disabled:opacity-50"
                  >
                    Vérifier
                  </button>
                )}
                {!statutIdentite.identity_rejected && (
                  <button
                    onClick={() => setMotifRejetOuvert((v) => !v)}
                    disabled={verificationIdentiteEnCours}
                    className="text-xs font-medium text-[#F0A0A0] border border-[#6B2E2E] rounded-full px-2.5 py-1 hover:bg-[#2A1414] transition disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                )}
              </div>
            </div>
            {statutIdentite.identity_rejected && statutIdentite.identity_rejection_reason && (
              <p className="text-xs text-[#F0A0A0] mb-2">Motif du rejet : {statutIdentite.identity_rejection_reason}</p>
            )}
            {motifRejetOuvert && (
              <div className="flex gap-2 mb-3">
                <input
                  value={motifRejet}
                  onChange={(e) => setMotifRejet(e.target.value)}
                  placeholder="Motif du rejet (ex: photo illisible)"
                  className="flex-1 bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-1.5 text-xs text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
                />
                <button
                  onClick={gererRejetIdentite}
                  disabled={verificationIdentiteEnCours}
                  className="text-xs font-medium bg-[#4A2222] text-[#F0A0A0] border border-[#6B2E2E] rounded-md px-3 py-1.5 hover:bg-[#5A2828] transition disabled:opacity-50"
                >
                  Confirmer
                </button>
              </div>
            )}
            <p className="text-[#7C8494] text-sm mb-6 font-mono">{dossier.client_phone}</p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <Ligne label="Montant demandé" valeur={formaterMontant(dossier.amount_requested)} />
              <Ligne label="Durée" valeur={formaterDuree(dossier.duration_weeks)} />
              <Ligne label="Motif" valeur={dossier.purpose || "—"} />
              <Ligne label="Statut" valeur={dossier.status} />
              <Ligne label="Revenu mensuel" valeur={formaterMontant(dossier.monthly_income)} />
              <Ligne label="Charges mensuelles" valeur={formaterMontant(dossier.monthly_expenses)} />
            </div>

            <div className="border-t border-[#232733] pt-4 mb-2">
              <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Score de solvabilité</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Ligne label="Score total" valeur={dossier.credit_score?.toString() ?? "—"} />
                <Ligne label="Niveau de risque" valeur={dossier.risk_level ?? "—"} />
                <Ligne label="Situation professionnelle" valeur={dossier.profession_score?.toString() ?? "—"} />
                <Ligne label="Ancienneté" valeur={dossier.anciennete_score?.toString() ?? "—"} />
                <Ligne label="Capacité de remboursement" valeur={dossier.capacity_score?.toString() ?? "—"} />
                <Ligne label="Résidence" valeur={dossier.residence_score?.toString() ?? "—"} />
                <Ligne label="Historique Lotafinance" valeur={dossier.history_score?.toString() ?? "—"} />
                <Ligne label="Montant recommandé" valeur={formaterMontant(dossier.recommended_amount)} />
              </div>
            </div>

            {dossier.facilite_paiement && (scoreFaible || risqueEleve) && (
              <div className="flex items-start gap-2 bg-[#2A2312] border border-[#3A3013] rounded-md px-4 py-3 mt-4 text-[#C9A227] text-sm">
                {Ic("alert", "w-4 h-4 shrink-0 mt-0.5")}
                <span>
                  Ce client demande la facilité de paiement mais présente un {scoreFaible ? "score faible" : ""}
                  {scoreFaible && risqueEleve ? " et un " : ""}
                  {risqueEleve ? "risque élevé" : ""}. Vous pouvez tout de même l&apos;accorder si vous le jugez pertinent.
                </span>
              </div>
            )}
          </div>

          {/* Historique du client */}
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-1">Historique de ce client</h2>
            <p className="text-xs text-[#7C8494] mb-3">
              {pretsPrecedents.length === 0
                ? "Aucun autre dossier chez Lotafinance."
                : `${pretsPrecedents.length} autre${pretsPrecedents.length > 1 ? "s" : ""} dossier${pretsPrecedents.length > 1 ? "s" : ""} (tous statuts confondus)`}
            </p>
            {pretsPrecedents.length > 0 && (
              <div className="space-y-2">
                {pretsPrecedents.map((p) => {
                  const couleur = couleurStatut(p.status);
                  return (
                    <div key={p.id} className="flex items-center justify-between border border-[#232733] rounded-md p-3">
                      <div>
                        <p className="text-sm font-mono text-[#E8E6DE]">
                          {formaterMontant(p.amount_requested)} — {p.duration_weeks} sem.
                        </p>
                        <p className="text-xs text-[#7C8494] mt-0.5">Demandé le {formaterDate(p.submitted_at)}</p>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: couleur.bg, color: couleur.text }}
                      >
                        {LIBELLES_STATUT[p.status] || p.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {journal.length > 0 && (
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
              <h2 className="text-sm font-medium text-[#E8E6DE] mb-3 flex items-center gap-2">{Ic("history", "w-4 h-4")} Journal des décisions</h2>
              <div className="space-y-2">
                {journal.map((j) => (
                  <div key={j.id} className="border border-[#232733] rounded-md p-3 text-sm">
                    <p className="text-[#E8E6DE]">
                      {j.ancien_statut ? `${LIBELLES_STATUT[j.ancien_statut] || j.ancien_statut} → ` : ""}
                      <strong>{LIBELLES_STATUT[j.nouveau_statut] || j.nouveau_statut}</strong>
                    </p>
                    <p className="text-xs text-[#7C8494] mt-0.5">
                      {formaterDate(j.cree_le)} — {j.analyst_email ? `par ${j.analyst_email}` : "décision automatique du système"}
                    </p>
                    {j.commentaire && <p className="text-xs text-[#B8BAC4] mt-1 italic">&quot;{j.commentaire}&quot;</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {dossier.status === "approuve" && (
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
              <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Rentabilité de ce prêt</h2>
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <Ligne label="Capital versé au client" valeur={formaterMontant(Math.max(capital - FRAIS_DE_TRAITEMENT, 0))} />
                <Ligne label="Frais de traitement encaissés" valeur={formaterMontant(FRAIS_DE_TRAITEMENT)} />
                <Ligne label="Intérêts prévus" valeur={formaterMontant(interetsPrevus)} />
                <Ligne label="Déjà encaissé (échéances)" valeur={formaterMontant(dejaEncaisse)} />
                <Ligne label="Reste à percevoir" valeur={formaterMontant(resteAPercevoir)} />
                <Ligne label="Bénéfice net estimé (à terme)" valeur={formaterMontant(interetsPrevus + FRAIS_DE_TRAITEMENT)} />
                <Ligne label="Risque de perte actuel" valeur={formaterMontant(resteAPercevoir)} />
              </div>
              <p className="text-[11px] text-[#5A6070] mt-3">
                Estimation basée sur les échéances confirmées. Le bénéfice inclut les {formaterMontant(FRAIS_DE_TRAITEMENT)} de frais de
                traitement, encaissés dès le déboursement. Le risque de perte suppose que le client cesse tout remboursement à partir de maintenant.
              </p>
            </div>
          )}

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Documents fournis</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-[#5A6070]">Aucun document envoyé par ce client.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border border-[#232733] rounded-md p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#E8E6DE]">{LIBELLES_DOCUMENTS[doc.document_type] || doc.document_type}</p>
                      <p className="text-xs text-[#7C8494] truncate">{doc.original_file_name}</p>
                    </div>
                    <button onClick={() => gererTelechargement(doc)} className="shrink-0 text-sm font-medium text-[#C9A227] hover:text-[#DDB63A] underline">
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {dossier.status === "approuve" && echeances.length > 0 && (
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
              <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Échéances — confirmation de paiement</h2>
              <p className="text-xs text-[#7C8494] mb-3">
                Confirmez uniquement après avoir vérifié que le paiement a bien été reçu.
              </p>
              <div className="space-y-2">
                {echeances.map((e) => {
                  const retard = estEnRetard(e);
                  const jours = retard ? joursDeRetard(e) : 0;
                  const critique = retard && jours >= SEUIL_RETARD_CRITIQUE;
                  return (
                    <div
                      key={e.id}
                      className={`flex items-center justify-between border rounded-md p-3 ${
                        critique ? "border-[#7A2E2E] bg-[#2A0D0D]" : retard ? "border-[#4A2222] bg-[#1A0F0F]" : "border-[#232733]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-mono text-[#E8E6DE]">
                          Mensualité {e.numero} — {formaterMontant(e.montant)}
                        </p>
                        <p className={`text-xs mt-0.5 ${critique ? "text-[#FFB3B3] font-medium" : retard ? "text-[#F0A0A0]" : "text-[#7C8494]"}`}>
                          {e.payee
                            ? `Confirmée le ${formaterDate(e.payee_le)}`
                            : retard
                            ? `En retard de ${jours} jour${jours > 1 ? "s" : ""} — échéance du ${formaterDate(e.date_echeance)}${critique ? " ⚠️ critique" : ""}`
                            : `Échéance : ${formaterDate(e.date_echeance)}`}
                        </p>
                      </div>
                      {e.payee ? (
                        <span className="text-[#3DDC97] font-medium text-sm">✓ Confirmée</span>
                      ) : (
                        <button
                          onClick={() => gererConfirmationPaiement(e.id)}
                          disabled={confirmationEnCours === e.id}
                          className="shrink-0 bg-[#1E4A3D] text-[#3DDC97] border border-[#2A6B57] text-sm font-medium px-3 py-1.5 rounded-md hover:bg-[#245A49] transition disabled:opacity-50"
                        >
                          {confirmationEnCours === e.id ? "..." : "Confirmer le paiement"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!dejaDecide ? (
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
              <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Décision</h2>

              {dossier.credit_score != null && dossier.credit_score < 80 && (
                <div
                  className={`flex items-start gap-2 rounded-md px-4 py-3 mb-4 text-sm ${
                    dossier.credit_score < 60
                      ? "bg-[#2A1414] border border-[#4A2222] text-[#F0A0A0]"
                      : "bg-[#1B1706] border border-[#3A3013] text-[#C9A227]"
                  }`}
                >
                  {Ic("alert", "w-4 h-4 shrink-0 mt-0.5")}
                  <span>
                    {dossier.credit_score < 60
                      ? `Score faible (${dossier.credit_score}/100) : profil fragile, aucune décision automatique n'a été prise. `
                      : `Score moyen (${dossier.credit_score}/100) : ni approuvé ni refusé automatiquement. `}
                    Le dossier est laissé à ton appréciation — tu peux refuser, demander des infos, ou approuver un montant réduit
                    (voir le montant recommandé ci-dessus) plutôt que le montant demandé en entier, pour laisser une chance au client de construire un historique.
                  </span>
                </div>
              )}

              <div className="mb-3">
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Montant à approuver (F)</label>
                <input type="number" min={0} value={montantApprouve} onChange={(e) => setMontantApprouve(e.target.value)} className={CHAMP_CLASSES} />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Commentaire (optionnel)</label>
                <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} className={CHAMP_CLASSES} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => gererDecision("approuve")}
                  disabled={decisionEnCours}
                  className="flex-1 bg-[#1E4A3D] text-[#3DDC97] border border-[#2A6B57] text-sm font-medium py-2.5 rounded-md hover:bg-[#245A49] transition disabled:opacity-50"
                >
                  {decisionEnCours ? "..." : "Approuver"}
                </button>
                <button
                  onClick={() => gererDecision("infos_demandees")}
                  disabled={decisionEnCours}
                  className="flex-1 bg-[#2A2312] text-[#C9A227] border border-[#3A3013] text-sm font-medium py-2.5 rounded-md hover:bg-[#332A16] transition disabled:opacity-50"
                >
                  {decisionEnCours ? "..." : "Demander des infos"}
                </button>
                <button
                  onClick={() => gererDecision("refuse")}
                  disabled={decisionEnCours}
                  className="flex-1 bg-[#4A2222] text-[#F0A0A0] border border-[#6B2E2E] text-sm font-medium py-2.5 rounded-md hover:bg-[#5A2828] transition disabled:opacity-50"
                >
                  {decisionEnCours ? "..." : "Refuser"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
              <p className="text-sm text-[#B8BAC4]">
                Ce dossier a déjà été traité : <strong className="text-[#E8E6DE]">{dossier.status}</strong>
                {dossier.decision_reason ? ` — ${dossier.decision_reason}` : ""}
              </p>
            </div>
          )}

          {/* Zone de suppression — réservée aux admins */}
          {monRole === "admin" && (
            <div className="bg-[#1A0F0F] border border-[#4A2222] rounded-lg p-6">
              <h2 className="text-sm font-medium text-[#F0A0A0] mb-2 flex items-center gap-2">{Ic("trash", "w-4 h-4")} Zone sensible</h2>
              {!demandeSuppression ? (
                <>
                  <p className="text-xs text-[#B8BAC4] mb-3">
                    Supprime définitivement ce dossier, son score et ses échéances. Action irréversible.
                  </p>
                  <button
                    onClick={gererSuppression}
                    className="text-sm font-medium text-[#F0A0A0] border border-[#6B2E2E] rounded-md px-4 py-2 hover:bg-[#2A1414] transition"
                  >
                    Supprimer ce dossier
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#F0A0A0] mb-3 font-medium">
                    Es-tu sûr ? Cette action est définitive et ne peut pas être annulée.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={gererSuppression}
                      disabled={suppressionEnCours}
                      className="bg-[#4A2222] text-[#F0A0A0] border border-[#6B2E2E] text-sm font-medium px-4 py-2 rounded-md hover:bg-[#5A2828] transition disabled:opacity-50"
                    >
                      {suppressionEnCours ? "Suppression..." : "Oui, supprimer définitivement"}
                    </button>
                    <button
                      onClick={() => setDemandeSuppression(false)}
                      disabled={suppressionEnCours}
                      className="text-sm font-medium text-[#7C8494] border border-[#232733] px-4 py-2 rounded-md hover:bg-[#12151C] transition"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-[#7C8494] text-xs">{label}</p>
      <p className="font-medium text-[#E8E6DE] font-mono">{valeur}</p>
    </div>
  );
}
