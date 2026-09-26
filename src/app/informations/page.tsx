"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirTauxPublics, Taux } from "@/lib/api";
import { HomeIcon, LoanIcon, LoanRequestIcon, RepaymentIcon, DocumentIcon, ProfileIcon } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const FRAIS_DE_TRAITEMENT = 1000;
const PENALITE_PAR_JOUR = 1000;
const DELAI_GRACE_JOURS = 5;
const PENALITE_MAX = PENALITE_PAR_JOUR * DELAI_GRACE_JOURS;

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/documents", label: "Docs", Icone: DocumentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

function formaterMontant(m: number) {
  return `${m.toLocaleString("fr-FR")} F`;
}

function libelleDuree(semaines: number) {
  return semaines === 2 ? "2 semaines" : semaines === 4 ? "1 mois" : `${semaines} semaines`;
}

type Section = {
  id: string;
  titre: string;
  emoji: string;
  contenu: React.ReactNode;
};

function CategorieAccordeon({ section, ouverte, onClick }: { section: Section; ouverte: boolean; onClick: () => void }) {
  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
      <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#171B24] transition text-left">
        <span className="flex items-center gap-3">
          <span className="text-lg">{section.emoji}</span>
          <span className="font-['Sora',sans-serif] text-sm font-semibold text-[#eef1f4]">{section.titre}</span>
        </span>
        <span className="text-[#8e99a8] text-xs shrink-0">{ouverte ? "▲" : "▼"}</span>
      </button>
      {ouverte && <div className="px-5 pb-5 text-sm text-[#8e99a8] leading-relaxed space-y-3">{section.contenu}</div>}
    </div>
  );
}

