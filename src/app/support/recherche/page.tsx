"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recupererMonProfilUtilisateur, rechercherTicketsSupport, Ticket } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const LIBELLES_STATUT: Record<string, string> = { nouveau: "Nouveau", en_cours: "En cours", en_attente: "En attente", resolu: "Résolu" };
function couleurStatut(statut: string): { bg: string; text: string } {
  if (statut === "resolu") return { bg: "rgba(63,168,115,0.12)", text: "#3fa873" };
  if (statut === "en_cours") return { bg: "rgba(201,154,75,0.15)", text: "#c99a4b" };
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
        <button onClick={() => router.push("/support")} className="text-sm text-[#8e99a8] hover:text-[#eef1f4] mb-4 transition">
          ← Retour au tableau de bord
        </button>

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4] mb-1">Résultats de recherche</h1>
          <p className="text-[#8e99a8] text-sm mb-6">
            {q ? `Pour « ${q} »` : "Tape une recherche"}
            {!chargement && q ? ` — ${resultats.length} résultat${resultats.length > 1 ? "s" : ""}` : ""}
          </p>

          {erreur && (
            <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          {chargement ? (
            <p className="text-sm text-[#8e99a8] font-mono text-center py-8">Recherche...</p>
          ) : resultats.length === 0 ? (
            <p className="text-sm text-[#66707d] py-8 text-center">Aucun résultat.</p>
          ) : (
            <div className="space-y-2">
              {resultats.map((t) => {
                const couleur = couleurStatut(t.statut);
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/support/${t.id}`)}
                    className="w-full text-left border border-[rgba(255,255,255,0.08)] rounded-md p-4 hover:border-[rgba(255,255,255,0.16)] transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#eef1f4] truncate">{t.sujet}</p>
                      <p className="text-xs text-[#8e99a8] mt-0.5">{formaterDate(t.cree_le)}</p>
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
