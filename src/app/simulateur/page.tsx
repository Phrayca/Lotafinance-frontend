"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirMonProfilClient, obtenirMonPlafond, ProfilClient, Plafond } from "@/lib/api";
import { HomeIcon, LoanIcon, LoanRequestIcon, RepaymentIcon, DocumentIcon, ProfileIcon, IconCircle, SimulatorIcon } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition";

// Mêmes taux que le backend (app/main.py : loan_rate_config)
const TAUX_PAR_DUREE: Record<number, number> = { 2: 5, 4: 10 };

function formaterMontant(m: number) {
  return `${Math.round(m).toLocaleString("fr-FR")} F`;
}

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/documents", label: "Docs", Icone: DocumentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

export default function PageSimulateur() {
  const router = useRouter();
  const [profilClient, setProfilClient] = useState<ProfilClient | null>(null);
  const [plafond, setPlafond] = useState<Plafond | null>(null);
  const [chargement, setChargement] = useState(true);

  const [montant, setMontant] = useState("50000");
  const [duree, setDuree] = useState(2);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    Promise.all([
      obtenirMonProfilClient(token).catch(() => null),
      obtenirMonPlafond(token).catch(() => null),
    ]).then(([p, pl]) => {
      setProfilClient(p);
      setPlafond(pl);
      setChargement(false);
    });
  }, [router]);

  const montantNombre = Number(montant) || 0;
  const taux = TAUX_PAR_DUREE[duree] ?? 0;
  const interets = Math.round((montantNombre * taux) / 100);
  const total = montantNombre + interets;
  const fraisTraitement = 1000;
  const montantRecu = Math.max(montantNombre - fraisTraitement, 0);

  const capaciteDisponible = plafond?.plafond ?? null;
  const depasseCapacite = capaciteDisponible != null && montantNombre > capaciteDisponible;

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

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="blue" size={40}><SimulatorIcon size={20} /></IconCircle>
            <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4]">Simulateur de prêt</h1>
          </div>
          <p className="text-[#8e99a8] text-sm mb-6">Explorez différents montants avant de vous engager, sans aucun impact sur votre dossier.</p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-[#8e99a8] mb-1">Montant (F)</label>
              <input
                type="number" min={1}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className={CHAMP_CLASSES}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8e99a8] mb-1">Durée</label>
              <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className={CHAMP_CLASSES}>
                <option value={2}>2 semaines</option>
                <option value={4}>1 mois</option>
              </select>
            </div>
          </div>

          {/* Curseur montant pour une exploration rapide */}
          <input
            type="range"
            min={5000}
            max={Math.max(capaciteDisponible || 200000, montantNombre, 200000)}
            step={5000}
            value={montantNombre}
            onChange={(e) => setMontant(e.target.value)}
            className="w-full mb-6 accent-[#c99a4b]"
          />

          <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-4 space-y-2 text-sm font-mono mb-4">
            <LigneResultat label="Taux estimé" valeur={`${taux}%`} />
            <LigneResultat label="Intérêts estimés" valeur={formaterMontant(interets)} />
            <LigneResultat label="Total à rembourser" valeur={formaterMontant(total)} />
            <LigneResultat label="Frais de traitement" valeur={`− ${formaterMontant(fraisTraitement)}`} />
            <LigneResultat label="Montant net reçu" valeur={formaterMontant(montantRecu)} gras />
          </div>

          {capaciteDisponible != null && (
            <div className={`flex items-center gap-2 rounded-md px-4 py-3 mb-4 text-sm ${depasseCapacite ? "bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] text-[#c0563b]" : "bg-[rgba(63,168,115,0.12)] border border-[rgba(63,168,115,0.3)] text-[#3fa873]"}`}>
              {depasseCapacite ? "🔴" : "🟢"}
              <span>
                {depasseCapacite
                  ? `Ce montant dépasse votre plafond actuel de ${formaterMontant(capaciteDisponible)}.`
                  : `Dans votre plafond actuel de ${formaterMontant(capaciteDisponible)}.`}
              </span>
            </div>
          )}

          {!profilClient?.monthly_income && (
            <p className="text-xs text-[#66707d] mb-4">Complétez votre profil (revenu mensuel) pour voir votre plafond personnalisé.</p>
          )}

          <button
            onClick={() => router.push(`/demande-pret?montant=${montantNombre}&duree=${duree}`)}
            disabled={montantNombre <= 0}
            className="w-full bg-[#c99a4b] text-[#10151c] text-sm font-semibold py-2.5 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50"
          >
            Faire une demande avec ces paramètres
          </button>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#10151c]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around py-2 px-1">
        {LIENS_NAV_MOBILE.map((lien) => {
          const Icone = lien.Icone;
          return (
            <button key={lien.href} onClick={() => router.push(lien.href)} className="flex flex-col items-center gap-0.5 flex-1 py-1">
              <span className="text-[#8e99a8]"><Icone size={20} /></span>
              <span className="text-[9px] text-[#8e99a8]">{lien.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function LigneResultat({ label, valeur, gras }: { label: string; valeur: string; gras?: boolean }) {
  return (
    <div className={`flex justify-between ${gras ? "border-t border-[rgba(255,255,255,0.08)] pt-2 mt-2" : ""}`}>
      <span className={gras ? "text-[#eef1f4] font-medium" : "text-[#8e99a8]"}>{label}</span>
      <span className={gras ? "text-[#eef1f4] font-medium" : "text-[#eef1f4]"}>{valeur}</span>
    </div>
  );
}
