"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { soumettreDemandeDePret, obtenirMonProfilClient, obtenirPretEnCours, obtenirMonPlafond, DemandePret, ProfilClient } from "@/lib/api";
import { LoanRequestIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

const DUREES_DISPONIBLES = [
  { valeur: 2, libelle: "2 semaines" },
  { valeur: 4, libelle: "1 mois" },
];

const TAUX_ESTIME_PAR_DUREE: Record<number, number> = { 2: 5, 4: 10 };

// Frais de traitement fixes, prélevés une seule fois sur le montant versé (n'affectent pas le total à rembourser)
const FRAIS_DE_TRAITEMENT = 1000;

type ResultatDemande = {
  credit_score?: number | null;
  risk_level?: string | null;
  recommended_amount?: number | null;
  rate_percent_applied?: number | null;
  total_to_repay?: number | null;
  status: string;
  approved_amount?: number | null;
  facilite_paiement?: boolean;
};

function formaterMontant(m: number) {
  return `${m.toLocaleString("fr-FR")} F`;
}

type Etape = "formulaire" | "recap" | "resultat";

const MESSAGE_PRET_EN_COURS =
  "Vous avez actuellement un prêt en cours de remboursement chez Lotafinance. Pour des raisons de gestion des risques, une nouvelle demande ne peut pas être soumise tant que votre prêt actuel n'est pas intégralement remboursé. Vous pouvez suivre l'état de votre remboursement depuis la page « Prêt en cours ».";

export default function PageDemandePret() {
  const router = useRouter();
  const [profilClient, setProfilClient] = useState<ProfilClient | null>(null);
  const [montant, setMontant] = useState("");
  const [duree, setDuree] = useState(2);
  const [motif, setMotif] = useState("");

  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState<ResultatDemande | null>(null);
  const [etape, setEtape] = useState<Etape>("formulaire");
  const [conditionsAcceptees, setConditionsAcceptees] = useState(false);
  const [signature, setSignature] = useState("");
  const [pretEnCours, setPretEnCours] = useState<boolean | null>(null);
  const [plafond, setPlafond] = useState<number | null>(null);
  const [nombrePretsReussis, setNombrePretsReussis] = useState(0);
  const [canalVersement, setCanalVersement] = useState<"wave" | "orange_money">("wave");
  const [numeroVersement, setNumeroVersement] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    obtenirPretEnCours(token).then((s) => setPretEnCours(s.a_un_pret_en_cours)).catch(() => setPretEnCours(false));
    obtenirMonPlafond(token)
      .then((p) => {
        setPlafond(p.plafond ?? null);
        setNombrePretsReussis(p.nombre_prets_reussis);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    obtenirMonProfilClient(token).then(setProfilClient).catch(() => {});
  }, []);

  const montantNombre = Number(montant) || 0;
  const tauxBase = TAUX_ESTIME_PAR_DUREE[duree] ?? 0;
  const tauxEstime = tauxBase;
  const interetEstime = Math.round((montantNombre * tauxEstime) / 100);
  const totalEstime = montantNombre + interetEstime;

  const nomComplet = profilClient ? `${profilClient.first_name} ${profilClient.last_name}`.trim() : "";
  const signatureValide = signature.trim().length > 1 && nomComplet
    ? signature.trim().toLowerCase() === nomComplet.toLowerCase()
    : signature.trim().length > 1;

  function passerAuRecap(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!montantNombre || montantNombre <= 0) {
      setErreur("Merci d'indiquer un montant valide.");
      return;
    }

    if (plafond != null && montantNombre > plafond) {
      setErreur(`Le montant demandé dépasse votre plafond actuel de ${formaterMontant(plafond)}. Ce plafond augmente à chaque prêt remboursé avec succès.`);
      return;
    }

    if (!numeroVersement.trim()) {
      setErreur("Merci d'indiquer le numéro Wave ou Orange Money qui recevra les fonds.");
      return;
    }

    setEtape("recap");
  }

  async function confirmerEtEnvoyer() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    const demande: DemandePret = {
      amount_requested: montantNombre,
      duration_weeks: duree,
      purpose: motif || undefined,
      facilite_paiement: false,
      payout_channel: canalVersement,
      payout_phone: numeroVersement.trim(),
    };

    setEnvoi(true);
    setErreur("");
    try {
      const reponse = await soumettreDemandeDePret(token, demande);
      setResultat(reponse);
      setEtape("resultat");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          {pretEnCours ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <IconCircle color="gold" size={40}><LoanRequestIcon size={20} /></IconCircle>
                <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Demande de prêt</h1>
              </div>
              <p className="text-[#7C8494] text-sm mb-6">Votre score de solvabilité sera calculé automatiquement.</p>
              <div className="bg-[#1B1706] border border-[#3A3013] rounded-md p-4 text-sm text-[#C9A227] leading-relaxed">
                {MESSAGE_PRET_EN_COURS}
              </div>
              <button
                onClick={() => router.push("/pret-en-cours")}
                className="w-full mt-4 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition"
              >
                Voir mon prêt en cours
              </button>
            </>
          ) : etape === "formulaire" ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <IconCircle color="gold" size={40}><LoanRequestIcon size={20} /></IconCircle>
                <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Demande de prêt</h1>
              </div>
              <p className="text-[#7C8494] text-sm mb-4">Votre score de solvabilité sera calculé automatiquement.</p>

              {plafond != null && (
                <div className="bg-[#1B1706] border border-[#3A3013] rounded-md px-4 py-3 mb-5 text-sm text-[#C9A227]">
                  Vu votre historique ({nombrePretsReussis} prêt{nombrePretsReussis > 1 ? "s" : ""} remboursé{nombrePretsReussis > 1 ? "s" : ""} avec succès), vous pouvez emprunter jusqu&apos;à{" "}
                  <strong>{formaterMontant(plafond)}</strong> pour cette demande. Ce plafond augmente à chaque prêt bien remboursé.
                </div>
              )}

              <form onSubmit={passerAuRecap} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#B8BAC4] mb-1">
                    Montant demandé (F) <span className="text-[#C24545]">*</span>
                  </label>
                  <input type="number" min={1} required value={montant} onChange={(e) => setMontant(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex: 50000" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8BAC4] mb-1">
                    Durée <span className="text-[#C24545]">*</span>
                  </label>
                  <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className={CHAMP_CLASSES}>
                    {DUREES_DISPONIBLES.map((d) => (
                      <option key={d.valeur} value={d.valeur}>{d.libelle}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Motif du prêt</label>
                  <input value={motif} onChange={(e) => setMotif(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex: achat de marchandises" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#B8BAC4] mb-1">
                    Où souhaitez-vous recevoir les fonds ? <span className="text-[#C24545]">*</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setCanalVersement("wave")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition ${
                        canalVersement === "wave" ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#0B0E14] border border-[#232733] text-[#7C8494]"
                      }`}
                    >
                      🌊 Wave
                    </button>
                    <button
                      type="button"
                      onClick={() => setCanalVersement("orange_money")}
                      className={`flex-1 text-sm font-medium py-2 rounded-md transition ${
                        canalVersement === "orange_money" ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#0B0E14] border border-[#232733] text-[#7C8494]"
                      }`}
                    >
                      🟠 Orange Money
                    </button>
                  </div>
                  <input
                    type="tel"
                    required
                    value={numeroVersement}
                    onChange={(e) => setNumeroVersement(e.target.value)}
                    className={CHAMP_CLASSES}
                    placeholder="Ex: 77 123 45 67"
                  />
                  <p className="text-[10px] text-[#5A6070] mt-1">
                    C&apos;est ce numéro qui recevra le montant si votre demande est approuvée.
                  </p>
                </div>

                {erreur && (
                  <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2">{erreur}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition"
                >
                  Voir le récapitulatif
                </button>
              </form>
            </>
          ) : etape === "recap" ? (
            <>
              <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE] mb-1">Récapitulatif et contrat</h1>
              <p className="text-[#7C8494] text-sm mb-6">
                Vérifiez les conditions ci-dessous avant d&apos;envoyer votre demande à Lotafinance.
              </p>

              <div className="bg-[#0B0E14] border border-[#232733] rounded-md p-4 mb-5 space-y-2 text-sm font-mono">
                <LigneResultat label="Montant demandé" valeur={formaterMontant(montantNombre)} />
                <LigneResultat label="Durée" valeur={DUREES_DISPONIBLES.find((d) => d.valeur === duree)?.libelle || ""} />
                <LigneResultat label="Motif" valeur={motif || "—"} />
                <LigneResultat label="Versement des fonds" valeur={`${canalVersement === "wave" ? "Wave" : "Orange Money"} — ${numeroVersement}`} />
                <LigneResultat label="Taux estimé" valeur={`${tauxEstime}%`} />
                <LigneResultat label="Intérêts estimés" valeur={formaterMontant(interetEstime)} />
                <LigneResultat label="Total estimé à rembourser" valeur={formaterMontant(totalEstime)} />
                <LigneResultat label="Frais de traitement" valeur={`− ${formaterMontant(FRAIS_DE_TRAITEMENT)}`} />
                <LigneResultat label="Montant net que vous recevrez" valeur={formaterMontant(Math.max(montantNombre - FRAIS_DE_TRAITEMENT, 0))} />
              </div>
              <p className="text-[11px] text-[#5A6070] mb-5">
                Ces chiffres sont une estimation. Le score, le taux définitif et l&apos;échéancier exact seront confirmés
                juste après l&apos;envoi, puis lors de la décision de l&apos;analyste. Les frais de traitement de{" "}
                {formaterMontant(FRAIS_DE_TRAITEMENT)} sont prélevés une seule fois sur le montant versé — ils ne s&apos;ajoutent
                pas au montant à rembourser.
              </p>

              <div className="bg-[#1B1706] border border-[#3A3013] rounded-md p-4 mb-5 text-xs text-[#B8BAC4] leading-relaxed space-y-2">
                <p className="text-[#C9A227] font-medium text-sm mb-1">Contrat de prêt Lotafinance</p>
                <p>
                  En envoyant cette demande, <strong className="text-[#E8E6DE]">{nomComplet || "le client"}</strong> reconnaît
                  avoir pris connaissance du montant demandé, de la durée, du taux estimé ci-dessus, et s&apos;engage,
                  en cas d&apos;approbation par Lotafinance, à rembourser l&apos;intégralité du montant dû aux échéances
                  qui lui seront communiquées.
                </p>
                <p>
                  En retour, <strong className="text-[#E8E6DE]">Lotafinance</strong> s&apos;engage, si le dossier est approuvé,
                  à verser le montant accordé au client et à respecter strictement les conditions de taux et
                  d&apos;échéancier décrites dans son espace personnel.
                </p>
                <p className="text-[#7C8494]">
                  Cette demande n&apos;engage pas encore de décision : elle sera étudiée par un analyste Lotafinance,
                  qui pourra approuver, refuser, ou demander des informations complémentaires.
                </p>
              </div>

              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conditionsAcceptees}
                  onChange={(e) => setConditionsAcceptees(e.target.checked)}
                  className="mt-0.5 accent-[#C9A227]"
                />
                <span className="text-sm text-[#B8BAC4]">J&apos;ai lu et j&apos;accepte les conditions de ce contrat.</span>
              </label>

              <div className="mb-5">
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">
                  Signature — tapez votre nom complet pour valider {nomComplet && <span className="text-[#5A6070] font-normal">({nomComplet})</span>}
                </label>
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className={`${CHAMP_CLASSES} font-['Source_Serif_4',serif] italic`}
                  placeholder="Votre nom complet"
                />
              </div>

              {erreur && (
                <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setEtape("formulaire")}
                  className="flex-1 text-sm font-medium text-[#7C8494] border border-[#232733] rounded-md py-2.5 hover:bg-[#171B24] transition"
                >
                  Modifier ma demande
                </button>
                <button
                  onClick={confirmerEtEnvoyer}
                  disabled={!conditionsAcceptees || !signatureValide || envoi}
                  className="flex-1 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-40"
                >
                  {envoi ? "Envoi en cours..." : "Signer et envoyer ma demande"}
                </button>
              </div>
            </>
          ) : etape === "resultat" && resultat ? (
            <>
              <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE] mb-1">
                {resultat.status === "approuve" ? "Prêt approuvé !" : resultat.status === "refuse" ? "Demande refusée" : "Demande envoyée"}
              </h1>
              <p className="text-[#7C8494] text-sm mb-4">Voici le résultat définitif calculé par Lotafinance.</p>
              <p className="text-xs text-[#5A6070] mb-4">📧 Un récapitulatif de votre contrat a été envoyé à votre adresse email.</p>

              {resultat.status === "approuve" && (
                <div className="bg-[#0F2420] border border-[#1E4A3D] rounded-md px-4 py-3 mb-5 text-sm text-[#3DDC97]">
                  🎉 Félicitations ! Votre score de solvabilité a permis une approbation automatique et immédiate. Le montant sera versé selon nos délais habituels.
                </div>
              )}
              {resultat.status === "refuse" && (
                <div className="bg-[#2A1414] border border-[#4A2222] rounded-md px-4 py-3 mb-5 text-sm text-[#F0A0A0]">
                  Votre demande n&apos;a malheureusement pas pu être acceptée automatiquement au vu de votre profil actuel. Vous pouvez retenter une demande ultérieurement.
                </div>
              )}
              {resultat.status === "soumis" && (
                <div className="bg-[#1B1706] border border-[#3A3013] rounded-md px-4 py-3 mb-5 text-sm text-[#C9A227]">
                  Votre dossier est en cours d&apos;analyse par notre équipe — vous serez notifié dès qu&apos;une décision sera prise.
                </div>
              )}

              <div className="space-y-2 text-sm mb-6">
                <LigneResultat label="Statut" valeur={resultat.status} />
                <LigneResultat label="Score de solvabilité" valeur={resultat.credit_score?.toString() ?? "—"} />
                <LigneResultat label="Niveau de risque" valeur={resultat.risk_level ?? "—"} />
                <LigneResultat
                  label="Taux appliqué"
                  valeur={resultat.rate_percent_applied != null ? `${resultat.rate_percent_applied}%` : "—"}
                />
                <LigneResultat
                  label="Montant total à rembourser"
                  valeur={resultat.total_to_repay != null ? formaterMontant(resultat.total_to_repay) : "—"}
                />
                {resultat.status === "approuve" && resultat.approved_amount != null ? (
                  <>
                    <LigneResultat label="Frais de traitement" valeur={`− ${formaterMontant(FRAIS_DE_TRAITEMENT)}`} />
                    <LigneResultat label="Montant net reçu" valeur={formaterMontant(Math.max(resultat.approved_amount - FRAIS_DE_TRAITEMENT, 0))} />
                  </>
                ) : (
                  <LigneResultat
                    label="Montant recommandé"
                    valeur={resultat.recommended_amount != null ? formaterMontant(resultat.recommended_amount) : "—"}
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/tableau-de-bord")}
                  className="flex-1 text-sm font-medium text-[#7C8494] border border-[#232733] rounded-md py-2.5 hover:bg-[#171B24] transition"
                >
                  Retour au tableau de bord
                </button>
                <button
                  onClick={() => router.push("/mes-demandes")}
                  className="flex-1 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition"
                >
                  Voir mes demandes
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function LigneResultat({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between border-b border-[#1B1F29] pb-2 font-mono">
      <span className="text-[#7C8494]">{label}</span>
      <span className="font-medium text-[#E8E6DE]">{valeur}</span>
    </div>
  );
}
