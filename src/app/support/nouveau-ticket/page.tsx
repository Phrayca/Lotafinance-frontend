"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recupererMonProfilUtilisateur, obtenirTousLesClients, creerTicketSupport, ClientApercu } from "@/lib/api";
import { HomeIcon, ClientsIcon, ReportsIcon, DocumentIcon, ProfileIcon, IconCircle, CouleurLotafinance } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} width="20" height="20">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONES = {
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  home: "M4 11 12 4l8 7M6 10v9h12v-9",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a5.5 5.5 0 0 1 11 0 M16 11a3.5 3.5 0 1 0 0-7 M21.5 20a5.5 5.5 0 0 0-5-5.48",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  document: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12h6 M9 16h6",
  faq: "M9.1 9a3 3 0 1 1 4.9 2.3c-.9.7-1.5 1.3-1.5 2.7 M12 17h.01",
  star: "M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.3l7-.8Z",
  channel: "M4 6h16v12H4V6Z M4 6l8 7 8-7",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 5-6 8-6s6.5 2 8 6",
  chevronRight: "M9 5l7 7-7 7",
  chevronLeft: "M15 5l-7 7 7 7",
};
function Ic(name: keyof typeof ICONES, className?: string) {
  return <Icon path={ICONES[name]} className={className} />;
}

const ICONES_RICHES: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: HomeIcon,
  users: ClientsIcon,
  chart: ReportsIcon,
  document: DocumentIcon,
  user: ProfileIcon,
};
const COULEURS_NAV: CouleurLotafinance[] = ["gold", "green", "blue", "purple", "orange", "red"];

const LIENS_NAV = [
  { href: "/support", label: "Tableau de bord", icone: "home" as const },
  { href: "/support/clients", label: "Clients", icone: "users" as const },
  { href: "/support/statistiques", label: "Statistiques", icone: "chart" as const },
  { href: "/support/satisfaction", label: "Satisfaction client", icone: "star" as const },
  { href: "/support/modeles", label: "Modèles de réponses", icone: "document" as const },
  { href: "/support/canaux", label: "Canaux d'accès", icone: "channel" as const },
  { href: "/support/faq", label: "FAQ & Réponses", icone: "faq" as const },
  { href: "/support/profil", label: "Mon profil", icone: "user" as const },
];

const CANAUX = [
  { valeur: "telephone", libelle: "📞 Téléphone" },
  { valeur: "whatsapp", libelle: "💬 WhatsApp" },
  { valeur: "email", libelle: "📧 Email" },
  { valeur: "chat", libelle: "🗨️ Chat" },
];

