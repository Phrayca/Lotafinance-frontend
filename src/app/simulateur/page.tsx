"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SimulatorIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

// Mêmes taux que ceux configurés côté backend (app/main.py : loan_rate_config)
const TAUX_PAR_DUREE: Record<number, number> = { 2: 5, 4: 10 };

function formaterMontant(m: number) {
  return `${Math.round(m).toLocaleString("fr-FR")} F`;
}

export default function PageSimulateur() {
  const router = useRouter();
  const [montant, setMontant] = useState("50000");
  const [duree, setDuree] = useState(2);

  const resultat = useMemo(() => {
    const capital = Number(montant) || 0;
    const tauxApplique = TAUX_PAR_DUREE[duree] ?? 0;
    const interets = (capital * tauxApplique) / 100;
    const total = capital + interets;
    return { capital, tauxApplique, interets, total };
  }, [montant, duree]);

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="purple" size={40}><SimulatorIcon size={20} /></IconCircle>
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Simulateur de prêt</h1>
          </div>
          <p className="text-[#7C8494] text-sm mb-6">
            Estimez le coût de votre prêt avant de soumettre une demande. Aucune information n&apos;est envoyée ici.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Montant souhaité (F)</label>
              <input type="number" min={1} value={montant} onChange={(e) => setMontant(e.target.value)} className={CHAMP_CLASSES} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Durée</label>
              <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className={CHAMP_CLASSES}>
                {Object.keys(TAUX_PAR_DUREE).map((s) => (
                  <option key={s} value={s}>
                    {Number(s) === 4 ? "1 mois" : `${s} semaine${Number(s) > 1 ? "s" : ""}`} — taux {TAUX_PAR_DUREE[Number(s)]}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-lg p-6">
          <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Estimation</p>
          <div className="space-y-1.5 text-sm font-mono">
            <LigneCout label="Capital" valeur={formaterMontant(resultat.capital)} />
            <LigneCout label={`Intérêt (${resultat.tauxApplique}%)`} valeur={formaterMontant(resultat.interets)} />
            <LigneCout label="Total à rembourser" valeur={formaterMontant(resultat.total)} gras />
            <LigneCout label="Paiement unique de" valeur={formaterMontant(resultat.total)} accent gras />
          </div>
        </div>

        <button
          onClick={() => router.push("/demande-pret")}
          className="w-full mt-4 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition"
        >
          Faire une vraie demande avec ces paramètres
        </button>
      </div>
    </main>
  );
}

function LigneCout({ label, valeur, gras, accent }: { label: string; valeur: string; gras?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${gras ? "border-t border-[#232733] pt-1.5 mt-1.5" : ""}`}>
      <span className={gras ? "text-[#E8E6DE] font-medium" : "text-[#7C8494]"}>{label}</span>
      <span className={accent ? "text-[#C9A227] font-medium" : gras ? "text-[#E8E6DE] font-medium" : "text-[#E8E6DE]"}>{valeur}</span>
    </div>
  );
}
