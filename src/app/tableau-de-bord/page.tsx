"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  recupererMonProfilUtilisateur,
  obtenirMonProfilClient,
  obtenirMesDemandesDePret,
  obtenirEcheances,
  obtenirMesMessagesAssistance,
  obtenirMonPlafond,
  obtenirMesTickets,
  LoanOut,
  Echeance,
  ProfilClient,
  MessageAssistance,
  Plafond,
  Ticket,
} from "@/lib/api";
import {
  HomeIcon,
  LoanIcon,
  LoanRequestIcon,
  RepaymentIcon,
  DocumentIcon,
  ProfileIcon,
  SupportIcon,
  SimulatorIcon,
  ReferralIcon,
  IconCircle,
  NiveauBadge,
  NiveauCode,
  CouleurLotafinance,
} from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

type Utilisateur = { id: string; email: string; role: string; created_at?: string };

const LIBELLES_STATUT: Record<string, string> = {
  soumis: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
  infos_demandees: "Infos demandées",
};

function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "approuve") return { bg: "rgba(63,168,115,0.12)", text: "#3fa873" };
  if (statut === "refuse") return { bg: "rgba(192,86,59,0.12)", text: "#c0563b" };
  return { bg: "#2A2312", text: "#c99a4b" };
}

function formaterMontant(montant?: number | null) {
  if (montant == null) return "—";
  return `${montant.toLocaleString("fr-FR")} F`;
}

function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------- Icônes (traits fins, cohérentes) ---------- */
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
  calculator: "M5 3h14v18H5V3Z M8 7h8 M8 11h1 M11.5 11h1 M15 11h1 M8 14h1 M11.5 14h1 M15 14h1 M8 17h1 M11.5 17h1 M15 17h1",
  plus: "M12 5v14M5 12h14",
  calendarCheck: "M4 6h16v14H4V6Z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.7-1.6L13.4 2h-2.8l-.4 2.8a7 7 0 0 0-2.7 1.6l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.06 1 .2 1.6l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.7 1.6l.4 2.8h2.8l.4-2.8a7 7 0 0 0 2.7-1.6l2.3.9 2-3.4-2-1.5c.14-.5.2-1 .2-1.6Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
  headset: "M4 13v-1a8 8 0 0 1 16 0v1 M4 13v4a2 2 0 0 0 2 2h1v-7H5a1 1 0 0 0-1 1Z M20 13v4a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Z",
  expand: "M9 4H4v5 M15 4h5v5 M9 20H4v-5 M15 20h5v-5",
  coins: "M12 8a5 2.4 0 1 0 0 4.8 5 2.4 0 0 0 0-4.8Z M7 10.4V15c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4v-4.6",
  wallet: "M3 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z M3 7l2-3h10l2 3 M16 13h3v3h-3a1.5 1.5 0 0 1 0-3Z",
  layers: "M12 3 3 8l9 5 9-5-9-5Z M3 13l9 5 9-5 M3 8l9 5 9-5",
  chevronRight: "M9 5l7 7-7 7",
  check: "M5 12l4 4 10-10",
  percent: "M19 5 5 19 M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  chevronLeft: "M15 5l-7 7 7 7",
  gift: "M20 12v10H4V12 M2 7h20v5H2V7Z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z",
  alert: "M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  faq: "M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-1.5 1.3-1.5 2.7 M12 17h.01",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

// Correspondance entre les anciennes clés d'icônes (menu, actions rapides) et les
// nouveaux composants illustrés de src/components/icons.tsx
const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  loans: LoanIcon,
  plus: LoanRequestIcon,
  calendarCheck: RepaymentIcon,
  document: DocumentIcon,
  user: ProfileIcon,
  headset: SupportIcon,
  calculator: SimulatorIcon,
  gift: ReferralIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "blue", "purple", "green", "red", "orange"];

/* ---------- Anneau de progression ---------- */
function AnneauProgression({ pourcentage }: { pourcentage: number }) {
  const rayon = 52;
  const circonference = 2 * Math.PI * rayon;
  const decalage = circonference * (1 - Math.min(pourcentage, 100) / 100);
  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={rayon} fill="none" stroke="#212a35" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={rayon} fill="none" stroke="#c99a4b" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circonference} strokeDashoffset={decalage}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-mono font-semibold text-[#eef1f4]">{pourcentage}%</span>
        <span className="text-[10px] text-[#8e99a8] text-center leading-tight mt-1">Déjà<br />remboursé</span>
      </div>
    </div>
  );
}

// Frais de traitement fixes, prélevés une seule fois sur le montant versé (n'affectent pas le total à rembourser)
const FRAIS_DE_TRAITEMENT = 1000;

const NIVEAUX = [
  { code: "bronze", libelle: "Bronze", emoji: "🟢", couleur: "#3fa873" },
  { code: "argent", libelle: "Argent", emoji: "🟣", couleur: "#C9A6F0" },
  { code: "or", libelle: "Or", emoji: "🟡", couleur: "#c99a4b" },
  { code: "platine", libelle: "Platine", emoji: "💎", couleur: "#7DD3FC" },
];

