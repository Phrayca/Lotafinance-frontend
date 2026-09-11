"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirMesDemandesDePret, obtenirEcheances, LoanOut, Echeance } from "@/lib/api";
import { LoanIcon, HomeIcon, LoanRequestIcon, RepaymentIcon, ProfileIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
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

function formaterMontant(montant?: number | null) {
  if (montant == null) return "—";
  return `${montant.toLocaleString("fr-FR")} F`;
}

function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function formaterDuree(semaines: number) {
  if (semaines === 4) return "1 mois";
  return `${semaines} semaine${semaines > 1 ? "s" : ""}`;
}

/* ---------- Score Lotafinance ---------- */
function calculerScoreLotafinance(demandes: LoanOut[], echeancesParPret: Record<string, Echeance[]>) {
  const approuvees = demandes.filter((d) => d.status === "approuve" && d.credit_score != null);
  if (approuvees.length === 0) return null;

  const dernierScore = approuvees[0].credit_score as number;

  const toutesEcheances = approuvees.flatMap((d) => echeancesParPret[d.id] || []);
  const payees = toutesEcheances.filter((e) => e.payee);
  const ratioFiabilite = toutesEcheances.length > 0 ? payees.length / toutesEcheances.length : 1;

  const score = Math.round(dernierScore * 0.75 + ratioFiabilite * 100 * 0.25);
  return Math.max(0, Math.min(100, score));
}

function libelleEtCouleurScore(score: number): { libelle: string; couleur: string; bg: string } {
  if (score >= 80) return { libelle: "Excellent", couleur: "#3DDC97", bg: "#0F2420" };
  if (score >= 60) return { libelle: "Bon", couleur: "#3DDC97", bg: "#0F2420" };
  if (score >= 40) return { libelle: "Moyen", couleur: "#C9A227", bg: "#2A2312" };
  return { libelle: "À surveiller", couleur: "#F0A0A0", bg: "#2A1414" };
}

function estimerCreditPotentiel(score: number, dernierMontant: number) {
  const facteur = 1 + (score - 50) / 100; // 0.5x à 1.5x selon le score
  const brut = dernierMontant * facteur;
  return Math.max(10000, Math.round(brut / 5000) * 5000);
}

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

export default function PageMesDemandes() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<LoanOut[]>([]);
  const [echeancesParPret, setEcheancesParPret] = useState<Record<string, Echeance[]>>({});
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
        const liste = await obtenirMesDemandesDePret(token);
        setDemandes(liste);

        const approuvees = liste.filter((d) => d.status === "approuve");
        const entries = await Promise.all(
          approuvees.map(async (d) => [d.id, await obtenirEcheances(token, d.id)] as const)
        );
        setEcheancesParPret(Object.fromEntries(entries));
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

  const approuvees = demandes.filter((d) => d.status === "approuve");
  const score = calculerScoreLotafinance(demandes, echeancesParPret);
  const infosScore = score != null ? libelleEtCouleurScore(score) : null;
  const dernierMontantApprouve = approuvees[0]?.approved_amount ?? approuvees[0]?.amount_requested;
  const creditPotentiel = score != null && dernierMontantApprouve ? estimerCreditPotentiel(score, dernierMontantApprouve) : null;

  // Historique global des remboursements (toutes demandes confondues)
  const historiqueRemboursements = approuvees
    .flatMap((d) =>
      (echeancesParPret[d.id] || [])
        .filter((e) => e.payee)
        .map((e) => ({ ...e, loanLabel: d.purpose || "Prêt personnel", loanAmount: d.amount_requested }))
    )
    .sort((a, b) => (b.payee_le || "").localeCompare(a.payee_le || ""));

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10 pb-28 md:pb-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        {/* Score Lotafinance + Crédit potentiel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-5">
            <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-2">Score Lotafinance</p>
            {score != null && infosScore ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-semibold text-[#E8E6DE]">{score}</span>
                  <span className="text-sm text-[#5A6070]">/100</span>
                </div>
                <span
                  className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: infosScore.bg, color: infosScore.couleur }}
                >
                  {infosScore.libelle}
                </span>
                <p className="text-[11px] text-[#5A6070] mt-2">
                  Basé sur votre solvabilité et votre fiabilité de remboursement.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#5A6070] mt-2">
                Faites approuver une première demande pour obtenir votre score.
              </p>
            )}
          </div>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-5">
            <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-2">Crédit potentiel</p>
            {creditPotentiel != null ? (
              <>
                <span className="text-2xl font-mono font-semibold text-[#C9A227]">{formaterMontant(creditPotentiel)}</span>
                <p className="text-[11px] text-[#5A6070] mt-2">
                  Estimation indicative selon votre historique, non contractuelle.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#5A6070] mt-2">Disponible après une première demande approuvée.</p>
            )}
          </div>
        </div>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="blue" size={40}><LoanIcon size={20} /></IconCircle>
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Mes demandes</h1>
          </div>
          <p className="text-[#7C8494] text-sm mb-6">
            {demandes.length} demande{demandes.length > 1 ? "s" : ""} au total
          </p>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {demandes.length === 0 && !erreur && (
            <div className="text-center py-8">
              <p className="text-sm text-[#5A6070] mb-4">Vous n&apos;avez encore soumis aucune demande.</p>
              <button
                onClick={() => router.push("/demande-pret")}
                className="text-sm font-semibold bg-[#C9A227] text-[#0B0E14] px-4 py-2 rounded-md hover:bg-[#DDB63A] transition"
              >
                Faire une demande
              </button>
            </div>
          )}

          <div className="space-y-3">
            {demandes.map((d) => {
              const couleur = couleurStatut(d.status);
              const echeances = echeancesParPret[d.id];

              // Décomposition du coût du prêt
              const capital = d.approved_amount ?? d.amount_requested;
              const tauxTotal = d.rate_percent_applied ?? 0;
              const tauxStandard = d.facilite_paiement ? tauxTotal - 10 : tauxTotal;
              const interetStandard = Math.round((capital * tauxStandard) / 100);
              const interetFacilite = d.facilite_paiement ? Math.round((capital * 10) / 100) : 0;
              const totalStandard = capital + interetStandard;
              const totalAvecFacilite = capital + interetStandard + interetFacilite;

              const totalPayeDuPret = (echeances || []).filter((e) => e.payee).reduce((s, e) => s + e.montant, 0);
              const totalDuDuPret = d.total_to_repay ?? 0;
              const resteDuPret = Math.max(totalDuDuPret - totalPayeDuPret, 0);
              const progressionPret = totalDuDuPret > 0 ? Math.round((totalPayeDuPret / totalDuDuPret) * 100) : 0;

              return (
                <div key={d.id} className="border border-[#232733] rounded-md p-4">
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-[#E8E6DE] font-mono">
                        {formaterMontant(d.amount_requested)} — {formaterDuree(d.duration_weeks)}
                      </p>
                      <p className="text-xs text-[#5A6070] mt-0.5">Demandé le {formaterDate(d.submitted_at)}</p>
                      {d.purpose && <p className="text-xs text-[#7C8494] mt-0.5">{d.purpose}</p>}
                      {d.facilite_paiement && (
                        <p className="text-xs text-[#C9A227] mt-0.5">Facilité de paiement — 2 mensualités</p>
                      )}
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: couleur.bg, color: couleur.text }}
                    >
                      {LIBELLES_STATUT[d.status] || d.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-[#1B1F29] pt-3">
                    <ChampDetail label="Taux" valeur={d.rate_percent_applied != null ? `${d.rate_percent_applied}%` : "—"} />
                    <ChampDetail label="Total à rembourser" valeur={formaterMontant(d.total_to_repay)} />
                    <ChampDetail label="Score" valeur={d.credit_score?.toString() ?? "—"} />
                    <ChampDetail label="Risque" valeur={d.risk_level ?? "—"} />
                    {d.status === "approuve" && (
                      <>
                        <ChampDetail label="Montant approuvé" valeur={formaterMontant(d.approved_amount)} />
                        <ChampDetail label="Décidé le" valeur={formaterDate(d.decided_at)} />
                      </>
                    )}
                    {d.decision_reason && (
                      <div className="col-span-2">
                        <p className="text-[#7C8494]">Commentaire de l&apos;analyste</p>
                        <p className="text-[#B8BAC4] font-sans mt-0.5">{d.decision_reason}</p>
                      </div>
                    )}
                  </div>

                  {d.status === "approuve" && (
                    <>
                      {/* Progression visuelle */}
                      <div className="border-t border-[#1B1F29] mt-3 pt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#7C8494]">Progression du remboursement</span>
                          <span className="text-[#E8E6DE] font-mono">{progressionPret}%</span>
                        </div>
                        <div className="h-2 bg-[#0B0E14] border border-[#1B1F29] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A227]" style={{ width: `${progressionPret}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#7C8494] mt-1.5 font-mono">
                          <span>Payé : {formaterMontant(totalPayeDuPret)}</span>
                          <span>Restant : {formaterMontant(resteDuPret)}</span>
                        </div>
                      </div>

                      {/* Coût de mon prêt */}
                      <div className="border-t border-[#1B1F29] mt-3 pt-3">
                        <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-2">Coût de mon prêt</p>
                        <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-md p-3 space-y-1.5 text-xs font-mono">
                          <LigneCout label="Capital" valeur={formaterMontant(capital)} />
                          <LigneCout label={`Intérêt standard (${tauxStandard}%)`} valeur={formaterMontant(interetStandard)} />
                          <LigneCout label="Total standard" valeur={formaterMontant(totalStandard)} gras />
                          {d.facilite_paiement && (
                            <>
                              <LigneCout label="Facilité de paiement (2 mois)" valeur={`+ ${formaterMontant(interetFacilite)}`} accent />
                              <LigneCout label="Total avec facilité" valeur={formaterMontant(totalAvecFacilite)} gras />
                              <LigneCout label="2 mensualités de" valeur={formaterMontant(Math.round(totalAvecFacilite / 2))} accent />
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {d.status === "approuve" && echeances && echeances.length > 0 && (
                    <div className="border-t border-[#1B1F29] mt-3 pt-3">
                      <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-2">Échéancier</p>
                      <div className="space-y-2">
                        {echeances.map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-xs bg-[#0B0E14] border border-[#1B1F29] rounded-md px-3 py-2">
                            <div>
                              <p className="text-[#E8E6DE] font-mono">
                                Mensualité {e.numero} — {formaterMontant(e.montant)}
                              </p>
                              <p className="text-[#7C8494] mt-0.5">
                                {e.payee ? `Payée le ${e.payee_le ? formaterDate(e.payee_le) : ""}` : `Échéance : ${formaterDate(e.date_echeance)}`}
                              </p>
                            </div>
                            {e.payee ? (
                              <span className="text-[#3DDC97] font-medium">✓ Payée</span>
                            ) : (
                              <span className="text-[#C9A227] font-medium">En attente de confirmation</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Historique des remboursements */}
        {historiqueRemboursements.length > 0 && (
          <div id="historique-remboursements" className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mt-4 scroll-mt-6">
            <h2 className="text-sm font-medium text-[#E8E6DE] mb-3">Historique des remboursements</h2>
            <div className="divide-y divide-[#1B1F29]">
              {historiqueRemboursements.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="text-[#E8E6DE]">{e.loanLabel}</p>
                    <p className="text-xs text-[#7C8494]">{e.payee_le ? formaterDate(e.payee_le) : "—"}</p>
                  </div>
                  <span className="font-mono text-[#3DDC97]">{formaterMontant(e.montant)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barre de navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#0B0E14]/95 backdrop-blur border-t border-[#1B1F29] flex items-center justify-around py-2 px-1">
        {LIENS_NAV_MOBILE.map((lien) => {
          const estActif = lien.href === "/mes-demandes";
          const Icone = lien.Icone;
          return (
            <button
              key={lien.href}
              onClick={() => router.push(lien.href)}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <span className={estActif ? "text-[#C9A227]" : "text-[#7C8494]"}>
                <Icone size={20} />
              </span>
              <span className={`text-[9px] ${estActif ? "text-[#C9A227] font-medium" : "text-[#7C8494]"}`}>{lien.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function ChampDetail({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-[#7C8494]">{label}</p>
      <p className="text-[#E8E6DE]">{valeur}</p>
    </div>
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
