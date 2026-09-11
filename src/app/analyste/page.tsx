"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  obtenirDemandesEnAttente,
  obtenirToutesLesDemandes,
  obtenirEcheancesAnalyste,
  obtenirConversations,
  obtenirClientsARisque,
  obtenirStatistiques,
  obtenirTousLesClients,
  obtenirAlertesFraudeGlobales,
  urlPhotoDeProfil,
  recupererMonProfilUtilisateur,
  LoanOut,
  Echeance,
  ClientRisque,
  StatMois,
  ClientApercu,
  AlerteFraudeGlobale,
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
  NotificationIcon,
} from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const LIBELLES_RISQUE: Record<string, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
  "très risqué": "Très risqué",
};

const LIBELLES_STATUT: Record<string, string> = {
  soumis: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
  infos_demandees: "Infos demandées",
};

function couleurRisque(risque?: string): { bg: string; text: string } {
  if (!risque) return { bg: "#1B1F29", text: "#7C8494" };
  const r = risque.toLowerCase();
  if (r.includes("faible")) return { bg: "#0F2420", text: "#3DDC97" };
  if (r.includes("moyen")) return { bg: "#2A2312", text: "#C9A227" };
  return { bg: "#2A1414", text: "#F0A0A0" };
}

function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "approuve") return { bg: "#0F2420", text: "#3DDC97" };
  if (statut === "refuse") return { bg: "#2A1414", text: "#F0A0A0" };
  return { bg: "#2A2312", text: "#C9A227" };
}