function Puce({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-[#c99a4b] mt-1 shrink-0">•</span>
      <span>{children}</span>
    </li>
  );
}

export default function PageInformations() {
  const router = useRouter();
  const [taux, setTaux] = useState<Taux[]>([]);
  const [ouverte, setOuverte] = useState<string | null>("general");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    obtenirTauxPublics(token).then(setTaux).catch(() => {});
  }, [router]);

  function basculer(id: string) {
    setOuverte((precedent) => (precedent === id ? null : id));
  }

  const sections: Section[] = [
    {
      id: "general",
      titre: "Général — Qui sommes-nous ?",
      emoji: "🏦",
      contenu: (
        <>
          <p>
            Lotafinance est une fintech de crédit salarial destinée principalement aux salariés, fonctionnaires et
            employés disposant de revenus réguliers. Notre objectif : proposer un parcours de financement simple,
            rapide et transparent, tout en évaluant sérieusement la capacité de remboursement de chaque client.
          </p>
          <p className="font-medium text-[#eef1f4]">Qui peut emprunter ?</p>
          <ul className="space-y-1.5">
            <Puce>Fonctionnaires</Puce>
            <Puce>Salariés en CDI</Puce>
            <Puce>CDD répondant aux critères applicables</Puce>
            <Puce>Toute personne disposant de revenus réguliers et vérifiables</Puce>
          </ul>
          <p>L&apos;acceptation dépend du profil, du score, de la capacité de remboursement et de l&apos;historique du client.</p>
        </>
      ),
    },
    {
      id: "demande",
      titre: "Demande de prêt & scoring",
      emoji: "📝",
      contenu: (
        <>
          <p>Le parcours de demande se déroule en plusieurs étapes :</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Création du compte</li>
            <li>Informations personnelles et professionnelles</li>
            <li>Revenus et dépenses mensuelles</li>
            <li>Montant et durée souhaités</li>
            <li>Envoi des documents</li>
            <li>Analyse du dossier et décision</li>
          </ol>
          <p className="font-medium text-[#eef1f4] mt-2">Comment le score est-il utilisé ?</p>
          <ul className="space-y-1.5">
            <Puce><strong className="text-[#eef1f4]">Score ≥ 80</strong> — dossier pouvant être approuvé selon les critères applicables</Puce>
            <Puce><strong className="text-[#eef1f4]">Score 60 à 79</strong> — analyse manuelle par un membre de notre équipe</Puce>
            <Puce><strong className="text-[#eef1f4]">Score &lt; 60</strong> — analyse manuelle, avec possibilité d&apos;un montant réduit selon le profil</Puce>
          </ul>
          <p className="text-xs italic">Le scoring est un outil d&apos;aide à la décision, pas une garantie automatique d&apos;acceptation : une analyse humaine est toujours possible.</p>
        </>
      ),
    },
    {
      id: "taux",
      titre: "Taux et frais",
      emoji: "💰",
      contenu: (
        <>
          <p>Nos taux appliqués actuellement, selon la durée choisie :</p>
          <div className="grid grid-cols-2 gap-2 my-2">
            {(taux.length > 0 ? taux : [{ id: "2", duration_weeks: 2, rate_percent: 5, is_active: true }, { id: "4", duration_weeks: 4, rate_percent: 10, is_active: true }]).map((t) => (
              <div key={t.id} className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-3 text-center">
                <p className="text-xs text-[#8e99a8]">{libelleDuree(t.duration_weeks)}</p>
                <p className="text-xl font-mono font-semibold text-[#c99a4b]">{t.rate_percent}%</p>
              </div>
            ))}
          </div>
          <p>
            Un frais de traitement unique de <strong className="text-[#eef1f4]">{formaterMontant(FRAIS_DE_TRAITEMENT)}</strong> est
            prélevé lors de la mise à disposition du financement. Ce montant est toujours affiché clairement avant
            que tu valides ta demande.
          </p>
          <p>
            Des facilités de paiement sur plusieurs échéances peuvent être proposées selon les dossiers ; le coût
            total et l&apos;échéancier sont alors calculés et affichés clairement avant acceptation.
          </p>
          <p className="text-xs italic">Les taux, frais et pénalités appliqués respectent la réglementation en vigueur et peuvent évoluer ; les conditions définitives te sont toujours présentées avant validation de ton prêt.</p>
        </>
      ),
    },
    {
      id: "remboursement",
      titre: "Remboursement",
      emoji: "🔁",
      contenu: (
        <>
          <p>Le remboursement se fait via :</p>
          <ul className="space-y-1.5">
            <Puce>🌊 Wave</Puce>
            <Puce>🟠 Orange Money</Puce>
          </ul>
          <p>
            Depuis la page « Mes remboursements », indique le canal utilisé et le numéro de transaction de ton
            paiement. Notre équipe vérifie ensuite le paiement et met à jour ton échéancier.
          </p>
        </>
      ),
    },
    {
      id: "retard",
      titre: "Retard et recouvrement",
      emoji: "⏳",
      contenu: (
        <>
          <p>
            Un <strong className="text-[#eef1f4]">délai de grâce de {DELAI_GRACE_JOURS} jours</strong> est accordé
            après chaque date d&apos;échéance.
          </p>
          <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md overflow-hidden my-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8e99a8] border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-left px-3 py-2 font-medium">Jours de retard</th>
                  <th className="text-right px-3 py-2 font-medium">Pénalité</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((j) => (
                  <tr key={j} className="border-b border-[rgba(255,255,255,0.08)] last:border-0">
                    <td className="px-3 py-1.5 text-[#B8BAC4]">{j} jour{j > 1 ? "s" : ""}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[#eef1f4]">{formaterMontant(j * PENALITE_PAR_JOUR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Soit {formaterMontant(PENALITE_PAR_JOUR)} par jour de retard, avec un maximum de{" "}
            <strong className="text-[#eef1f4]">{formaterMontant(PENALITE_MAX)}</strong> sur la période de grâce.
          </p>
          <p className="font-medium text-[#eef1f4] mt-2">Au-delà de {DELAI_GRACE_JOURS} jours de retard</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Relance amiable</li>
            <li>Transmission éventuelle au recouvrement</li>
            <li>En cas d&apos;impayé persistant, possibilité de procédure contentieuse, conformément au contrat et à la législation applicable</li>
            <li>Suspension ou limitation de l&apos;accès à de nouveaux financements</li>
          </ol>
          <p className="text-xs italic">Toutes les pénalités et procédures sont appliquées conformément au contrat signé et à la réglementation applicable.</p>
        </>
      ),
    },
    {
      id: "documents",
      titre: "Documents",
      emoji: "📄",
      contenu: (
        <>
          <p>Selon ton profil, les documents suivants peuvent être demandés :</p>
          <ul className="space-y-1.5">
            <Puce>Pièce d&apos;identité (CNI ou passeport)</Puce>
            <Puce>Justificatif de résidence</Puce>
            <Puce>Contrat de travail</Puce>
            <Puce>Certificat de travail récent</Puce>
            <Puce>Justificatifs de revenus</Puce>
            <Puce>Tout autre document nécessaire à la vérification de ton dossier</Puce>
          </ul>
        </>
      ),
    },
    {
      id: "fidelite",
      titre: "Fidélité et parrainage",
      emoji: "🏆",
      contenu: (
        <>
          <p>Ton plafond de crédit évolue selon ton historique de remboursement, ton score et ta capacité financière — pas uniquement selon ton salaire.</p>
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-2.5 text-center">🟢 <span className="text-[#eef1f4]">Bronze</span> <span className="text-[#66707d] block">0-2 prêts</span></div>
            <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-2.5 text-center">🟣 <span className="text-[#eef1f4]">Argent</span> <span className="text-[#66707d] block">3-5 prêts</span></div>
            <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-2.5 text-center">🟡 <span className="text-[#eef1f4]">Or</span> <span className="text-[#66707d] block">6-10 prêts</span></div>
            <div className="bg-[#10151c] border border-[rgba(255,255,255,0.08)] rounded-md p-2.5 text-center">💎 <span className="text-[#eef1f4]">Platine</span> <span className="text-[#66707d] block">10+ sans incident</span></div>
          </div>
          <p>Ta progression est visible à tout moment depuis ton tableau de bord.</p>
          <p className="font-medium text-[#eef1f4] mt-2">Parrainage</p>
          <p>
            Chaque client dispose d&apos;un code personnel. Lorsqu&apos;un filleul rembourse intégralement son premier
            prêt selon les conditions prévues, tu reçois {formaterMontant(1000)} de crédit de parrainage.
          </p>
        </>
      ),
    },
  ];

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10 pb-28 md:pb-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#8e99a8] hover:text-[#eef1f4] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 mb-4">
          <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4] mb-1">Informations & Conditions</h1>
          <p className="text-[#8e99a8] text-sm">Tout ce qu&apos;il faut savoir sur le fonctionnement de ton crédit Lotafinance.</p>
        </div>

        <div className="space-y-2 mb-4">
          {sections.map((s) => (
            <CategorieAccordeon key={s.id} section={s} ouverte={ouverte === s.id} onClick={() => basculer(s.id)} />
          ))}
        </div>

        <div className="bg-[rgba(201,154,75,0.15)] border border-[rgba(201,154,75,0.3)] rounded-lg p-5 text-sm text-[#c99a4b] leading-relaxed">
          <p className="font-semibold mb-1">ℹ️ Important</p>
          <p>
            Les conditions définitives de ton prêt (montant, taux, échéances) te sont toujours présentées clairement
            avant acceptation. Elles sont soumises au contrat signé et à la réglementation applicable.
          </p>
        </div>

        <button
          onClick={() => router.push("/faq")}
          className="w-full mt-4 bg-[#1a212b] border border-[rgba(255,255,255,0.08)] text-[#eef1f4] text-sm font-medium py-3 rounded-md hover:bg-[#212a35] transition"
        >
          Voir aussi la FAQ →
        </button>
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
