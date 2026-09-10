"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirMonParrainage, Parrainage } from "@/lib/api";
import { ReferralIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

function formaterMontant(m: number) {
  return `${m.toLocaleString("fr-FR")} F`;
}

export default function PageParrainage() {
  const router = useRouter();
  const [parrainage, setParrainage] = useState<Parrainage | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    obtenirMonParrainage(token)
      .then(setParrainage)
      .catch((err) => setErreur(err instanceof Error ? err.message : "Une erreur est survenue"))
      .finally(() => setChargement(false));
  }, [router]);

  const lien = parrainage && typeof window !== "undefined" ? `${window.location.origin}/?parrain=${parrainage.mon_code}` : "";

  function copier(texte: string) {
    navigator.clipboard.writeText(texte).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    });
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="orange" size={40}><ReferralIcon size={20} /></IconCircle>
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">Parrainage</h1>
          </div>
          <p className="text-[#7C8494] text-sm mb-6">
            Invitez vos proches. Quand un filleul rembourse intégralement son premier prêt, vous recevez 1 000 F de crédit.
          </p>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {chargement ? (
            <p className="text-sm text-[#7C8494] font-mono text-center py-8">Chargement...</p>
          ) : parrainage ? (
            <>
              <div className="bg-[#1B1706] border border-[#3A3013] rounded-md p-4 mb-4">
                <p className="text-xs text-[#C9A227] mb-1">Mon code de parrainage</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-xl font-semibold text-[#E8E6DE] tracking-widest">{parrainage.mon_code}</span>
                  <button
                    onClick={() => copier(parrainage.mon_code)}
                    className="text-xs font-medium bg-[#C9A227] text-[#0B0E14] px-3 py-1.5 rounded-md hover:bg-[#DDB63A] transition"
                  >
                    {copie ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-[#B8BAC4] mb-1">Lien à partager</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={lien} className="flex-1 bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-xs text-[#7C8494] font-mono" />
                  <button
                    onClick={() => copier(lien)}
                    className="text-xs font-medium bg-[#0B0E14] border border-[#232733] text-[#C9A227] px-3 py-2 rounded-md hover:border-[#3A4050] transition shrink-0"
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-md p-3">
                  <p className="text-xs text-[#7C8494] mb-1">Solde de parrainage</p>
                  <p className="text-lg font-mono font-semibold text-[#3DDC97]">{formaterMontant(parrainage.solde_parrainage)}</p>
                </div>
                <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-md p-3">
                  <p className="text-xs text-[#7C8494] mb-1">Filleuls inscrits</p>
                  <p className="text-lg font-mono font-semibold text-[#E8E6DE]">{parrainage.nombre_filleuls}</p>
                </div>
                <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-md p-3">
                  <p className="text-xs text-[#7C8494] mb-1">Ayant remboursé</p>
                  <p className="text-lg font-mono font-semibold text-[#E8E6DE]">{parrainage.nombre_filleuls_ayant_rembourse}</p>
                </div>
              </div>

              {parrainage.solde_parrainage > 0 && (
                <p className="text-xs text-[#7C8494] mt-4">
                  Votre solde de {formaterMontant(parrainage.solde_parrainage)} sera déduit de vos futurs frais de traitement — contactez
                  l&apos;assistance pour l&apos;appliquer à votre prochain prêt.
                </p>
              )}
            </>
          ) : null}
        </div>

        <div className="bg-[#0B0E14] border border-[#1B1F29] rounded-lg p-6">
          <p className="text-xs text-[#7C8494] uppercase tracking-wide mb-3">Comment ça marche</p>
          <ol className="space-y-2 text-sm text-[#B8BAC4] list-decimal list-inside">
            <li>Partagez votre code ou votre lien avec un proche.</li>
            <li>Il l&apos;indique lors de la création de son profil Lotafinance.</li>
            <li>Dès qu&apos;il rembourse intégralement son premier prêt, vous recevez 1 000 F de crédit.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