export default function PageNouveauTicket() {
  const router = useRouter();
  const [sidebarReduite, setSidebarReduite] = useState(false);
  const [autorise, setAutorise] = useState(false);
  const [clients, setClients] = useState<ClientApercu[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [rechercheClient, setRechercheClient] = useState("");
  const [clientChoisi, setClientChoisi] = useState<ClientApercu | null>(null);
  const [canal, setCanal] = useState("telephone");
  const [sujet, setSujet] = useState("");
  const [description, setDescription] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

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
        setAutorise(true);
        const liste = await obtenirTousLesClients(token);
        setClients(liste);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setChargement(false);
      }
    })();

    setSidebarReduite(localStorage.getItem("sidebar_reduite") === "1");
  }, [router]);

  function seDeconnecter() {
    localStorage.removeItem("token");
    router.push("/");
  }
  function basculerSidebar() {
    setSidebarReduite((v) => {
      const nouveau = !v;
      localStorage.setItem("sidebar_reduite", nouveau ? "1" : "0");
      return nouveau;
    });
  }

  const clientsFiltres = clients.filter((c) => {
    const terme = rechercheClient.trim().toLowerCase();
    if (!terme) return false;
    return c.first_name.toLowerCase().includes(terme) || c.last_name.toLowerCase().includes(terme) || c.phone.includes(terme);
  });

  async function gererCreation(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !clientChoisi || !sujet.trim() || !description.trim()) return;

    setErreur("");
    setEnvoiEnCours(true);
    try {
      const nouveauTicket = await creerTicketSupport(token, clientChoisi.id, sujet.trim(), description.trim(), canal);
      router.push(`/support/${nouveauTicket.id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création du ticket");
      setEnvoiEnCours(false);
    }
  }

  if (chargement || !autorise) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex">
      <aside className={`${sidebarReduite ? "w-16" : "w-60"} shrink-0 border-r border-[#1B1F29] flex flex-col py-6 px-3 transition-all duration-200`}>
        <div className={`flex items-center gap-2 mb-8 ${sidebarReduite ? "justify-center px-0" : "px-2"}`}>
          <span className="w-9 h-9 rounded-lg bg-[#C9A227] flex items-center justify-center text-[#0B0E14] font-bold font-['Source_Serif_4',serif] shrink-0">L</span>
          {!sidebarReduite && (
            <div>
              <p className="text-sm font-semibold text-[#E8E6DE] leading-tight">Lotafinance</p>
              <p className="text-[10px] text-[#7C8494]">Service Client</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {LIENS_NAV.map((lien, i) => (
            <div key={lien.href}>
              {!sidebarReduite && i === 0 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1">Gestion</p>}
              {!sidebarReduite && i === 2 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Rapports</p>}
              {!sidebarReduite && i === 4 && <p className="text-[10px] text-[#5A6070] uppercase tracking-wide px-3 mb-1 mt-3">Outils</p>}
              <button
                onClick={() => router.push(lien.href)}
                title={sidebarReduite ? lien.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm transition ${sidebarReduite ? "justify-center px-0" : "px-3"} text-[#B8BAC4] hover:bg-[#12151C]`}
              >
                <IconCircle color={COULEURS_NAV[i % COULEURS_NAV.length]} size={28}>
                  {(() => {
                    const IconeRiche = ICONES_RICHES[lien.icone];
                    return IconeRiche ? <IconeRiche size={16} /> : Ic(lien.icone, "w-4 h-4");
                  })()}
                </IconCircle>
                {!sidebarReduite && <span className="flex-1 text-left">{lien.label}</span>}
              </button>
            </div>
          ))}
        </nav>

        <button
          onClick={basculerSidebar}
          title={sidebarReduite ? "Déplier le menu" : "Réduire le menu"}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs text-[#7C8494] hover:bg-[#12151C] hover:text-[#E8E6DE] transition"
        >
          {Ic(sidebarReduite ? "chevronRight" : "chevronLeft", "w-4 h-4")}
          {!sidebarReduite && "Réduire"}
        </button>

        <button
          onClick={seDeconnecter}
          title={sidebarReduite ? "Déconnexion" : undefined}
          className={`w-full flex items-center gap-3 py-2.5 rounded-md text-sm text-[#7C8494] hover:bg-[#12151C] transition ${sidebarReduite ? "justify-center px-0" : "px-3"}`}
        >
          {Ic("logout")}
          {!sidebarReduite && "Déconnexion"}
        </button>
      </aside>

      <div className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto">
        <div className="max-w-xl mx-auto">
          <button onClick={() => router.push("/support")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
            ← Retour au tableau de bord
          </button>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE] mb-1">Nouvelle demande</h1>
            <p className="text-[#7C8494] text-sm mb-6">Crée un ticket au nom d&apos;un client — utile pour logger un appel ou un message reçu hors application.</p>

            {erreur && (
              <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
            )}

            <form onSubmit={gererCreation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Client</label>
                {clientChoisi ? (
                  <div className="flex items-center justify-between bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2">
                    <span className="text-sm text-[#E8E6DE]">{clientChoisi.first_name} {clientChoisi.last_name} · {clientChoisi.phone}</span>
                    <button type="button" onClick={() => setClientChoisi(null)} className="text-xs text-[#F0A0A0] hover:text-[#FFB3B3] transition">
                      Changer
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={rechercheClient}
                      onChange={(e) => setRechercheClient(e.target.value)}
                      placeholder="Rechercher par nom ou téléphone..."
                      className={CHAMP_CLASSES}
                    />
                    {clientsFiltres.length > 0 && (
                      <div className="mt-1 border border-[#232733] rounded-md overflow-hidden max-h-40 overflow-y-auto">
                        {clientsFiltres.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setClientChoisi(c); setRechercheClient(""); }}
                            className="w-full text-left px-3 py-2 text-sm text-[#B8BAC4] hover:bg-[#171B24] transition border-b border-[#1B1F29] last:border-0"
                          >
                            {c.first_name} {c.last_name} · {c.phone}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Canal</label>
                <div className="flex gap-2 flex-wrap">
                  {CANAUX.map((c) => (
                    <button
                      key={c.valeur}
                      type="button"
                      onClick={() => setCanal(c.valeur)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                        canal === c.valeur ? "bg-[#C9A227] text-[#0B0E14]" : "bg-[#0B0E14] border border-[#232733] text-[#7C8494]"
                      }`}
                    >
                      {c.libelle}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Sujet</label>
                <input value={sujet} onChange={(e) => setSujet(e.target.value)} className={CHAMP_CLASSES} placeholder="Ex : Demande de remboursement" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={CHAMP_CLASSES} placeholder="Détails de la demande du client..." />
              </div>

              <button
                type="submit"
                disabled={!clientChoisi || !sujet.trim() || !description.trim() || envoiEnCours}
                className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
              >
                {envoiEnCours ? "Création..." : "Créer le ticket"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
