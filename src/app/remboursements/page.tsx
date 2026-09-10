"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirMesDemandesDePret, obtenirEcheances, declarerPaiementEcheance, LoanOut, Echeance } from "@/lib/api";
import { RepaymentIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CANAUX = [
  { valeur: "wave", libelle: "🌊 Wave" },
  { valeur: "orange_money", libelle: "🟠 Orange Money" },
];

type EcheanceAvecPret = Echeance & { loanId: string; loanLabel: string };

function formaterMontant(m?: number | null) {
  if (m == null) return "—";
  return `${m.toLocaleString("fr-FR")} F`;
}
function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PageRemboursements() {
  const router = useRouter();
  const [aPayer, setAPayer] = useState<EcheanceAvecPret[]>([]);
  const [remboursements, setRemboursements] = useState<EcheanceAvecPret[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const [echeanceOuverte, setEcheanceOuverte] = useState<string | null>(null);
  const [canal, setCanal] = useState("wave");
  const [reference, setReference] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function chargerTout() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    try {
      const demandes: LoanOut[] = await obtenirMesDemandesDePret(token);
      const approuvees = demandes.filter((d) => d.status === "approuve");

      const listes = await Promise.all(
        approuvees.map(async (d) => {
          const echeances = await obtenirEcheances(token, d.id);
          return echeances.map((e) => ({ ...e, loanId: d.id, loanLabel: d.purpose || "Prêt personnel" }));
        })
      );

      const toutes = listes.flat();
      const payees = toutes.filter((e) => e.payee).sort((a, b) => (b.payee_le || "").localeCompare(a.payee_le || ""));
      const nonPayees = toutes.filter((e) => !e.payee).sort((a, b) => a.date_echeance.localeCompare(b.date_echeance));

      setRemboursements(payees);
      setAPayer(nonPayees);
      setTotal(payees.reduce((s, e) => s + e.montant, 0));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerTout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function soumettreDeclaration(e: EcheanceAvecPret) {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!reference.trim()) {
      setErreur("Merci d'indiquer le numéro de transaction.");
      return;
    }
    setErreur("");
    setEnvoiEnCours(true);
    try {
      await declarerPaiementEcheance(token, e.loanId, e.id, canal, reference.trim());
      setSucces("Paiement déclaré ! Notre équipe va vérifier et confirmer sous peu.");
      setEcheanceOuverte(null);
      setReference("");
      await chargerTout();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la déclaration");
    } finally {
      setEnvoiEnCours(false);
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
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        {erreur && (
          <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}
        {succes && (
          <p className="text-sm text-[#3DDC97] bg-[#0F2420] border border-[#1E4A3D] rounded-md px-3 py-2 mb-4">{succes}</p>
        )}

        {/* Échéances à payer */}
        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="green" size={40}><RepaymentIcon size={20} /></IconCircle>
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Mes remboursements</h1>
          </div>
          <p className="text-[#7C8494] text-sm mb-6">
            {aPayer.length > 0 ? `${aPayer.length} échéance${aPayer.length > 1 ? "s" : ""} à régler` : "Aucune échéance en attente"}
          </p>

          {aPayer.length === 0 ? (
            <p className="text-sm text-[#5A6070] py-4 text-center">Vous n&apos;avez aucune échéance en attente pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {aPayer.map((e) => (
                <div key={e.id} className="border border-[#232733] rounded-md p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-[#E8E6DE]">{e.loanLabel} — Mensualité {e.numero}</p>
                      <p className="text-xs text-[#7C8494] mt-0.5">
                        Échéance à régler avant le {formaterDate(e.date_echeance)}
                        {e.frais_retard === 0 && <span className="text-[#5A6070]"> (passé cette date, elle sera considérée en retard)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[#C9A227] font-medium block">{formaterMontant(e.montant + e.frais_retard)}</span>
                      {e.frais_retard > 0 && (
                        <span className="text-[10px] text-[#F0A0A0]">dont {formaterMontant(e.frais_retard)} de retard (1 000 F/jour)</span>
                      )}
                    </div>
                  </div>

                  {e.frais_retard > 0 && (
                    <div className="flex items-center gap-2 mt-3 bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 text-xs text-[#F0A0A0]">
                      ⚠️ Cette échéance est en retard depuis le {formaterDate(e.date_echeance)}. Des frais de 1 000 F par jour s&apos;accumulent jusqu&apos;au paiement.
                    </div>
                  )}

                  {e.declaration_reference ? (
                    <div className="flex items-center gap-2 mt-3 bg-[#1B1706] border border-[#3A3013] rounded-md px-3 py-2 text-xs text-[#C9A227]">
                      ⏳ Paiement déclaré via {e.declaration_canal === "wave" ? "Wave" : "Orange Money"} (réf. {e.declaration_reference}) — en attente de confirmation par notre équipe.
                    </div>
                  ) : echeanceOuverte === e.id ? (
                    <div className="mt-3 border-t border-[#1B1F29] pt-3 space-y-2">
                      <div className="flex gap-2">
                        {CANAUX.map((c) => (
                          <button
                            key={c.valeur}
                            onClick={() => setCanal(c.valeur)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                              canal === c.valeur ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#0B0E14] border border-[#232733] text-[#7C8494]"
                            }`}
                          >
                            {c.libelle}
                          </button>
                        ))}
                      </div>
                      <input
                        value={reference}
                        onChange={(ev) => setReference(ev.target.value)}
                        placeholder="Numéro de transaction"
                        className="w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => soumettreDeclaration(e)}
                          disabled={envoiEnCours}
                          className="flex-1 bg-[#C9A227] text-[#0B0E14] text-xs font-semibold py-2 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
                        >
                          {envoiEnCours ? "Envoi..." : "Confirmer ma déclaration"}
                        </button>
                        <button
                          onClick={() => { setEcheanceOuverte(null); setReference(""); }}
                          className="text-xs font-medium text-[#7C8494] px-3 py-2 hover:text-[#E8E6DE] transition"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEcheanceOuverte(e.id); setSucces(""); }}
                      className="mt-3 text-xs font-medium bg-[#0B0E14] border border-[#232733] text-[#C9A227] px-3 py-1.5 rounded-md hover:border-[#3A4050] transition"
                    >
                      J&apos;ai payé cette échéance
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique */}
        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <p className="text-[#7C8494] text-sm mb-1">Total déjà remboursé</p>
          <p className="text-3xl font-mono font-semibold text-[#3DDC97] mb-6">{formaterMontant(total)}</p>

          {remboursements.length === 0 ? (
            <p className="text-sm text-[#5A6070] py-8 text-center">Aucun remboursement confirmé pour le moment.</p>
          ) : (
            <div className="divide-y divide-[#1B1F29]">
              {remboursements.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-[#E8E6DE]">{e.loanLabel}</p>
                    <p className="text-xs text-[#7C8494]">{formaterDate(e.payee_le)}</p>
                  </div>
                  <span className="font-mono text-[#3DDC97] font-medium">{formaterMontant(e.montant)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
