"use client";

import { useRouter } from "next/navigation";
import { DocumentIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-[#C9A227] uppercase tracking-wide mb-2">{titre}</h2>
      <div className="text-sm text-[#B8BAC4] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PageInformations() {
  const router = useRouter();

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="blue" size={40}><DocumentIcon size={20} /></IconCircle>
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Informations Lotafinance</h1>
          </div>
          <p className="text-[#7C8494] text-sm mb-6">Tout savoir sur le fonctionnement de notre service</p>

          <Section titre="Qui peut emprunter chez Lotafinance ?">
            <p>
              Lotafinance est une solution de crédit salarial rapide, pensée pour les salariés, fonctionnaires et
              employés en CDI qui ont besoin d&apos;un financement court terme, sans paperasse ni longue attente.
            </p>
          </Section>

          <Section titre="Comment fonctionne Lotafinance ?">
            <p>
              Vous soumettez une demande en indiquant le montant et la durée souhaités. Votre dossier est analysé
              immédiatement par notre système de score de solvabilité, sur la base de votre profil (situation
              professionnelle, ancienneté, revenus, résidence, historique de remboursement).
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><span className="text-[#3DDC97] font-medium">Score ≥ 80</span> — prêt approuvé automatiquement, immédiatement.</li>
              <li><span className="text-[#C9A227] font-medium">Score entre 60 et 79</span> — votre dossier passe en analyse manuelle ; un montant réduit peut être proposé.</li>
              <li><span className="text-[#F0A0A0] font-medium">Score inférieur à 60</span> — votre dossier est également revu manuellement par un analyste, qui reste libre d&apos;accorder un montant réduit selon votre profil.</li>
            </ul>
          </Section>

          <Section titre="Nos taux standards">
            <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-md overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 border-b border-[#1B1F29]">
                <span>2 semaines</span>
                <span className="font-mono text-[#E8E6DE]">5%</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span>1 mois</span>
                <span className="font-mono text-[#E8E6DE]">10%</span>
              </div>
            </div>
            <p className="text-xs text-[#7C8494] mt-2">
              Exemple : un prêt de 50 000 F sur 1 mois se rembourse à 55 000 F (50 000 F + 10% d&apos;intérêt).
            </p>
          </Section>

          <Section titre="Frais de traitement">
            <p>
              Des frais de traitement fixes de <span className="text-[#E8E6DE] font-medium">1 000 F</span> sont prélevés
              une seule fois sur le montant versé lors de l&apos;approbation. Ils ne s&apos;ajoutent pas au montant total
              à rembourser : seul le capital emprunté est majoré du taux d&apos;intérêt.
            </p>
          </Section>

          <Section titre="Votre plafond de prêt">
            <p>
              Pour votre sécurité et la nôtre, le montant maximum empruntable dépend de votre historique de
              remboursement chez Lotafinance, en pourcentage de votre salaire mensuel déclaré :
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>1er prêt : jusqu&apos;à 10% du salaire</li>
              <li>2e prêt (1er remboursé avec succès) : jusqu&apos;à 20%</li>
              <li>3e prêt (2 remboursés) : jusqu&apos;à 30%</li>
              <li>Niveau Argent (3 à 5 prêts remboursés) : jusqu&apos;à 40%</li>
              <li>Niveau Or (6 à 10 prêts remboursés) : jusqu&apos;à 50%</li>
              <li>Niveau Platine (10+ prêts, jamais de retard) : jusqu&apos;à 60%</li>
            </ul>
          </Section>

          <Section titre="Niveaux de confiance">
            <p>Chaque prêt remboursé avec succès vous fait progresser dans nos niveaux de fidélité :</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs font-medium bg-[#0F2420] text-[#3DDC97] rounded-full px-3 py-1">🟢 Bronze (0-2 prêts)</span>
              <span className="text-xs font-medium bg-[#241B33] text-[#C9A6F0] rounded-full px-3 py-1">🟣 Argent (3-5 prêts)</span>
              <span className="text-xs font-medium bg-[#2A2312] text-[#C9A227] rounded-full px-3 py-1">🟡 Or (6-10 prêts)</span>
              <span className="text-xs font-medium bg-[#1B2A3A] text-[#7DD3FC] rounded-full px-3 py-1">💎 Platine (10+ sans retard)</span>
            </div>
            <p className="text-xs text-[#7C8494] mt-2">Retrouvez votre niveau actuel et votre progression sur votre tableau de bord.</p>
          </Section>

          <Section titre="Parrainage">
            <p>
              Invitez vos proches avec votre code personnel, disponible sur la page « Parrainage ». Dès qu&apos;un
              filleul rembourse intégralement son premier prêt, vous recevez <span className="text-[#3DDC97] font-medium">1 000 F</span> de crédit.
            </p>
          </Section>

          <Section titre="Documents à fournir">
            <p>
              Pièce d&apos;identité, carte de résidence, contrat de travail et certificat de travail (idéalement récent,
              moins de 3 mois) sont demandés pour vérifier votre dossier avant approbation.
            </p>
          </Section>

          <Section titre="Comment rembourser">
            <p>Vous pouvez rembourser chaque échéance via l&apos;un de nos deux moyens de paiement partenaires :</p>
            <div className="flex gap-3 mt-2">
              <span className="flex items-center gap-2 text-sm font-medium bg-[#0B0E14] border border-[#1B1F29] rounded-md px-3 py-2 text-[#E8E6DE]">
                🌊 Wave
              </span>
              <span className="flex items-center gap-2 text-sm font-medium bg-[#0B0E14] border border-[#1B1F29] rounded-md px-3 py-2 text-[#E8E6DE]">
                🟠 Orange Money
              </span>
            </div>
            <p className="text-xs text-[#7C8494] mt-2">
              Depuis « Mes remboursements », déclarez votre paiement en indiquant le canal utilisé et le numéro de
              transaction. Notre équipe vérifie et confirme la réception sous peu.
            </p>
          </Section>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => router.push("/simulateur")}
              className="flex-1 bg-[#1B1706] border border-[#3A3013] text-[#C9A227] text-sm font-semibold py-2.5 rounded-md hover:bg-[#241E09] transition"
            >
              Simuler un prêt
            </button>
            <button
              onClick={() => router.push("/demande-pret")}
              className="flex-1 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition"
            >
              Faire une demande
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
