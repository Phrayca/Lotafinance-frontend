"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirConversations,
  obtenirFicheClient,
  obtenirPretsDuClient,
  obtenirDocumentsDuClient,
  telechargerDocument,
  verifierIdentiteClient,
  rejeterIdentiteClient,
  supprimerCompteClient,
  urlPhotoDeProfil,
  obtenirPlafondClient,
  obtenirAlertesFraudeClient,
  ClientDetail,
  LoanOut,
  DocumentClient,
  Plafond,
  AlerteFraude,
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
  NiveauBadge,
  NiveauCode,
} from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

type Utilisateur = { id: string; email: string; role: string };

const LIBELLES_STATUT: Record<string, string> = {
  soumis: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
  infos_demandees: "Infos demandées",
};

const LIBELLES_DOCUMENTS: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  carte_residence: "Carte de résidence",
  contrat_travail: "Contrat de travail",
  certificat_travail: "Certificat de travail",
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
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.7-1.6L13.4 2h-2.8l-.4 2.8a7 7 0 0 0-2.7 1.6l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.06 1 .2 1.6l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.7 1.6l.4 2.8h2.8l.4-2.8a7 7 0 0 0 2.7-1.6l2.3.9 2-3.4-2-1.5c.14-.5.2-1 .2-1.6Z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01",
  history: "M3 3v5h5 M3.05 13a9 9 0 1 0 2.13-7.36L3 8",
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  loans: "M7 4h10v16l-5-3-5 3V4Z M9 9h6 M9 12h6",
  mail: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  calendarCheck: "M4 6h16v14H4V6Z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  chevronDown: "M6 9l6 6 6-6",
  idCheck: "M4 4h16v16H4V4Z M8 9h1 M8 12h1 M12 9h4 M12 12h4 M8 16l1.5 1.5L12 15",
  idX: "M4 4h16v16H4V4Z M8 9h1 M8 12h1 M12 9h4 M12 12h4 M8.5 15.5l3 3 M11.5 15.5l-3 3",
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
  { href: "/analyste/clients", label: "Clients", icone: "users" as const, actif: true },
  { href: "/analyste/analyse-scoring", label: "Analyse & Scoring", icone: "target" as const },
  { href: "/analyste/rapports", label: "Rapports & Statistiques", icone: "chart" as const },
  { href: "/analyste/audit", label: "Audit & Logs", icone: "history" as const },
  { href: "/analyste/parametres", label: "Paramètres", icone: "gear" as const },
  { href: "/analyste/utilisateurs", label: "Gestion des utilisateurs", icone: "users" as const },
  { href: "/analyste/messages", label: "Messages", icone: "mail" as const },
  { href: "/analyste/profil", label: "Mon profil", icone: "user" as const },
];

