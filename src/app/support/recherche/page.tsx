"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recupererMonProfilUtilisateur, rechercherTicketsSupport, Ticket } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const LIBELLES_STATUT: Record<string, string> = { nouveau: "Nouveau", en_cours: "En cours", en_attente: "En attente", resolu: "Résolu" };
function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "resolu") return { bg: "#0F2420", text: "#3DDC97" };
  if (statut === "en_cours") return { bg: "#1B1706", text: "#C9A227" };
  if (statut === "en_attente") return { bg: "#241B33", text: "#C9A6F0" };
  return { bg: "#12203A", text: "#5B8DEF" };
}
function formaterDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function PageRechercheSupportContenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [resultats, setResultats] = useState<Ticket[]>([]);
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
        const profil = await recupererMonProfilUtilisateur(token);
        if (profil.role !== "support" && profil.role !== "admin") {
          router.push("/tableau-de-bord");
          return;
        }
        if (q.trim()) {
          const liste = await rechercherTicketsSupport(token, q.trim());
          setResultats(liste);
        }
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();
  }, [router, q]);

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 sm:px-8 py-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/support")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE] mb-1">Résultats de recherche</h1>
          <p className="text-[#7C8494] text-sm mb-6">
            {q ? `Pour « ${q} »` : "Tape une recherche"}
            {!chargement && q ? ` — ${resultats.length} résultat${resultats.length > 1 ? "s" : ""}` : ""}
          </p>

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {chargement ? (
            <p className="text-sm text-[#7C8494] font-mono text-center py-8">Recherche...</p>
          ) : resultats.length === 0 ? (
            <p className="text-sm text-[#5A6070] py-8 text-center">Aucun résultat.</p>
          ) : (
            <div className="space-y-2">
              {resultats.map((t) => {
                const couleur = couleurStatut(t.statut);
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/support/${t.id}`)}
                    className="w-full text-left border border-[#232733] rounded-md p-4 hover:border-[#3A4050] transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#E8E6DE] truncate">{t.sujet}</p>
                      <p className="text-xs text-[#7C8494] mt-0.5">{formaterDate(t.cree_le)}</p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                      {LIBELLES_STATUT[t.statut] || t.statut}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PageRechercheSupport() {
  return (
    <Suspense fallback={null}>
      <PageRechercheSupportContenu />
    </Suspense>
  );
}
