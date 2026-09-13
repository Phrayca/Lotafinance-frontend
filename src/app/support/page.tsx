"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recupererMonProfilUtilisateur, obtenirTousLesTicketsSupport, TicketDetail } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

type Utilisateur = { id: string; email: string; role: string; first_name?: string; last_name?: string };

const FILTRES = [
  { valeur: "tous", label: "Tous" },
  { valeur: "nouveau", label: "Nouveaux" },
  { valeur: "en_cours", label: "En cours" },
  { valeur: "en_attente", label: "En attente" },
  { valeur: "resolu", label: "Résolus" },
];

const LIBELLES_STATUT: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  en_attente: "En attente",
  resolu: "Résolu",
};

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

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} width="20" height="20">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONES = {
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 5l7 7-7 7",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

export default function PageServiceClient() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [filtre, setFiltre] = useState("tous");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);

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
        setUtilisateur(profil);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !utilisateur) return;
    obtenirTousLesTicketsSupport(token, filtre)
      .then(setTickets)
      .catch((err) => setErreur(err instanceof Error ? err.message : "Une erreur est survenue"));
  }, [filtre, utilisateur]);

  function seDeconnecter() {
    localStorage.removeItem("token");
    router.push("/");
  }

  if (chargement) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  const compteurs = {
    nouveau: tickets.filter((t) => t.statut === "nouveau").length,
    en_cours: tickets.filter((t) => t.statut === "en_cours").length,
    en_attente: tickets.filter((t) => t.statut === "en_attente").length,
    resolu: tickets.filter((t) => t.statut === "resolu").length,
  };

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen">
      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-[#C9A227] flex items-center justify-center text-[#0B0E14] font-bold font-['Source_Serif_4',serif] shrink-0">L</span>
            <div>
              <p className="text-sm font-semibold text-[#E8E6DE] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#7C8494]">Service Client</p>
            </div>
          </div>

          <div className="relative shrink-0">
            <button onClick={() => setMenuOuvert((v) => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-[#232733] hover:border-[#3A4050] transition">
              <span className="w-7 h-7 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] flex items-center justify-center overflow-hidden shrink-0">
                {Ic("user", "w-3.5 h-3.5")}
              </span>
              <span className="text-xs text-[#B8BAC4]">{utilisateur?.first_name || utilisateur?.email?.split("@")[0]}</span>
              {Ic("chevronDown", "w-3 h-3 text-[#7C8494]")}
            </button>
            {menuOuvert && (
              <div className="absolute right-0 top-10 w-44 bg-[#12151C] border border-[#232733] rounded-md shadow-xl z-10 overflow-hidden">
                <button onClick={seDeconnecter} className="w-full text-left px-3 py-2 text-sm text-[#F0A0A0] hover:bg-[#171B24] transition">
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">Bonjour {utilisateur?.first_name || ""} 👋</h1>
          <p className="text-[#7C8494] text-sm mt-1">Voici les réclamations à traiter.</p>
        </div>

        {erreur && (
          <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <CarteKpi label="Nouveaux" valeur={compteurs.nouveau} couleur="#5B8DEF" />
          <CarteKpi label="En cours" valeur={compteurs.en_cours} couleur="#C9A227" />
          <CarteKpi label="En attente" valeur={compteurs.en_attente} couleur="#C9A6F0" />
          <CarteKpi label="Résolus" valeur={compteurs.resolu} couleur="#3DDC97" />
        </div>

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <div className="flex gap-2 mb-5 flex-wrap">
            {FILTRES.map((f) => (
              <button
                key={f.valeur}
                onClick={() => setFiltre(f.valeur)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                  filtre === f.valeur ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#0B0E14] border border-[#232733] text-[#7C8494] hover:text-[#E8E6DE]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {tickets.length === 0 ? (
            <p className="text-sm text-[#5A6070] py-8 text-center">Aucun ticket pour ce filtre.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const couleur = couleurStatut(t.statut);
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/support/${t.id}`)}
                    className="w-full text-left border border-[#232733] rounded-md p-4 hover:border-[#3A4050] transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#1B2030] border border-[#232733] text-[#C9A227] text-xs font-semibold flex items-center justify-center shrink-0">
                        {t.client_first_name[0]}{t.client_last_name[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#E8E6DE] truncate">{t.sujet}</p>
                        <p className="text-xs text-[#7C8494] mt-0.5 truncate">{t.client_first_name} {t.client_last_name} · {formaterDate(t.cree_le)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: couleur.bg, color: couleur.text }}>
                        {LIBELLES_STATUT[t.statut] || t.statut}
                      </span>
                      {Ic("chevronRight", "w-4 h-4 text-[#5A6070]")}
                    </div>
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

function CarteKpi({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  return (
    <div className="bg-[#12151C] border border-[#232733] rounded-lg px-4 py-4">
      <p className="text-xs text-[#7C8494] mb-1">{label}</p>
      <p className="text-2xl font-mono font-semibold" style={{ color: couleur }}>{valeur}</p>
    </div>
  );
}