function couleurNiveau(code: string): { bg: string; text: string } {
  if (code === "platine") return { bg: "#1B2A3A", text: "#7DD3FC" };
  if (code === "or") return { bg: "#2A2312", text: "#c99a4b" };
  if (code === "argent") return { bg: "#241B33", text: "#C9A6F0" };
  return { bg: "rgba(63,168,115,0.12)", text: "#3fa873" }; // bronze
}

function prochainNiveau(code: string): { code: NiveauCode; libelle: string; emoji: string; seuil: number } | null {
  if (code === "bronze") return { code: "argent", libelle: "Argent", emoji: "🟣", seuil: 3 };
  if (code === "argent") return { code: "or", libelle: "Or", emoji: "🟡", seuil: 6 };
  if (code === "or") return { code: "platine", libelle: "Platine", emoji: "💎", seuil: 10 };
  return null;
}

// Même formule que le backend (app/main.py : _plafond_prudentiel) — 10% au 1er prêt, 20% au 2e, 30% ensuite
function calculerPlafondPour(salaire: number, nombrePretsReussis: number) {
  if (nombrePretsReussis <= 0) return Math.round(salaire * 0.1);
  if (nombrePretsReussis === 1) return Math.round(salaire * 0.2);
  if (nombrePretsReussis === 2) return Math.round(salaire * 0.3);
  if (nombrePretsReussis <= 5) return Math.round(salaire * 0.4); // Argent
  if (nombrePretsReussis <= 10) return Math.round(salaire * 0.5); // Or
  return Math.round(salaire * 0.6); // Platine
}

const COULEURS_ICONES = ["#F4C95D", "#C9A6F0", "#8FD9A8", "#7DBEF0", "#F4A5C9", "#F4956D", "#F0D96A", "#9AD1E8", "#D9A6F0", "#8FE0C4"];

const LIENS_NAV = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icone: "home" as const, actif: true },
  { href: "/mes-demandes", label: "Mes prêts", icone: "loans" as const },
  { href: "/demande-pret", label: "Demande de prêt", icone: "plus" as const },
  { href: "/remboursements", label: "Mes remboursements", icone: "calendarCheck" as const },
  { href: "/documents", label: "Mes documents", icone: "document" as const },
  { href: "/profil", label: "Mon profil", icone: "user" as const },
];

// Clé localStorage utilisée pour retenir les échéances déjà vues dans la cloche de notifications
const CLE_ECHEANCES_VUES = "echeances_notif_vues";

