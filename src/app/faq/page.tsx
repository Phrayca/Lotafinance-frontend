"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirFaqPublique, incrementerVueFaq, FaqItem } from "@/lib/api";
import { HomeIcon, LoanIcon, LoanRequestIcon, RepaymentIcon, DocumentIcon, ProfileIcon } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/documents", label: "Docs", Icone: DocumentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

export default function PageFaqClient() {
  const router = useRouter();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    obtenirFaqPublique(token)
      .then(setItems)
      .catch((err) => setErreur(err instanceof Error ? err.message : "Une erreur est survenue"))
      .finally(() => setChargement(false));
  }, [router]);

  function basculer(id: string) {
    const seraOuvert = !ouverts[id];
    setOuverts((precedent) => ({ ...precedent, [id]: seraOuvert }));
    if (seraOuvert) {
      const token = localStorage.getItem("token");
      if (token) incrementerVueFaq(token, id).catch(() => {});
    }
  }

  const categories = Array.from(new Set(items.map((i) => i.categorie).filter(Boolean))) as string[];

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
          <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4] mb-1">Questions fréquentes</h1>
          <p className="text-[#8e99a8] text-sm mb-6">Trouve rapidement une réponse à ta question.</p>

          {erreur && (
            <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-[#66707d] py-8 text-center">Aucune question disponible pour le moment.</p>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <div key={cat} className="mb-5">
                <p className="text-xs text-[#c99a4b] uppercase tracking-wide mb-2">{cat}</p>
                <div className="space-y-2">
                  {items.filter((i) => i.categorie === cat).map((item) => (
                    <QuestionItem key={item.id} item={item} ouvert={!!ouverts[item.id]} onClick={() => basculer(item.id)} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <QuestionItem key={item.id} item={item} ouvert={!!ouverts[item.id]} onClick={() => basculer(item.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#10151c]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around py-2 px-1">
        {LIENS_NAV_MOBILE.map((lien) => {
          const Icone = lien.Icone;
          return (
            <button key={lien.href} onClick={() => router.push(lien.href)} className="flex flex-col items-center gap-0.5 flex-1 py-1">
              <span className="text-[#8e99a8]">
                <Icone size={20} />
              </span>
              <span className="text-[9px] text-[#8e99a8]">{lien.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function QuestionItem({ item, ouvert, onClick }: { item: FaqItem; ouvert: boolean; onClick: () => void }) {
  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-md overflow-hidden">
      <button onClick={onClick} className="w-full text-left px-4 py-3 hover:bg-[#212a35] transition flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#eef1f4]">{item.question}</span>
        <span className="text-[#8e99a8] text-xs shrink-0">{ouvert ? "▲" : "▼"}</span>
      </button>
      {ouvert && <p className="px-4 pb-3 text-sm text-[#8e99a8] whitespace-pre-wrap">{item.reponse}</p>}
    </div>
  );
}