function formaterMontant(m?: number | null) {
  if (m == null) return "—";
  return `${m.toLocaleString("fr-FR")} F`;
}
function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
const SEUIL_RETARD_CRITIQUE = 3;
// Frais de traitement fixes, encaissés à chaque prêt approuvé (n'affectent pas le total à rembourser du client)
const FRAIS_DE_TRAITEMENT = 1000;
function joursDeRetard(dateEcheance: string) {
  const diff = Date.now() - new Date(dateEcheance).getTime();
  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
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
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  mail: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  calendarCheck: "M4 6h16v14H4V6Z M4 10h16 M8 3v4 M16 3v4 M9 15l2 2 4-4",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  coins: "M12 8a5 2.4 0 1 0 0 4.8 5 2.4 0 0 0 0-4.8Z M7 10.4V15c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4v-4.6",
  percent: "M19 5 5 19 M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  wallet: "M3 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z M3 7l2-3h10l2 3 M16 13h3v3h-3a1.5 1.5 0 0 1 0-3Z",
  alert: "M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  chevronDown: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  bell: "M6 10a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 14 6 10Z M10 19a2 2 0 0 0 4 0",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
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
  { href: "/analyste", label: "Tableau de bord", icone: "home" as const, actif: true },
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

function CarteKpi({ icone, label, valeur, sousTexte, accent }: { icone: keyof typeof ICONES; label: string; valeur: string; sousTexte?: string; accent?: string }) {
  return (
    <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
      <p className="flex items-center gap-2 text-xs text-[#7C8494] mb-2">{Ic(icone, "w-4 h-4")} {label}</p>
      <p className="text-lg font-mono font-medium" style={{ color: accent || "#E8E6DE" }}>{valeur}</p>
      {sousTexte && <p className="text-xs text-[#7C8494] mt-1">{sousTexte}</p>}
    </div>
  );
}

function GraphiquePortefeuille({ data }: { data: StatMois[] }) {
  if (data.length === 0) return null;
  const maxValeur = Math.max(1, ...data.flatMap((d) => [d.capital_prete, d.montant_encaisse]));
  const espacement = 70;
  const hauteurMax = 130;
  const largeurBarre = 20;
  const largeurTotale = data.length * espacement + 20;

  return (
    <div>
      <svg viewBox={`0 0 ${largeurTotale} 175`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <line x1="10" y1="150" x2={largeurTotale - 10} y2="150" stroke="#232733" strokeWidth="1" />
        {data.map((d, i) => {
          const x = 25 + i * espacement;
          const hCapital = (d.capital_prete / maxValeur) * hauteurMax;
          const hEncaisse = (d.montant_encaisse / maxValeur) * hauteurMax;
          return (
            <g key={d.mois + i}>
              <rect x={x} y={150 - hCapital} width={largeurBarre} height={Math.max(hCapital, 1)} fill="#C9A227" rx="2" />
              <rect x={x + largeurBarre + 4} y={150 - hEncaisse} width={largeurBarre} height={Math.max(hEncaisse, 1)} fill="#3DDC97" rx="2" />
              <text x={x + largeurBarre + 2} y="166" textAnchor="middle" fontSize="10" fill="#7C8494">{d.mois}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 mt-2 text-xs">
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-2.5 rounded-sm bg-[#C9A227]" /> Capital prêté</span>
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-2.5 rounded-sm bg-[#3DDC97]" /> Montant encaissé</span>
      </div>
    </div>
  );
}

function DonutStatut({ counts }: { counts: { label: string; value: number; color: string }[] }) {
  const total = counts.reduce((s, c) => s + c.value, 0);
  const rayon = 45;
  const circonference = 2 * Math.PI * rayon;
  let cumule = 0;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={rayon} fill="none" stroke="#1B2030" strokeWidth="14" />
          {total > 0 &&
            counts.map((c) => {
              const frac = c.value / total;
              const dash = frac * circonference;
              const el = (
                <circle
                  key={c.label}
                  cx="60" cy="60" r={rayon} fill="none" stroke={c.color} strokeWidth="14"
                  strokeDasharray={`${dash} ${circonference - dash}`}
                  strokeDashoffset={-cumule}
                />
              );
              cumule += dash;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-mono font-semibold text-[#E8E6DE]">{total}</span>
          <span className="text-[10px] text-[#7C8494]">Total</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {counts.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-[#B8BAC4]">{c.label}</span>
            <span className="text-[#7C8494] font-mono">{c.value} ({total > 0 ? Math.round((c.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LigneEvolution({ data }: { data: StatMois[] }) {
  if (data.length === 0) return null;
  const maxV = Math.max(1, ...data.flatMap((d) => [d.nombre_dossiers_traites, d.nombre_approuves]));
  const w = 500, h = 130, pad = 16;
  const stepX = data.length > 1 ? (w - 2 * pad) / (data.length - 1) : 0;

  function points(cle: "nombre_dossiers_traites" | "nombre_approuves") {
    return data.map((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (d[cle] / maxV) * (h - 2 * pad);
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <polyline points={points("nombre_dossiers_traites")} fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points("nombre_approuves")} fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <text key={d.mois} x={pad + i * stepX} y={h + 14} textAnchor="middle" fontSize="9" fill="#7C8494">{d.mois}</text>
        ))}
      </svg>
      <div className="flex items-center gap-5 mt-2 text-xs">
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-0.5 bg-[#5B8DEF]" /> Dossiers traités</span>
        <span className="flex items-center gap-1.5 text-[#B8BAC4]"><span className="w-2.5 h-0.5 bg-[#3DDC97]" /> Approuvés</span>
      </div>
    </div>
  );
}

function JaugeRisque({ faible, moyen, eleve }: { faible: number; moyen: number; eleve: number }) {
  const total = faible + moyen + eleve || 1;
  const pFaible = (faible / total) * 100;
  const pMoyen = (moyen / total) * 100;
  const dominant =
    eleve >= moyen && eleve >= faible && eleve > 0
      ? { label: "Élevé", color: "#F0A0A0" }
      : moyen >= faible && moyen > 0
      ? { label: "Moyen", color: "#C9A227" }
      : faible > 0
      ? { label: "Faible", color: "#3DDC97" }
      : { label: "—", color: "#7C8494" };
  const gradient = `conic-gradient(#3DDC97 0% ${pFaible}%, #C9A227 ${pFaible}% ${pFaible + pMoyen}%, #F0A0A0 ${pFaible + pMoyen}% 100%)`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 rounded-full" style={{ background: total > 1 ? gradient : "#1B2030" }}>
        <div className="absolute inset-2 rounded-full bg-[#12151C] flex flex-col items-center justify-center">
          <span className="text-sm font-semibold" style={{ color: dominant.color }}>{dominant.label}</span>
          <span className="text-[10px] text-[#7C8494] text-center px-2">Risque global</span>
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-xs flex-wrap justify-center">
        <span className="flex items-center gap-1 text-[#B8BAC4]"><span className="w-2 h-2 rounded-full bg-[#3DDC97]" />Faible ({faible})</span>
        <span className="flex items-center gap-1 text-[#B8BAC4]"><span className="w-2 h-2 rounded-full bg-[#C9A227]" />Moyen ({moyen})</span>
        <span className="flex items-center gap-1 text-[#B8BAC4]"><span className="w-2 h-2 rounded-full bg-[#F0A0A0]" />Élevé ({eleve})</span>
      </div>
    </div>
  );
}

export default function PageEspaceAnalyste() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [utilisateur, setUtilisateur] = useState<{ id: string; email: string; role: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [notifOuvertes, setNotifOuvertes] = useState(false);
  const [alertesVuesCompte, setAlertesVuesCompte] = useState(0);
  const [demandes, setDemandes] = useState<LoanOut[]>([]);
  const [toutesDemandes, setToutesDemandes] = useState<LoanOut[]>([]);
  const [echeancesToutes, setEcheancesToutes] = useState<Echeance[]>([]);
  const [clientsARisque, setClientsARisque] = useState<ClientRisque[]>([]);
  const [statistiques, setStatistiques] = useState<StatMois[]>([]);
  const [clients, setClients] = useState<ClientApercu[]>([]);
  const [alertesFraude, setAlertesFraude] = useState<AlerteFraudeGlobale[]>([]);
  const [totalNonLus, setTotalNonLus] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

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
        const [enAttente, toutes] = await Promise.all([
          obtenirDemandesEnAttente(token),
          obtenirToutesLesDemandes(token),
        ]);
        setDemandes(enAttente);
        setToutesDemandes(toutes);

        const approuvees = toutes.filter((d) => d.status === "approuve");
        const echeancesParPret = await Promise.all(
          approuvees.map((d) => obtenirEcheancesAnalyste(token, d.id).catch(() => []))
        );
        setEcheancesToutes(echeancesParPret.flat());
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    obtenirConversations(token)
      .then((liste) => setTotalNonLus(liste.reduce((somme, c) => somme + c.non_lus, 0)))
      .catch(() => {});

    obtenirClientsARisque(token)
      .then(setClientsARisque)
      .catch(() => {});

    obtenirStatistiques(token, 6)
      .then(setStatistiques)
      .catch(() => {});

    obtenirTousLesClients(token)
      .then(setClients)
      .catch(() => {});

    obtenirAlertesFraudeGlobales(token)
      .then(setAlertesFraude)
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
    const stocke = localStorage.getItem("analyste_alertes_vues_compte");
    if (stocke) setAlertesVuesCompte(Number(stocke) || 0);
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

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  // ---- Indicateurs de portefeuille ----
  const approuvees = toutesDemandes.filter((d) => d.status === "approuve");
  const capitalEngage = approuvees.reduce((s, d) => s + (d.approved_amount ?? d.amount_requested), 0);
  const totalAPercevoir = approuvees.reduce((s, d) => s + (d.total_to_repay ?? 0), 0);
  const dejaEncaisseGlobal = echeancesToutes.filter((e) => e.payee).reduce((s, e) => s + e.montant, 0);
  const totalFraisRetardGlobal = echeancesToutes.reduce((s, e) => s + (e.frais_retard || 0), 0);
  const resteAPercevoirGlobal = Math.max(totalAPercevoir - dejaEncaisseGlobal, 0) + totalFraisRetardGlobal;
  const beneficeEstime = Math.max(totalAPercevoir - capitalEngage, 0) + approuvees.length * FRAIS_DE_TRAITEMENT + totalFraisRetardGlobal;
  const echeancesEnRetardGlobal = echeancesToutes.filter(
    (e) => !e.payee && new Date(e.date_echeance).getTime() < Date.now()
  );

  // Répartition risque des dossiers en attente (pour compat existante)
  const repartitionRisque = { faible: 0, moyen: 0, eleve: 0 };
  demandes.forEach((d) => {
    const r = (d.risk_level || "").toLowerCase();
    if (r.includes("faible")) repartitionRisque.faible++;
    else if (r.includes("moyen")) repartitionRisque.moyen++;
    else if (r) repartitionRisque.eleve++;
  });
  const totalRisqueClasse = repartitionRisque.faible + repartitionRisque.moyen + repartitionRisque.eleve;

  // Répartition risque GLOBALE (tous les dossiers, pour la jauge)
  const risqueGlobal = { faible: 0, moyen: 0, eleve: 0 };
  toutesDemandes.forEach((d) => {
    const r = (d.risk_level || "").toLowerCase();
    if (r.includes("faible")) risqueGlobal.faible++;
    else if (r.includes("moyen")) risqueGlobal.moyen++;
    else if (r) risqueGlobal.eleve++;
  });

  // Répartition par statut (donut)
  const parStatut = { soumis: 0, approuve: 0, refuse: 0, infos_demandees: 0 };
  toutesDemandes.forEach((d) => {
    if (d.status in parStatut) parStatut[d.status as keyof typeof parStatut]++;
  });
  const donutCounts = [
    { label: "En attente", value: parStatut.soumis, color: "#5B8DEF" },
    { label: "Approuvés", value: parStatut.approuve, color: "#3DDC97" },
    { label: "Refusés", value: parStatut.refuse, color: "#F0A0A0" },
    { label: "Infos demandées", value: parStatut.infos_demandees, color: "#C9A227" },
  ].filter((c) => c.value > 0);

  // Demandes récentes, enrichies avec le nom du client
  const clientsParId = new Map(clients.map((c) => [c.id, c]));
  const demandesRecentes = toutesDemandes.slice(0, 5);

  // Tendance du capital prêté (mois en cours vs précédent)
  let tendanceCapital: number | null = null;
  if (statistiques.length >= 2) {
    const dernier = statistiques[statistiques.length - 1].capital_prete;
    const precedent = statistiques[statistiques.length - 2].capital_prete;
    if (precedent > 0) tendanceCapital = Math.round(((dernier - precedent) / precedent) * 100);
  }

  const clientsARetard = clientsARisque.filter((c) => c.echeances_en_retard > 0);
  const totalAlertes = demandes.length + clientsARetard.length + totalNonLus + alertesFraude.length;

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
              {lien.href === "/analyste/messages" && totalNonLus > 0 && (
                <span
                  className={`${sidebarReduite ? "absolute translate-x-3 -translate-y-3" : ""} w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                    lien.actif ? "bg-[#0B0E14] text-[#C9A227]" : "bg-[#C24545] text-white"
                  }`}
                >
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
        <div className="flex items-center gap-3 mb-6">
          <form onSubmit={gererRecherche} className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6070]">{Ic("search", "w-4 h-4")}</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un dossier, client, numéro de téléphone..."
              className="w-full bg-[#12151C] border border-[#232733] rounded-md pl-9 pr-3 py-2.5 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
            />
          </form>

          <div className="relative shrink-0">
            <button
              onClick={() => {
                const nouvelEtat = !notifOuvertes;
                setNotifOuvertes(nouvelEtat);
                if (nouvelEtat) {
                  setAlertesVuesCompte(totalAlertes);
                  localStorage.setItem("analyste_alertes_vues_compte", String(totalAlertes));
                }
              }}
              title="Notifications"
              className="relative text-[#7C8494] hover:text-[#E8E6DE] transition p-2"
            >
              <NotificationIcon size={20} />
              {totalAlertes > alertesVuesCompte && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C24545] text-white text-[9px] flex items-center justify-center">{totalAlertes}</span>
              )}
            </button>
            {notifOuvertes && (
              <div className="absolute right-0 top-10 w-80 bg-[#12151C] border border-[#232733] rounded-md shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1B1F29] text-sm font-medium text-[#E8E6DE]">Notifications</div>
                <div className="max-h-96 overflow-y-auto divide-y divide-[#1B1F29]">
                  {demandes.length > 0 && (
                    <button onClick={() => { router.push("/analyste/toutes?statut=soumis"); setNotifOuvertes(false); }} className="w-full text-left px-4 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#5B8DEF] mt-1.5 shrink-0" />
                      <span className="text-xs text-[#B8BAC4]">{demandes.length} dossier{demandes.length > 1 ? "s" : ""} à traiter</span>
                    </button>
                  )}
                  {clientsARetard.map((c) => (
                    <button key={c.client_id} onClick={() => { router.push(`/analyste/clients/${c.client_id}`); setNotifOuvertes(false); }} className="w-full text-left px-4 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F0A0A0] mt-1.5 shrink-0" />
                      <span className="text-xs text-[#B8BAC4]">{c.client_first_name} {c.client_last_name} — retard de paiement</span>
                    </button>
                  ))}
                  {alertesFraude.slice(0, 5).map((a, i) => (
                    <button key={i} onClick={() => { router.push(`/analyste/clients/${a.client_id}`); setNotifOuvertes(false); }} className="w-full text-left px-4 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.gravite === "elevee" ? "bg-[#F0A0A0]" : "bg-[#C9A227]"}`} />
                      <span className="text-xs text-[#B8BAC4]">⚠️ {a.client_first_name} {a.client_last_name} — {a.message}</span>
                    </button>
                  ))}
                  {totalNonLus > 0 && (
                    <button onClick={() => { router.push("/analyste/messages"); setNotifOuvertes(false); }} className="w-full text-left px-4 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A227] mt-1.5 shrink-0" />
                      <span className="text-xs text-[#B8BAC4]">{totalNonLus} nouveau{totalNonLus > 1 ? "x" : ""} message{totalNonLus > 1 ? "s" : ""} client</span>
                    </button>
                  )}
                  {totalAlertes === 0 && (
                    <p className="text-xs text-[#5A6070] text-center py-8">Aucune notification pour le moment</p>
                  )}
                </div>
              </div>
            )}
          </div>

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

        <div className="mb-6">
          <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">Tableau de bord</h1>
          <p className="text-[#7C8494] text-sm mt-1">Vue d&apos;ensemble du portefeuille Lotafinance</p>
        </div>

        {erreur && (
          <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          {/* Colonne principale */}
          <div className="xl:col-span-2 space-y-4">
            {/* Indicateurs de portefeuille */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CarteKpi icone="coins" label="Capital engagé" valeur={formaterMontant(capitalEngage)} sousTexte={`${approuvees.length} prêt${approuvees.length > 1 ? "s" : ""} actif${approuvees.length > 1 ? "s" : ""}`} />
              <CarteKpi
                icone="percent"
                label="Reste à percevoir"
                valeur={formaterMontant(resteAPercevoirGlobal)}
                sousTexte={`Sur ${formaterMontant(totalAPercevoir)} attendus${totalFraisRetardGlobal > 0 ? ` (+ ${formaterMontant(totalFraisRetardGlobal)} de retard)` : ""}`}
              />
              <CarteKpi
                icone="wallet"
                label="Bénéfice net estimé"
                valeur={formaterMontant(beneficeEstime)}
                accent="#3DDC97"
                sousTexte={totalFraisRetardGlobal > 0 ? "Intérêts + frais de traitement + retards" : "Intérêts + frais de traitement"}
              />
              {(() => {
                const critiques = echeancesEnRetardGlobal.filter((e) => joursDeRetard(e.date_echeance) >= SEUIL_RETARD_CRITIQUE);
                return (
                  <CarteKpi
                    icone="alert"
                    label="Échéances en retard"
                    valeur={String(echeancesEnRetardGlobal.length)}
                    accent={critiques.length > 0 ? "#FF6B6B" : echeancesEnRetardGlobal.length > 0 ? "#F0A0A0" : "#3DDC97"}
                    sousTexte={
                      critiques.length > 0
                        ? `⚠️ ${critiques.length} critique${critiques.length > 1 ? "s" : ""} (+${SEUIL_RETARD_CRITIQUE}j)`
                        : echeancesEnRetardGlobal.length > 0
                        ? formaterMontant(echeancesEnRetardGlobal.reduce((s, e) => s + e.montant, 0)) + " en jeu"
                        : "Aucun retard"
                    }
                  />
                );
              })()}
            </div>

            {/* Donut + Jauge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#12151C] border border-[#232733] rounded-lg px-5 py-4">
                <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Répartition des dossiers par statut</p>
                {donutCounts.length > 0 ? (
                  <DonutStatut counts={donutCounts} />
                ) : (
                  <p className="text-sm text-[#5A6070] py-8 text-center">Aucun dossier pour le moment.</p>
                )}
              </div>
              <div className="bg-[#12151C] border border-[#232733] rounded-lg px-5 py-4 flex flex-col items-center justify-center">
                <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3 self-start">Analyse du risque global</p>
                <JaugeRisque faible={risqueGlobal.faible} moyen={risqueGlobal.moyen} eleve={risqueGlobal.eleve} />
              </div>
            </div>

            {/* Évolution des demandes et approbations */}
            {statistiques.length > 0 && (
              <div className="bg-[#12151C] border border-[#232733] rounded-lg px-5 py-4">
                <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Évolution des demandes et approbations (6 derniers mois)</p>
                <LigneEvolution data={statistiques} />
              </div>
            )}

            {/* Demandes récentes */}
            <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[#E8E6DE]">Demandes récentes</h2>
                <button onClick={() => router.push("/analyste/toutes")} className="text-xs text-[#C9A227] hover:text-[#DDB63A] transition">Voir tout</button>
              </div>
              {demandesRecentes.length === 0 ? (
                <p className="text-sm text-[#5A6070] py-4 text-center">Aucune demande pour le moment.</p>
              ) : (
                <table className="w-full text-sm border-collapse min-w-[560px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-[#7C8494] border-b border-[#232733]">
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Montant demandé</th>
                      <th className="pb-2 font-medium">Motif</th>
                      <th className="pb-2 font-medium">Statut</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandesRecentes.map((d) => {
                      const c = clientsParId.get(d.client_id);
                      const couleur = couleurStatut(d.status);
                      const nom = c ? `${c.first_name} ${c.last_name}` : "Client";
                      const initiales = c ? `${c.first_name[0] ?? ""}${c.last_name[0] ?? ""}`.toUpperCase() : "??";
                      return (
                        <tr
                          key={d.id}
                          onClick={() => router.push(`/analyste/${d.id}`)}
                          className="border-b border-[#1B1F29] last:border-0 cursor-pointer hover:bg-[#171B24] transition"
                        >
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] text-xs font-semibold flex items-center justify-center shrink-0">
                                {initiales}
                              </span>
                              <span className="text-[#E8E6DE] font-medium truncate">{nom}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-3 font-mono text-[#B8BAC4] whitespace-nowrap">{formaterMontant(d.amount_requested)}</td>
                          <td className="py-3 pr-3 text-[#7C8494] truncate max-w-[140px]">{d.purpose || "—"}</td>
                          <td className="py-3 pr-3">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                              {LIBELLES_STATUT[d.status] || d.status}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-[#5A6070] text-xs whitespace-nowrap">{formaterDate(d.submitted_at)}</td>
                          <td className="py-3 text-[#5A6070]">{Ic("chevronRight", "w-4 h-4")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Clients à surveiller */}
            {clientsARetard.length > 0 && (
              <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
                <h2 className="text-sm font-medium text-[#E8E6DE] mb-1">Clients à surveiller</h2>
                <p className="text-xs text-[#7C8494] mb-3">Historique de retard sur l&apos;ensemble de leurs prêts, même déjà soldés</p>
                <div className="space-y-2">
                  {clientsARetard.slice(0, 5).map((c) => (
                    <button
                      key={c.client_id}
                      onClick={() => router.push(`/analyste/clients/${c.client_id}`)}
                      className="w-full text-left flex items-center justify-between border border-[#4A2222] bg-[#1A0F0F] rounded-md p-3 hover:border-[#6B2E2E] transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#E8E6DE]">{c.client_first_name} {c.client_last_name}</p>
                        <p className="text-xs text-[#7C8494] mt-0.5">
                          {c.nombre_prets_approuves} prêt{c.nombre_prets_approuves > 1 ? "s" : ""} approuvé{c.nombre_prets_approuves > 1 ? "s" : ""} · {formaterMontant(c.montant_total_emprunte)} emprunté au total
                        </p>
                      </div>
                      <span className="text-xs font-medium text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-full px-2.5 py-1 shrink-0">
                        {c.echeances_en_retard} retard{c.echeances_en_retard > 1 ? "s" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Colonne latérale droite */}
          <div className="space-y-4">
            <div className="bg-[#12151C] border border-[#232733] rounded-lg px-5 py-4">
              <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Actions rapides</p>
              <div className="grid grid-cols-2 gap-2">
                <ActionRapide icone="target" label="Évaluer un dossier" couleur="gold" onClick={() => router.push("/analyste/toutes?statut=soumis")} />
                <ActionRapide icone="chart" label="Générer un rapport" couleur="blue" onClick={() => router.push("/analyste/rapports")} />
                <ActionRapide icone="users" label="Gestion des utilisateurs" couleur="purple" onClick={() => router.push("/analyste/utilisateurs")} />
                <ActionRapide icone="gear" label="Paramètres système" couleur="green" onClick={() => router.push("/analyste/parametres")} />
              </div>
            </div>

            <div className="bg-[#1B1706] border border-[#3A3013] rounded-lg px-5 py-4">
              <p className="flex items-center gap-2 text-xs text-[#C9A227] uppercase tracking-wide mb-2">{Ic("trend", "w-4 h-4")} Performance du portefeuille</p>
              <p className="text-2xl font-mono font-semibold text-[#E8E6DE]">{formaterMontant(capitalEngage)}</p>
              <p className="text-xs text-[#B8BAC4] mt-1">
                Capital total engagé
                {tendanceCapital != null && (
                  <span className={tendanceCapital >= 0 ? "text-[#3DDC97]" : "text-[#F0A0A0]"}> · {tendanceCapital >= 0 ? "↑" : "↓"} {Math.abs(tendanceCapital)}% vs mois dernier</span>
                )}
              </p>
            </div>

            <div className="bg-[#12151C] border border-[#232733] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#232733]">
                <p className="flex items-center gap-2 text-sm font-medium text-[#E8E6DE]">{Ic("bell", "w-4 h-4")} Alertes & Notifications</p>
                {totalAlertes > alertesVuesCompte && (
                  <span className="w-5 h-5 rounded-full bg-[#C24545] text-white text-[10px] flex items-center justify-center">{totalAlertes}</span>
                )}
              </div>
              <div className="divide-y divide-[#1B1F29]">
                {demandes.length > 0 && (
                  <button onClick={() => router.push("/analyste/toutes?statut=soumis")} className="w-full text-left px-5 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#5B8DEF] mt-1.5 shrink-0" />
                    <span className="text-xs text-[#B8BAC4]">{demandes.length} dossier{demandes.length > 1 ? "s" : ""} à traiter</span>
                  </button>
                )}
                {clientsARetard.map((c) => (
                  <button key={c.client_id} onClick={() => router.push(`/analyste/clients/${c.client_id}`)} className="w-full text-left px-5 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F0A0A0] mt-1.5 shrink-0" />
                    <span className="text-xs text-[#B8BAC4]">{c.client_first_name} {c.client_last_name} — retard de paiement</span>
                  </button>
                ))}
                {totalNonLus > 0 && (
                  <button onClick={() => router.push("/analyste/messages")} className="w-full text-left px-5 py-3 hover:bg-[#171B24] transition flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C9A227] mt-1.5 shrink-0" />
                    <span className="text-xs text-[#B8BAC4]">{totalNonLus} nouveau{totalNonLus > 1 ? "x" : ""} message{totalNonLus > 1 ? "s" : ""} client</span>
                  </button>
                )}
                {alertesFraude.slice(0, 5).map((a, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(`/analyste/clients/${a.client_id}`)}
                    className="w-full text-left px-5 py-3 hover:bg-[#171B24] transition flex items-start gap-2"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.gravite === "elevee" ? "bg-[#F0A0A0]" : "bg-[#C9A227]"}`} />
                    <span className="text-xs text-[#B8BAC4]">⚠️ {a.client_first_name} {a.client_last_name} — {a.message}</span>
                  </button>
                ))}
                {totalAlertes === 0 && (
                  <p className="text-xs text-[#5A6070] text-center py-6">Aucune alerte pour le moment</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ActionRapide({ icone, label, couleur, onClick }: { icone: keyof typeof ICONES; label: string; couleur: CouleurLotafinance; onClick: () => void }) {
  const IconeRiche = ICONES_RICHES[icone];
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 bg-[#0B0E14] border border-[#232733] rounded-md px-2 py-3 hover:border-[#3A4050] transition">
      <IconCircle color={couleur} size={36}>
        {IconeRiche ? <IconeRiche size={18} /> : Ic(icone, "w-4 h-4")}
      </IconCircle>
      <span className="text-[10px] text-[#B8BAC4] text-center leading-tight">{label}</span>
    </button>
  );
}
