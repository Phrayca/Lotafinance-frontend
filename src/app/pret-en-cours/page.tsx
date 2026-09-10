"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirMesDemandesDePret, obtenirEcheances, LoanOut, Echeance } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

function formaterMontant(m?: number | null) {
  if (m == null) return "—";
  return `${m.toLocaleString("fr-FR")} F`;
}
function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PagePretEnCours() {
  const router = useRouter();
  const [pret, setPret] = useState<LoanOut | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
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
        const demandes = await obtenirMesDemandesDePret(token);
        const approuvees = demandes.filter((d) => d.status === "approuve");

        let pretActif: LoanOut | null = null;
        let echeancesActives: Echeance[] = [];

        for (const d of approuvees) {
          const ech = await obtenirEcheances(token, d.id);
          if (ech.some((e) => !e.payee)) {
            pretActif = d;
            echeancesActives = ech;
            break;
          }
          if (!pretActif) {
            pretActif = d;
            echeancesActives = ech;
          }
        }

        setPret(pretActif);
        setEcheances(echeancesActives);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();
  }, [router]);

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  if (!pret) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-[#5A6070] mb-4">Aucun prêt approuvé pour le moment.</p>
          <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#C9A227] underline">
            Retour au tableau de bord
          </button>
        </div>
      </main>
    );
  }

  const capital = pret.approved_amount ?? pret.amount_requested;
  const totalDu = pret.total_to_repay ?? 0;
  const totalPaye = echeances.filter((e) => e.payee).reduce((s, e) => s + e.montant, 0);
  const resteAPayer = Math.max(totalDu - totalPaye, 0);
  const progression = totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0;
  const tauxStandard = pret.facilite_paiement && pret.rate_percent_applied != null ? pret.rate_percent_applied - 10 : pret.rate_percent_applied;

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
          <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE] mb-1">Prêt en cours</h1>
          <p className="text-[#7C8494] text-sm mb-6">{pret.purpose || "Prêt personnel"}</p>

          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#7C8494]">Progression du remboursement</span>
            <span className="text-[#E8E6DE] font-mono">{progression}%</span>
          </div>
          <div className="h-2.5 bg-[#0B0E14] border border-[#1B1F29] rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[#C9A227]" style={{ width: `${progression}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[#7C8494] font-mono mb-6">
            <span>Payé : {formaterMontant(totalPaye)}</span>
            <span>Restant : {formaterMontant(resteAPayer)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm font-mono border-t border-[#232733] pt-4">
            <Ligne label="Capital emprunté" valeur={formaterMontant(capital)} />
            <Ligne label="Taux appliqué" valeur={pret.rate_percent_applied != null ? `${pret.rate_percent_applied}%` : "—"} />
            <Ligne label="Total à rembourser" valeur={formaterMontant(totalDu)} />
            <Ligne label="Durée" valeur={`${pret.duration_weeks} semaine(s)`} />
            {pret.facilite_paiement && (
              <>
                <Ligne label="Taux standard" valeur={tauxStandard != null ? `${tauxStandard}%` : "—"} />
                <Ligne label="Majoration facilité" valeur="+10%" />
              </>
            )}
          </div>
        </div>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Détail des échéances</h2>
          <div className="space-y-2">
            {echeances.map((e) => (
              <div key={e.id} className={`flex items-center justify-between border rounded-md p-3 ${e.payee ? "border-[#1E4A3D] bg-[#0F2420]" : "border-[#232733]"}`}>
                <div>
                  <p className="text-sm font-mono text-[#E8E6DE]">
                    Mensualité {e.numero} — {formaterMontant(e.montant)}
                  </p>
                  <p className="text-xs text-[#7C8494] mt-0.5">
                    {e.payee ? `Payée le ${formaterDate(e.payee_le)}` : `À payer avant le ${formaterDate(e.date_echeance)}`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${e.payee ? "bg-[#0F2420] text-[#3DDC97]" : "bg-[#2A2312] text-[#C9A227]"}`}>
                  {e.payee ? "✓ Payée" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {erreur && <p className="text-sm text-[#F0A0A0] mt-4">{erreur}</p>}
      </div>
    </main>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-[#7C8494] text-xs">{label}</p>
      <p className="text-[#E8E6DE] font-medium">{valeur}</p>
    </div>
  );
}
