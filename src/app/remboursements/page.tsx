"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirMesDemandesDePret, obtenirEcheances, declarerPaiementEcheance, LoanOut, Echeance } from "@/lib/api";
import { RepaymentIcon, HomeIcon, LoanIcon, LoanRequestIcon, DocumentIcon, ProfileIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
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

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/documents", label: "Docs", Icone: DocumentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

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

        {erreur && (
          <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}
        {succes && (
          <p className="text-sm text-[#3fa873] bg-[rgba(63,168,115,0.12)] border border-[rgba(63,168,115,0.3)] rounded-md px-3 py-2 mb-4">{succes}</p>
        )}

        {/* Échéances à payer */}
        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="green" size={40}><RepaymentIcon size={20} /></IconCircle>
            <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4]">Mes remboursements</h1>
          </div>
          <p className="text-[#8e99a8] text-sm mb-6">
            {aPayer.length > 0 ? `${aPayer.length} échéance${aPayer.length > 1 ? "s" : ""} à régler` : "Aucune échéance en attente"}
          </p>

          {aPayer.length === 0 ? (
            <p className="text-sm text-[#66707d] py-4 text-center">Vous n&apos;avez aucune échéance en attente pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {aPayer.map((e) => (
                <div key={e.id} className="border border-[rgba(255,255,255,0.08)] rounded-md p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-[#eef1f4]">{e.loanLabel} — Mensualité {e.numero}</p>
                      <p className="text-xs text-[#8e99a8] mt-0.5">
                        Échéance à régler avant le {formaterDate(e.date_echeance)}
                        {e.frais_retard === 0 && <span className="text-[#66707d]"> (passé cette date, elle sera considérée en retard)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[#c99a4b] font-medium block">{formaterMontant(e.montant + e.frais_retard)}</span>
                      {e.frais_retard > 0 && (
                        <span className="text-[10px] text-[#c0563b]">dont {formaterMontant(e.frais_retard)} de retard (1 000 F/jour)</span>
                      )}
                    </div>
                  </div>

                  {e.frais_retard > 0 && (
                    <div className="flex items-center gap-2 mt-3 bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 text-xs text-[#c0563b]">
                      ⚠️ Cette échéance est en retard depuis le {formaterDate(e.date_echeance)}. Des frais de 1 000 F par jour s&apos;accumulent jusqu&apos;au paiement.
                    </div>
                  )}

                  {e.declaration_reference ? (
                    <div className="flex items-center gap-2 mt-3 bg-[rgba(201,154,75,0.15)] border border-[rgba(201,154,75,0.3)] rounded-md px-3 py-2 text-xs text-[#c99a4b]">
                      ⏳ Paiement déclaré via {e.declaration_canal === "wave" ? "Wave" : "Orange Money"} (réf. {e.declaration_reference}) — en attente de confirmation par notre équipe.
                    </div>
                  ) : echeanceOuverte === e.id ? (
                    <div className="mt-3 border-t border-[rgba(255,255,255,0.08)] pt-3 space-y-2">
                      <div className="flex gap-2">
                        {CANAUX.map((c) => (
                          <button
                            key={c.valeur}
                            onClick={() => setCanal(c.valeur)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                              canal === c.valeur ? "bg-[#c99a4b] text-[#10151c]" : "bg-[#10151c] border border-[rgba(255,255,255,0.08)] text-[#8e99a8]"
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
                        className="w-full bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2 text-sm text-[#eef1f4] placeholder-[#66707d] focus:outline-none focus:border-[#c99a4b] transition"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => soumettreDeclaration(e)}
                          disabled={envoiEnCours}
                          className="flex-1 bg-[#c99a4b] text-[#10151c] text-xs font-semibold py-2 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50"
                        >
                          {envoiEnCours ? "Envoi..." : "Confirmer ma déclaration"}
                        </button>
                        <button
                          onClick={() => { setEcheanceOuverte(null); setReference(""); }}
                          className="text-xs font-medium text-[#8e99a8] px-3 py-2 hover:text-[#eef1f4] transition"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEcheanceOuverte(e.id); setSucces(""); }}
                      className="mt-3 text-xs font-medium bg-[#10151c] border border-[rgba(255,255,255,0.08)] text-[#c99a4b] px-3 py-1.5 rounded-md hover:border-[rgba(255,255,255,0.16)] transition"
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
        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          <p className="text-[#8e99a8] text-sm mb-1">Total déjà remboursé</p>
          <p className="text-3xl font-mono font-semibold text-[#3fa873] mb-6">{formaterMontant(total)}</p>

          {remboursements.length === 0 ? (
            <p className="text-sm text-[#66707d] py-8 text-center">Aucun remboursement confirmé pour le moment.</p>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.08)]">
              {remboursements.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-[#eef1f4]">{e.loanLabel}</p>
                    <p className="text-xs text-[#8e99a8]">{formaterDate(e.payee_le)}</p>
                  </div>
                  <span className="font-mono text-[#3fa873] font-medium">{formaterMontant(e.montant)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barre de navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#10151c]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around py-2 px-1">
        {LIENS_NAV_MOBILE.map((lien) => {
          const estActif = lien.href === "/remboursements";
          const Icone = lien.Icone;
          return (
            <button
              key={lien.href}
              onClick={() => router.push(lien.href)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <span className={estActif ? "text-[#c99a4b]" : "text-[#8e99a8]"}>
                <Icone size={20} />
              </span>
              <span className={`text-[9px] ${estActif ? "text-[#c99a4b] font-medium" : "text-[#8e99a8]"}`}>{lien.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