export default function PageFicheClient() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [totalNonLus, setTotalNonLus] = useState(0);

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [plafond, setPlafond] = useState<Plafond | null>(null);
  const [alertesFraude, setAlertesFraude] = useState<AlerteFraude[]>([]);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  const [texteConfirmationSuppression, setTexteConfirmationSuppression] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [prets, setPrets] = useState<LoanOut[]>([]);
  const [documents, setDocuments] = useState<DocumentClient[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [verificationEnCours, setVerificationEnCours] = useState(false);
  const [motifRejetOuvert, setMotifRejetOuvert] = useState(false);
  const [motifRejet, setMotifRejet] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    (async () => {
      try {
        const profil = await recupererMonProfilUtilisateur(token);
        if (profil.role !== "analyste" && profil.role !== "admin") {
          router.push("/tableau-de-bord");
          return;
        }
        setUtilisateur(profil);
        setAvatarUrl(urlPhotoDeProfil(profil.id));

        const fiche = await obtenirFicheClient(token, clientId);
        setClient(fiche);

        const [listePrets, listeDocs, plafondClient] = await Promise.all([
          obtenirPretsDuClient(token, clientId),
          obtenirDocumentsDuClient(token, clientId),
          obtenirPlafondClient(token, clientId).catch(() => null),
        ]);
        setPrets(listePrets);
        setDocuments(listeDocs);
        setPlafond(plafondClient);

        obtenirAlertesFraudeClient(token, clientId).then(setAlertesFraude).catch(() => {});
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    obtenirConversations(token)
      .then((liste) => setTotalNonLus(liste.reduce((s, c) => s + c.non_lus, 0)))
      .catch(() => {});

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
  }, [router, clientId]);

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

  function gererRecherche(e: React.FormEvent) {
    e.preventDefault();
    if (recherche.trim()) router.push(`/analyste/recherche?q=${encodeURIComponent(recherche.trim())}`);
  }

  async function gererVerification() {
    const token = localStorage.getItem("token");
    if (!token || !client) return;
    setVerificationEnCours(true);
    try {
      const resultat = await verifierIdentiteClient(token, client.id);
      setClient({ ...client, identity_verified: resultat.identity_verified, identity_rejected: resultat.identity_rejected, identity_rejection_reason: resultat.identity_rejection_reason });
      setMotifRejetOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la vérification");
    } finally {
      setVerificationEnCours(false);
    }
  }

  async function gererRejet() {
    const token = localStorage.getItem("token");
    if (!token || !client) return;
    if (!motifRejet.trim()) {
      setErreur("Merci d'indiquer un motif de rejet.");
      return;
    }
    setVerificationEnCours(true);
    try {
      const resultat = await rejeterIdentiteClient(token, client.id, motifRejet.trim());
      setClient({ ...client, identity_verified: resultat.identity_verified, identity_rejected: resultat.identity_rejected, identity_rejection_reason: resultat.identity_rejection_reason });
      setMotifRejetOuvert(false);
      setMotifRejet("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors du rejet");
    } finally {
      setVerificationEnCours(false);
    }
  }

  async function gererSuppressionCompte() {
    const token = localStorage.getItem("token");
    if (!token || !client || texteConfirmationSuppression !== "SUPPRIMER") return;

    setErreur("");
    setSuppressionEnCours(true);
    try {
      await supprimerCompteClient(token, client.id);
      router.push("/analyste/clients");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la suppression du compte");
    } finally {
      setSuppressionEnCours(false);
    }
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

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  if (!client) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#F0A0A0]">{erreur || "Client introuvable"}</p>
      </main>
    );
  }

  const pretsApprouves = prets.filter((p) => p.status === "approuve");
  const capitalTotal = pretsApprouves.reduce((s, p) => s + (p.approved_amount ?? p.amount_requested), 0);
  const dernierScore = prets.find((p) => p.credit_score != null)?.credit_score;
  const dernierRisque = prets.find((p) => p.risk_level != null)?.risk_level;

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

          <button onClick={() => router.push("/analyste/clients")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
            ← Retour aux clients
          </button>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {alertesFraude.length > 0 && (
            <div className="bg-[#2A1414] border border-[#4A2222] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#F0A0A0] flex items-center gap-2 mb-2">
                ⚠️ Alerte fraude potentielle
              </p>
              <ul className="space-y-1.5">
                {alertesFraude.map((a, i) => (
                  <li key={i} className="text-xs text-[#F0A0A0] flex items-start gap-1.5">
                    <span className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${a.gravite === "elevee" ? "bg-[#F0A0A0]" : "bg-[#C9A227]"}`} />
                    {a.message}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-[#8A6060] mt-2">Ces signaux n&apos;empêchent aucune action — ils t&apos;invitent à vérifier manuellement avant de décider.</p>
            </div>
          )}

          {/* Identité + infos principales */}
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
              <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">{client.first_name} {client.last_name}</h1>
              <div className="flex items-center gap-2">
                {plafond && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                    style={{ backgroundColor: couleurNiveau(plafond.niveau_code).bg, color: couleurNiveau(plafond.niveau_code).text }}
                    title={`${plafond.nombre_prets_reussis} prêt(s) remboursé(s) avec succès`}
                  >
                    <NiveauBadge niveau={plafond.niveau_code as NiveauCode} size={16} /> Niveau {plafond.niveau_libelle}
                  </span>
                )}
                {client.identity_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-full px-2.5 py-1">
                    {Ic("idCheck", "w-3.5 h-3.5")} Identité vérifiée
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${client.identity_rejected ? "text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222]" : "text-[#C9A227] bg-[#1B1706] border border-[#3A3013]"}`}>
                    {Ic(client.identity_rejected ? "idX" : "idCheck", "w-3.5 h-3.5")} {client.identity_rejected ? "Identité rejetée" : "Identité en attente"}
                  </span>
                )}
                {!client.identity_verified && (
                  <button onClick={gererVerification} disabled={verificationEnCours} className="text-xs font-medium text-[#3DDC97] border border-[#2A6B57] rounded-full px-2.5 py-1 hover:bg-[#0F2420] transition disabled:opacity-50">
                    Vérifier
                  </button>
                )}
                {!client.identity_rejected && (
                  <button onClick={() => setMotifRejetOuvert((v) => !v)} disabled={verificationEnCours} className="text-xs font-medium text-[#F0A0A0] border border-[#6B2E2E] rounded-full px-2.5 py-1 hover:bg-[#2A1414] transition disabled:opacity-50">
                    Rejeter
                  </button>
                )}
              </div>
            </div>
            {client.identity_rejected && client.identity_rejection_reason && (
              <p className="text-xs text-[#F0A0A0] mb-2">Motif du rejet : {client.identity_rejection_reason}</p>
            )}
            {motifRejetOuvert && (
              <div className="flex gap-2 mb-3">
                <input
                  value={motifRejet}
                  onChange={(e) => setMotifRejet(e.target.value)}
                  placeholder="Motif du rejet (ex: photo illisible)"
                  className="flex-1 bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-1.5 text-xs text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
                />
                <button onClick={gererRejet} disabled={verificationEnCours} className="text-xs font-medium bg-[#4A2222] text-[#F0A0A0] border border-[#6B2E2E] rounded-md px-3 py-1.5 hover:bg-[#5A2828] transition disabled:opacity-50">
                  Confirmer
                </button>
              </div>
            )}
            <p className="text-[#7C8494] text-sm mb-1 font-mono">{client.phone} · {client.email}</p>
            {plafond && plafond.plafond != null && (
              <p className="text-xs text-[#7C8494] mb-5">
                Plafond actuel : <span className="text-[#C9A227] font-medium">{formaterMontant(plafond.plafond)}</span> ({plafond.nombre_prets_reussis} prêt{plafond.nombre_prets_reussis > 1 ? "s" : ""} remboursé{plafond.nombre_prets_reussis > 1 ? "s" : ""} avec succès)
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm border-t border-[#232733] pt-4">
              <Champ label="Adresse" valeur={client.address || "—"} />
              <Champ label="Date de naissance" valeur={formaterDate(client.birth_date)} />
              <Champ label="Numéro de pièce d'identité" valeur={client.national_id_number || "—"} />
              <Champ label="Client depuis" valeur={formaterDate(client.created_at)} />
              <Champ label="Profession" valeur={client.profession || "—"} />
              <Champ label="Employeur" valeur={client.employer || "—"} />
              <Champ label="Type d'emploi" valeur={client.employment_type || "—"} />
              <Champ label="Ancienneté" valeur={client.activity_seniority_months != null ? `${client.activity_seniority_months} mois` : "—"} />
              <Champ label="Revenu mensuel" valeur={formaterMontant(client.monthly_income)} />
              <Champ label="Charges mensuelles" valeur={formaterMontant(client.monthly_expenses)} />
            </div>
          </div>

          {/* Résumé solvabilité */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
              <p className="text-xs text-[#7C8494] mb-1">Dernier score</p>
              <p className="text-lg font-mono font-medium text-[#E8E6DE]">{dernierScore ?? "—"}</p>
            </div>
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
              <p className="text-xs text-[#7C8494] mb-1">Dernier risque</p>
              <p className="text-lg font-medium text-[#E8E6DE]">{dernierRisque ?? "—"}</p>
            </div>
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
              <p className="text-xs text-[#7C8494] mb-1">Capital emprunté (approuvé)</p>
              <p className="text-lg font-mono font-medium text-[#C9A227]">{formaterMontant(capitalTotal)}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Documents fournis</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-[#5A6070]">Aucun document envoyé.</p>
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

          {/* Historique des prêts */}
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-1">Historique des prêts</h2>
            <p className="text-xs text-[#7C8494] mb-3">{prets.length} dossier{prets.length > 1 ? "s" : ""} au total</p>
            {prets.length === 0 ? (
              <p className="text-sm text-[#5A6070]">Aucun dossier pour ce client.</p>
            ) : (
              <div className="space-y-2">
                {prets.map((p) => {
                  const couleur = couleurStatut(p.status);
                  return (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/analyste/${p.id}`)}
                      className="w-full text-left border border-[#232733] rounded-md p-3 hover:border-[#3A4050] transition flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-mono text-[#E8E6DE]">{formaterMontant(p.amount_requested)} — {formaterDuree(p.duration_weeks)}</p>
                        <p className="text-xs text-[#7C8494] mt-0.5">Demandé le {formaterDate(p.submitted_at)}</p>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                        {LIBELLES_STATUT[p.status] || p.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {utilisateur?.role === "admin" && (
            <div className="bg-[#2A1414] border border-[#4A2222] rounded-lg p-6 mt-4">
              <h2 className="text-sm font-semibold text-[#F0A0A0] mb-1">Zone sensible — réservée aux admins</h2>
              <p className="text-xs text-[#B8807E] mb-4">
                Supprime définitivement ce compte client et toutes ses données (profil, prêts, documents, messages).
                Contrairement à l&apos;auto-suppression du client, ceci fonctionne même avec un prêt en cours — à
                utiliser uniquement pour un compte confirmé frauduleux.
              </p>

              {!confirmationSuppressionOuverte ? (
                <button
                  onClick={() => setConfirmationSuppressionOuverte(true)}
                  className="text-sm font-medium text-[#F0A0A0] border border-[#6B2E2E] rounded-md px-4 py-2 hover:bg-[#3A1A1A] transition"
                >
                  Supprimer ce compte
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
                      onClick={() => { setConfirmationSuppressionOuverte(false); setTexteConfirmationSuppression(""); }}
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

function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-[#7C8494] text-xs">{label}</p>
      <p className="font-medium text-[#E8E6DE]">{valeur}</p>
    </div>
  );
}