export default function TableauDeBord() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [profilClient, setProfilClient] = useState<ProfilClient | null>(null);
  const [demandes, setDemandes] = useState<LoanOut[]>([]);
  const [echeancesParPret, setEcheancesParPret] = useState<Record<string, Echeance[]>>({});
  const [messages, setMessages] = useState<MessageAssistance[]>([]);
  const [mesTickets, setMesTickets] = useState<Ticket[]>([]);
  const [plafond, setPlafond] = useState<Plafond | null>(null);
  const [chargement, setChargement] = useState(true);
  const [notifOuvertes, setNotifOuvertes] = useState(false);
  const [echeancesVues, setEcheancesVues] = useState<string[]>([]);
  const [sidebarReduite, setSidebarReduite] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    // Charger la liste des échéances déjà vues (mémorisée dans le navigateur)
    const stocke = localStorage.getItem(CLE_ECHEANCES_VUES);
    if (stocke) {
      try {
        setEcheancesVues(JSON.parse(stocke));
      } catch {
        setEcheancesVues([]);
      }
    }

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");

    (async () => {
      try {
        const profil = await recupererMonProfilUtilisateur(token);
        setUtilisateur(profil);

        if (profil.role === "analyste" || profil.role === "admin") {
          router.push("/analyste");
          return;
        }
        if (profil.role === "support") {
          router.push("/support");
          return;
        }

        const [client, liste, messagesAssistance] = await Promise.all([
          obtenirMonProfilClient(token),
          obtenirMesDemandesDePret(token).catch(() => []),
          obtenirMesMessagesAssistance(token).catch(() => []),
        ]);
        setProfilClient(client);
        setDemandes(liste);
        setMessages(messagesAssistance);

        const approuvees = liste.filter((d) => d.status === "approuve");
        const entries = await Promise.all(
          approuvees.map(async (d) => [d.id, await obtenirEcheances(token, d.id).catch(() => [])] as const)
        );
        setEcheancesParPret(Object.fromEntries(entries));

        obtenirMonPlafond(token).then(setPlafond).catch(() => {});
        obtenirMesTickets(token).then(setMesTickets).catch(() => {});
      } catch {
        // Seule une vraie session invalide (ex: profil utilisateur introuvable) doit déconnecter.
        // Un profil client pas encore complété ne doit jamais éjecter l'utilisateur.
        localStorage.removeItem("token");
        router.push("/");
      } finally {
        setChargement(false);
      }
    })();
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

  function basculerPleinEcran() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  if (chargement || !utilisateur) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex flex-col items-center justify-center">
        <span className="w-16 h-16 rounded-2xl bg-[#c99a4b] flex items-center justify-center text-[#10151c] text-3xl font-bold font-['Sora',sans-serif] mb-4 animate-pulse">L</span>
        <p className="font-['Sora',sans-serif] text-xl text-[#eef1f4] mb-1">Bienvenue chez Lotafinance</p>
        <p className="text-xs text-[#8e99a8] font-mono">Chargement de votre espace...</p>
      </main>
    );
  }

  // ---- Le prêt "en cours" : le plus récent approuvé qui n'est pas totalement remboursé, sinon le plus récent approuvé ----
  const approuvees = demandes.filter((d) => d.status === "approuve");
  const pretEnCours =
    approuvees.find((d) => {
      const echeancesDuPret = echeancesParPret[d.id] || [];
      return echeancesDuPret.some((e) => !e.payee);
    }) || approuvees[0];

  const echeancesDuPretEnCours = pretEnCours ? echeancesParPret[pretEnCours.id] || [] : [];
  const totalEmprunte = pretEnCours?.approved_amount ?? pretEnCours?.amount_requested ?? 0;
  const totalARembourser = pretEnCours?.total_to_repay ?? 0;
  const totalRembourseDuPret = echeancesDuPretEnCours.filter((e) => e.payee).reduce((s, e) => s + e.montant, 0);
  const soldeRestant = Math.max(totalARembourser - totalRembourseDuPret, 0);
  const tauxProgression = totalARembourser > 0 ? Math.round((totalRembourseDuPret / totalARembourser) * 100) : 0;

  const echeancesNonPayeesDuPret = echeancesDuPretEnCours.filter((e) => !e.payee).sort((a, b) => a.date_echeance.localeCompare(b.date_echeance));
  const prochaine = echeancesNonPayeesDuPret[0];
  const echeancesPayeesCount = echeancesDuPretEnCours.filter((e) => e.payee).length;
  const echeancesTotalCount = echeancesDuPretEnCours.length;

  const tauxBase = pretEnCours?.facilite_paiement && pretEnCours.rate_percent_applied != null
    ? pretEnCours.rate_percent_applied - 10
    : pretEnCours?.rate_percent_applied;
  const libelleTaux = pretEnCours?.rate_percent_applied != null
    ? pretEnCours.facilite_paiement
      ? `${tauxBase}% + 10% (facilité)`
      : `${pretEnCours.rate_percent_applied}%`
    : "—";

  const derniereDemande = demandes[0];
  const dernierScore = demandes.find((d) => d.credit_score != null)?.credit_score ?? null;

  const derniereVisiteAssistance = typeof window !== "undefined" ? localStorage.getItem("assistance_derniere_vue") : null;
  const messagesNonLus = messages.filter(
    (m) => m.auteur === "support" && (!derniereVisiteAssistance || m.envoye_le > derniereVisiteAssistance)
  );

  const echeancesEnRetard = echeancesNonPayeesDuPret.filter((e) => new Date(e.date_echeance).getTime() < Date.now());
  const echeancesAVenir = echeancesNonPayeesDuPret.filter((e) => new Date(e.date_echeance).getTime() >= Date.now());

  // Une échéance ne compte dans le badge que si elle n'a pas déjà été vue (ouverte) par le client
  const echeancesNonVues = echeancesNonPayeesDuPret.filter((e) => !echeancesVues.includes(e.id));

  const ticketsAvecNouvelleReponse = mesTickets.filter((t) => {
    if (!t.dernier_message_agent_le) return false;
    const vu = typeof window !== "undefined" ? localStorage.getItem(`ticket_vu_${t.id}`) : null;
    return !vu || t.dernier_message_agent_le > vu;
  });

  const totalNotifications = messagesNonLus.length + echeancesNonVues.length + ticketsAvecNouvelleReponse.length;

  const nomComplet =
    profilClient?.first_name || profilClient?.last_name
      ? `${profilClient.first_name} ${profilClient.last_name}`.trim()
      : utilisateur.email.split("@")[0];

  function ouvrirAssistance() {
    router.push("/assistance");
  }

  // Ouvre/ferme la cloche. À l'ouverture, marque toutes les échéances ET tous les messages
  // actuellement listés comme "vus" afin qu'ils ne soient plus comptés dans le badge la
  // prochaine fois (les échéances restent visibles dans la liste tant qu'elles ne sont pas
  // payées, mais ne re-déclenchent plus le badge ; idem pour les messages déjà affichés ici).
  function ouvrirNotifications() {
    const nouvelEtat = !notifOuvertes;
    setNotifOuvertes(nouvelEtat);
    if (nouvelEtat && echeancesNonPayeesDuPret.length > 0) {
      const idsActuels = echeancesNonPayeesDuPret.map((e) => e.id);
      const fusion = Array.from(new Set([...echeancesVues, ...idsActuels]));
      setEcheancesVues(fusion);
      localStorage.setItem(CLE_ECHEANCES_VUES, JSON.stringify(fusion));
    }
    if (nouvelEtat && messagesNonLus.length > 0) {
      localStorage.setItem("assistance_derniere_vue", new Date().toISOString());
    }
    if (nouvelEtat && ticketsAvecNouvelleReponse.length > 0) {
      const maintenant = new Date().toISOString();
      ticketsAvecNouvelleReponse.forEach((t) => localStorage.setItem(`ticket_vu_${t.id}`, maintenant));
    }
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex">
      {/* Sidebar — visible seulement à partir de tablette/desktop */}
      <aside className={`hidden md:flex ${sidebarReduite ? "w-16" : "w-60"} shrink-0 border-r border-[rgba(255,255,255,0.08)] flex-col py-6 px-3 transition-all duration-200`}>
        <div className={`flex items-center gap-2 mb-8 ${sidebarReduite ? "justify-center px-0" : "px-2"}`}>
          <span className="w-9 h-9 rounded-lg bg-[#c99a4b] flex items-center justify-center text-[#10151c] font-bold font-['Sora',sans-serif] shrink-0">L</span>
          {!sidebarReduite && (
            <div>
              <p className="text-sm font-semibold text-[#eef1f4] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#8e99a8]">Votre partenaire financier</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {LIENS_NAV.map((lien, i) => (
            <button
              key={lien.label}
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
              {!sidebarReduite && lien.label}
            </button>
          ))}
        </nav>

        <button
          onClick={basculerSidebar}
          title={sidebarReduite ? "Déplier le menu" : "Réduire le menu"}
          className="w-full flex items-center justify-center gap-2 py-2 mb-1 rounded-md text-xs text-[#8e99a8] hover:bg-[#1a212b] hover:text-[#eef1f4] transition"
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

      {/* Contenu */}
      <div className="flex-1 px-4 py-4 md:px-8 md:py-6 overflow-x-auto max-w-full pb-24 md:pb-6">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="font-['Sora',sans-serif] text-lg sm:text-2xl text-[#eef1f4]">Bonjour {profilClient?.first_name || ""} 👋</h1>
            <p className="text-[#8e99a8] text-xs sm:text-sm mt-1">Voici l&apos;état de votre compte chez Lotafinance.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[#8e99a8] shrink-0">
            <div className="relative">
              <button
                onClick={ouvrirNotifications}
                className="relative hover:text-[#eef1f4] transition"
                title="Notifications"
              >
                {Ic("bell")}
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C24545] text-[8px] text-white flex items-center justify-center">
                    {totalNotifications}
                  </span>
                )}
              </button>

              {notifOuvertes && (
                <div className="absolute right-0 top-8 w-72 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl z-10 overflow-hidden">
                  <p className="text-xs font-medium text-[#8e99a8] uppercase tracking-wide px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
                    Notifications
                  </p>
                  <div className="max-h-72 overflow-y-auto">
                    {messagesNonLus.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setNotifOuvertes(false); router.push("/assistance"); }}
                        className="w-full text-left px-4 py-3 hover:bg-[#212a35] transition border-b border-[rgba(255,255,255,0.08)]"
                      >
                        <p className="text-xs text-[#c99a4b] font-medium">Nouveau message de Lotafinance</p>
                        <p className="text-xs text-[#8e99a8] truncate mt-0.5">{m.contenu || "Fichier envoyé"}</p>
                      </button>
                    ))}
                    {ticketsAvecNouvelleReponse.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setNotifOuvertes(false); router.push(`/reclamations/${t.id}`); }}
                        className="w-full text-left px-4 py-3 hover:bg-[#212a35] transition border-b border-[rgba(255,255,255,0.08)]"
                      >
                        <p className="text-xs text-[#5B8DEF] font-medium">Réponse à votre réclamation</p>
                        <p className="text-xs text-[#8e99a8] truncate mt-0.5">{t.sujet}</p>
                      </button>
                    ))}
                    {echeancesEnRetard.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => { setNotifOuvertes(false); router.push("/pret-en-cours"); }}
                        className="w-full text-left px-4 py-3 hover:bg-[#212a35] transition border-b border-[rgba(255,255,255,0.08)]"
                      >
                        <p className="text-xs text-[#c0563b] font-medium">Échéance en retard</p>
                        <p className="text-xs text-[#8e99a8] mt-0.5">{formaterMontant(e.montant)} — recouvrement à jour souhaité</p>
                      </button>
                    ))}
                    {echeancesAVenir.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => { setNotifOuvertes(false); router.push("/pret-en-cours"); }}
                        className="w-full text-left px-4 py-3 hover:bg-[#212a35] transition border-b border-[rgba(255,255,255,0.08)]"
                      >
                        <p className="text-xs text-[#c99a4b] font-medium">Échéance à venir</p>
                        <p className="text-xs text-[#8e99a8] mt-0.5">{formaterMontant(e.montant)} le {formaterDate(e.date_echeance)}</p>
                      </button>
                    ))}
                    {messagesNonLus.length === 0 && echeancesNonPayeesDuPret.length === 0 && (
                      <p className="text-xs text-[#66707d] text-center py-6">Aucune notification</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button onClick={ouvrirAssistance} className="hover:text-[#eef1f4] transition" title="Assistance">
              {Ic("headset")}
            </button>
            <button onClick={basculerPleinEcran} className="hover:text-[#eef1f4] transition" title="Plein écran">
              {Ic("expand")}
            </button>
            <button onClick={() => router.push("/profil")} className="hover:text-[#eef1f4] transition" title="Modifier mon profil">
              {Ic("gear")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            {/* Rappel d'échéance imminente */}
            {prochaine && (() => {
              const joursRestants = Math.ceil((new Date(prochaine.date_echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (joursRestants > 3 || joursRestants < 0) return null;
              return (
                <div className="bg-[rgba(201,154,75,0.15)] border border-[rgba(201,154,75,0.3)] rounded-lg px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-[#c99a4b] flex items-center gap-2">
                    {Ic("calendarCheck", "w-4 h-4")}
                    {joursRestants === 0
                      ? `Votre échéance de ${formaterMontant(prochaine.montant)} est due aujourd'hui.`
                      : `Votre échéance de ${formaterMontant(prochaine.montant)} arrive dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}.`}
                  </p>
                  <button onClick={() => router.push("/pret-en-cours")} className="text-xs font-semibold text-[#10151c] bg-[#c99a4b] px-3 py-1.5 rounded-md hover:bg-[#e4b565] transition shrink-0">
                    Voir le détail
                  </button>
                </div>
              );
            })()}

            {/* Hero : demander un prêt */}
            <div className="bg-gradient-to-br from-[rgba(201,154,75,0.15)] to-[#1a212b] border border-[rgba(201,154,75,0.3)] rounded-lg px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <IconCircle color="gold" size={44}><LoanRequestIcon size={22} /></IconCircle>
                <div>
                  <p className="text-sm font-semibold text-[#eef1f4]">Demander un prêt</p>
                  <p className="text-xs text-[#8e99a8]">Réalisez vos projets dès maintenant</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/demande-pret")}
                className="w-10 h-10 rounded-full bg-[#c99a4b] text-[#10151c] flex items-center justify-center hover:bg-[#e4b565] transition shrink-0"
                title="Faire une demande"
              >
                {Ic("chevronRight", "w-5 h-5")}
              </button>
            </div>

            {/* Nos offres de prêt */}
            <div>
              <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-2">Nos offres de prêt</p>
              <div className="grid grid-cols-3 gap-2">
                <OffreCard emoji="🏠" label="Projet immobilier" onClick={() => router.push("/demande-pret?motif=" + encodeURIComponent("Projet immobilier"))} />
                <OffreCard emoji="🚗" label="Achat véhicule" onClick={() => router.push("/demande-pret?motif=" + encodeURIComponent("Achat véhicule"))} />
                <OffreCard emoji="🎓" label="Formation" onClick={() => router.push("/demande-pret?motif=" + encodeURIComponent("Formation"))} />
              </div>
            </div>

            {/* Bannière simulateur */}
            <button
              onClick={() => router.push("/simulateur")}
              className="w-full flex items-center justify-between bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-4 py-3 hover:border-[rgba(255,255,255,0.16)] transition text-left"
            >
              <span className="text-sm text-[#8e99a8] flex items-center gap-2">{Ic("calculator", "w-4 h-4 text-[#c99a4b]")} Besoin d&apos;un montant spécifique ? Notre simulateur vous accompagne.</span>
              <span className="text-[#8e99a8] shrink-0">{Ic("chevronRight", "w-4 h-4")}</span>
            </button>

            {/* Compte */}
            <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-[#212a35] border border-[rgba(255,255,255,0.08)] text-[#c99a4b] flex items-center justify-center">
                  {Ic("user")}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#eef1f4] capitalize">{nomComplet}</p>
                  <p className="text-xs text-[#8e99a8]">
                    Client depuis le {utilisateur.created_at ? formaterDate(utilisateur.created_at) : "—"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#3fa873] bg-[rgba(63,168,115,0.12)] border border-[rgba(63,168,115,0.3)] rounded-full px-3 py-1 flex items-center gap-1">
                {Ic("check", "w-3 h-3")} Compte actif
              </span>
            </div>

            {/* Mon profil Lotafinance — gamification */}
            {plafond && (
              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-5 py-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex items-center gap-3">
                    <NiveauBadge niveau={plafond.niveau_code as NiveauCode} size={56} />
                    <div>
                      <p className="text-xs text-[#8e99a8]">Mon profil Lotafinance</p>
                      <p className="text-lg font-semibold" style={{ color: couleurNiveau(plafond.niveau_code).text }}>
                        Niveau {plafond.niveau_libelle}
                      </p>
                      <p className="text-xs text-[#8e99a8] mt-0.5">
                        {plafond.nombre_prets_reussis} prêt{plafond.nombre_prets_reussis > 1 ? "s" : ""} remboursé{plafond.nombre_prets_reussis > 1 ? "s" : ""} avec succès
                        {" · "}
                        {plafond.a_eu_un_retard ? "avec un retard signalé" : "sans aucun retard"}
                      </p>
                    </div>
                  </div>

                  {dernierScore != null && (
                    <div className="text-right">
                      <p className="text-xs text-[#8e99a8]">Score Lotafinance</p>
                      <p className="text-2xl font-mono font-semibold text-[#eef1f4]">{dernierScore}<span className="text-sm text-[#66707d]">/100</span></p>
                      <p className="text-xs mt-0.5" style={{ color: dernierScore >= 80 ? "#3fa873" : dernierScore >= 60 ? "#c99a4b" : "#c0563b" }}>
                        {dernierScore >= 80 ? "Excellent" : dernierScore >= 60 ? "Bon" : "À améliorer"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Parcours des niveaux */}
                <div className="flex items-center gap-1.5 mb-4">
                  {NIVEAUX.map((n, i) => {
                    const estAtteint = NIVEAUX.findIndex((x) => x.code === plafond.niveau_code) >= i;
                    return (
                      <div
                        key={n.code}
                        className="flex-1 h-1.5 rounded-full"
                        style={{ backgroundColor: estAtteint ? n.couleur : "#212a35" }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-[#8e99a8] mb-4 -mt-3">
                  {NIVEAUX.map((n) => (
                    <span key={n.code} className={`flex items-center gap-1 ${plafond.niveau_code === n.code ? "font-semibold" : ""}`} style={plafond.niveau_code === n.code ? { color: n.couleur } : undefined}>
                      <NiveauBadge niveau={n.code as NiveauCode} size={14} /> {n.libelle}
                    </span>
                  ))}
                </div>

                {/* Prochain niveau + plafond */}
                {(() => {
                  const prochain = prochainNiveau(plafond.niveau_code);
                  const salaire = profilClient?.monthly_income ?? 0;
                  const plafondActuel = plafond.plafond ?? 0;
                  const plafondSuivant = salaire > 0 ? calculerPlafondPour(salaire, plafond.nombre_prets_reussis + 1) : 0;
                  const augmentationPossible = plafondSuivant > plafondActuel;
                  const pourcentage = plafondActuel > 0 ? Math.round(((plafondSuivant - plafondActuel) / plafondActuel) * 100) : 0;

                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-3">
                        <p className="text-xs text-[#8e99a8] mb-1">Prochain niveau</p>
                        {prochain ? (
                          <>
                            <p className="text-sm font-medium text-[#eef1f4] flex items-center gap-1.5"><NiveauBadge niveau={prochain.code} size={16} /> {prochain.libelle}</p>
                            <p className="text-[11px] text-[#8e99a8] mt-0.5">
                              Encore {prochain.seuil - plafond.nombre_prets_reussis} prêt{prochain.seuil - plafond.nombre_prets_reussis > 1 ? "s" : ""} remboursé{prochain.seuil - plafond.nombre_prets_reussis > 1 ? "s" : ""}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-[#7DD3FC] flex items-center gap-1.5"><NiveauBadge niveau="platine" size={16} /> Niveau maximum atteint</p>
                        )}
                      </div>
                      <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-3">
                        <p className="text-xs text-[#8e99a8] mb-1">Votre plafond de prêt</p>
                        {salaire > 0 ? (
                          <>
                            <p className="text-sm font-medium text-[#eef1f4]">{formaterMontant(plafondActuel)}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: augmentationPossible ? "#3fa873" : "#8e99a8" }}>
                              {augmentationPossible ? `↑ ${formaterMontant(plafondSuivant)} au prochain prêt réussi (+${pourcentage}%)` : "Plafond maximum atteint (niveau Platine, 60% du salaire)"}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-[#66707d]">Renseignez votre revenu mensuel pour voir votre plafond</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-[rgba(255,255,255,0.08)] mt-4 pt-3">
                  <p className="text-[11px] text-[#8e99a8] mb-2">Vos avantages actuels — Niveau {plafond.niveau_libelle}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[#8e99a8] mb-3">
                    <span className="flex items-center gap-1">{Ic("check", "w-3 h-3 text-[#3fa873]")} Plafond de {plafond.plafond ? `${Math.round((plafond.plafond / (profilClient?.monthly_income || 1)) * 100)}%` : "10-30%"} de votre salaire</span>
                    <span className="flex items-center gap-1">{Ic("check", "w-3 h-3 text-[#3fa873]")} Reconnaissance de votre fiabilité</span>
                    {plafond.niveau_code !== "bronze" && (
                      <span className="flex items-center gap-1">{Ic("check", "w-3 h-3 text-[#3fa873]")} Badge {plafond.niveau_libelle} visible sur votre profil</span>
                    )}
                    {(plafond.niveau_code === "or" || plafond.niveau_code === "platine") && (
                      <span className="flex items-center gap-1">{Ic("check", "w-3 h-3 text-[#3fa873]")} Accès prioritaire à l&apos;analyse de vos dossiers</span>
                    )}
                    {plafond.niveau_code === "platine" && (
                      <span className="flex items-center gap-1">{Ic("check", "w-3 h-3 text-[#3fa873]")} Plafond maximum débloqué (60% du salaire)</span>
                    )}
                  </div>
                  {prochainNiveau(plafond.niveau_code) && (
                    <p className="text-[11px] text-[#66707d]">
                      Au niveau {prochainNiveau(plafond.niveau_code)!.libelle} : plafond plus élevé et badge {prochainNiveau(plafond.niveau_code)!.libelle} débloqué.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Portefeuille */}
            <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-5 py-4">
              <div className="flex items-center gap-2 mb-4 text-[#eef1f4]">
                {Ic("coins")}
                <h2 className="text-sm font-medium">Mon portefeuille</h2>
                {pretEnCours && <span className="text-xs text-[#66707d] font-normal">— prêt en cours</span>}
              </div>

              {!pretEnCours ? (
                <p className="text-sm text-[#66707d] py-4 text-center">Aucun prêt approuvé pour le moment.</p>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <AnneauProgression pourcentage={tauxProgression} />
                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4 flex-1 w-full">
                      <StatPortefeuille icone="layers" label="Montant emprunté" valeur={formaterMontant(totalEmprunte)} sousTexte={`Reçu : ${formaterMontant(Math.max(totalEmprunte - FRAIS_DE_TRAITEMENT, 0))} (frais : ${formaterMontant(FRAIS_DE_TRAITEMENT)})`} />
                      <StatPortefeuille icone="percent" label="Total à rembourser" valeur={formaterMontant(totalARembourser)} sousTexte={`Taux : ${libelleTaux}`} />
                      <StatPortefeuille icone="wallet" label="Total remboursé" valeur={formaterMontant(totalRembourseDuPret)} />
                      <StatPortefeuille icone="coins" label="Solde restant" valeur={formaterMontant(soldeRestant)} />
                    </div>
                  </div>
                  {echeancesTotalCount > 0 && (
                    <button
                      onClick={() => router.push("/pret-en-cours")}
                      className="mt-4 w-full flex items-center justify-between text-sm bg-[rgba(201,154,75,0.15)] border border-[rgba(201,154,75,0.3)] text-[#c99a4b] rounded-md px-4 py-2.5 hover:bg-[rgba(201,154,75,0.22)] transition"
                    >
                      <span className="flex items-center gap-2">{Ic("calendarCheck", "w-4 h-4")} Remboursement en cours • {echeancesPayeesCount}/{echeancesTotalCount}</span>
                      {Ic("chevronRight", "w-4 h-4")}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* 3 cartes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-4">
                <p className="flex items-center gap-2 text-xs text-[#8e99a8] mb-2">{Ic("coins", "w-4 h-4")} Prêt en cours</p>
                <p className="text-lg font-mono font-medium text-[#eef1f4]">{formaterMontant(totalEmprunte)}</p>
                {pretEnCours && (
                  <>
                    <p className="text-xs text-[#8e99a8] mt-1">Reste à rembourser : {formaterMontant(soldeRestant)}</p>
                    <div className="h-1.5 bg-[#212a35] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-[#c99a4b]" style={{ width: `${tauxProgression}%` }} />
                    </div>
                  </>
                )}
              </div>
              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-4">
                <p className="flex items-center gap-2 text-xs text-[#8e99a8] mb-2">{Ic("calendarCheck", "w-4 h-4")} Prochaine échéance</p>
                <p className="text-lg font-mono font-medium text-[#eef1f4]">{prochaine ? formaterDate(prochaine.date_echeance) : "—"}</p>
                <p className="text-xs text-[#8e99a8] mt-1">Montant : {prochaine ? formaterMontant(prochaine.montant) : "—"}</p>
              </div>
              <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-4">
                <p className="flex items-center gap-2 text-xs text-[#8e99a8] mb-2">{Ic("loans", "w-4 h-4")} Statut de mon dossier</p>
                {derniereDemande ? (
                  <>
                    <span
                      className="text-sm font-medium px-2 py-0.5 rounded-full inline-block"
                      style={{ backgroundColor: couleurStatut(derniereDemande.status).bg, color: couleurStatut(derniereDemande.status).text }}
                    >
                      {LIBELLES_STATUT[derniereDemande.status] || derniereDemande.status}
                    </span>
                    <p className="text-xs text-[#8e99a8] mt-2">Demandé : {formaterMontant(derniereDemande.amount_requested)}</p>
                    {derniereDemande.status === "approuve" && (
                      <p className="text-xs text-[#3fa873] mt-0.5">
                        Approuvé : {formaterMontant(derniereDemande.approved_amount)}
                        {derniereDemande.approved_amount != null && derniereDemande.approved_amount < derniereDemande.amount_requested && " (montant réduit)"}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-[#66707d]">Aucun dossier</p>
                )}
              </div>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">
            <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-5 py-4">
              <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-3">Accès rapides</p>
              <div className="grid grid-cols-2 gap-2">
                <ActionRapide icone="plus" label="Information Lotafinance" couleur="gold" onClick={() => router.push("/informations")} />
                <ActionRapide icone="loans" label="Mes prêts" couleur="blue" onClick={() => router.push("/mes-demandes")} />
                <ActionRapide icone="calendarCheck" label="Remboursement" couleur="green" onClick={() => router.push("/remboursements")} />
                <ActionRapide icone="headset" label="Assistance" couleur="red" onClick={ouvrirAssistance} />
                <ActionRapide icone="alert" label="Réclamations" couleur="purple" onClick={() => router.push("/reclamations")} />
                <ActionRapide icone="faq" label="FAQ" couleur="red" onClick={() => router.push("/faq")} />
                <ActionRapide icone="calculator" label="Simulateur de prêt" couleur="blue" onClick={() => router.push("/simulateur")} />
                <ActionRapide icone="gift" label="Parrainage" couleur="orange" onClick={() => router.push("/parrainage")} />
              </div>
            </div>

            <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg px-5 py-4">
              <p className="text-xs text-[#8e99a8] uppercase tracking-wide mb-3">Pourquoi choisir Lotafinance ?</p>
              <div className="space-y-3">
                <PourquoiItem emoji="⚡" label="Traitement rapide" description="Réponse en moins de 24h" />
                <PourquoiItem emoji="🛡️" label="Sécurisé" description="Vos données sont protégées" />
                <PourquoiItem emoji="📈" label="Taux attractifs" description="Conditions adaptées à vos besoins" />
                <PourquoiItem emoji="📱" label="100% en ligne" description="Depuis votre téléphone" />
              </div>
              <button
                onClick={() => router.push("/demande-pret")}
                className="w-full mt-4 bg-[#c99a4b] text-[#10151c] text-sm font-semibold py-2.5 rounded-md hover:bg-[#e4b565] transition"
              >
                Faire une demande
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#66707d] mt-8">Lotafinance – Plus qu&apos;un prêt, un partenaire pour votre avenir.</p>
      </div>

      {/* Barre de navigation mobile — visible seulement en dessous de md */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#10151c]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around py-2 px-1">
        {[
          { href: "/tableau-de-bord", label: "Accueil", icone: "home" as const },
          { href: "/mes-demandes", label: "Mes prêts", icone: "loans" as const },
          { href: "/demande-pret", label: "Demander", icone: "plus" as const },
          { href: "/remboursements", label: "Rembours.", icone: "calendarCheck" as const },
          { href: "/documents", label: "Docs", icone: "document" as const },
          { href: "/profil", label: "Profil", icone: "user" as const },
        ].map((lien) => {
          const IconeRiche = ICONES_RICHES[lien.icone];
          const estActif = lien.href === "/tableau-de-bord";
          return (
            <button
              key={lien.href}
              onClick={() => router.push(lien.href)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <span className={estActif ? "text-[#c99a4b]" : "text-[#8e99a8]"}>
                {IconeRiche ? <IconeRiche size={20} /> : Ic(lien.icone, "w-5 h-5")}
              </span>
              <span className={`text-[9px] ${estActif ? "text-[#c99a4b] font-medium" : "text-[#8e99a8]"}`}>{lien.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function StatPortefeuille({ icone, label, valeur, sousTexte }: { icone: keyof typeof ICONES; label: string; valeur: string; sousTexte?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#c99a4b] shrink-0 mt-0.5">{Ic(icone, "w-4 h-4")}</span>
      <div>
        <p className="text-[10px] text-[#8e99a8]">{label}</p>
        <p className="text-sm font-mono font-medium text-[#eef1f4]">{valeur}</p>
        {sousTexte && <p className="text-[10px] text-[#c99a4b] mt-0.5">{sousTexte}</p>}
      </div>
    </div>
  );
}

function ActionRapide({ icone, label, couleur, onClick }: { icone: keyof typeof ICONES; label: string; couleur: CouleurLotafinance; onClick: () => void }) {
  const IconeRiche = ICONES_RICHES[icone];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-2 py-3 hover:border-[rgba(255,255,255,0.16)] transition">
      <IconCircle color={couleur} size={36}>
        {IconeRiche ? <IconeRiche size={18} /> : Ic(icone, "w-4 h-4")}
      </IconCircle>
      <span className="text-[10px] text-[#8e99a8] text-center leading-tight">{label}</span>
    </button>
  );
}

function OffreCard({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-md px-2 py-4 hover:border-[rgba(255,255,255,0.16)] transition text-center">
      <span className="text-2xl">{emoji}</span>
      <span className="text-[11px] text-[#8e99a8] leading-tight">{label}</span>
    </button>
  );
}

function PourquoiItem({ emoji, label, description }: { emoji: string; label: string; description: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-lg shrink-0">{emoji}</span>
      <div>
        <p className="text-sm text-[#eef1f4] font-medium leading-tight">{label}</p>
        <p className="text-xs text-[#8e99a8] mt-0.5">{description}</p>
      </div>
    </div>
  );
}
