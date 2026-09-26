"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { envoyerDocument, obtenirMesDocuments, DocumentClient, TypeDocument } from "@/lib/api";
import { DocumentIcon, HomeIcon, LoanIcon, LoanRequestIcon, RepaymentIcon, ProfileIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#10151c",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const TYPES_DOCUMENTS: { valeur: TypeDocument; libelle: string; note?: string; requis?: boolean }[] = [
  { valeur: "piece_identite", libelle: "Pièce d'identité (CNI ou passeport)", requis: true },
  { valeur: "carte_residence", libelle: "Carte de résidence (Dakar)" },
  { valeur: "contrat_travail", libelle: "Contrat de travail", requis: true },
  { valeur: "certificat_travail", libelle: "Certificat de travail", note: "Idéalement daté de moins de 3 mois" },
];

const LIENS_NAV_MOBILE = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: HomeIcon },
  { href: "/mes-demandes", label: "Mes prêts", Icone: LoanIcon },
  { href: "/demande-pret", label: "Demander", Icone: LoanRequestIcon },
  { href: "/remboursements", label: "Rembours.", Icone: RepaymentIcon },
  { href: "/documents", label: "Docs", Icone: DocumentIcon },
  { href: "/profil", label: "Profil", Icone: ProfileIcon },
];

function PageDocumentsContenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeOnboarding = searchParams.get("onboarding") === "1";

  const [documents, setDocuments] = useState<DocumentClient[]>([]);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState<TypeDocument | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    chargerDocuments(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function chargerDocuments(token: string) {
    try {
      const liste = await obtenirMesDocuments(token);
      setDocuments(liste);
    } catch {
      setErreur("Impossible de charger vos documents");
    } finally {
      setChargementInitial(false);
    }
  }

  async function gererSelectionFichier(type: TypeDocument, e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    setErreur("");
    setEnvoiEnCours(type);
    try {
      await envoyerDocument(token, type, fichier);
      await chargerDocuments(token);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setEnvoiEnCours(null);
      e.target.value = "";
    }
  }

  function documentDejaEnvoye(type: TypeDocument): DocumentClient | undefined {
    return documents.find((d) => d.document_type === type);
  }

  if (chargementInitial) {
    return (
      <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[#8e99a8] font-mono">Chargement...</p>
      </main>
    );
  }

  const nombreEnvoyes = TYPES_DOCUMENTS.filter((t) => documentDejaEnvoye(t.valeur)).length;

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10 pb-28 md:pb-10">
      <div className="max-w-xl mx-auto">
        {!modeOnboarding && (
          <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#8e99a8] hover:text-[#eef1f4] mb-4 transition">
            ← Retour au tableau de bord
          </button>
        )}

        <div className="bg-[#1a212b] border border-[rgba(255,255,255,0.08)] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="blue" size={40}><DocumentIcon size={20} /></IconCircle>
            <h1 className="font-['Sora',sans-serif] text-xl text-[#eef1f4]">
              {modeOnboarding ? "Envoyez vos documents (étape 3/3)" : "Mes documents"}
            </h1>
          </div>
          <p className="text-[#8e99a8] text-sm mb-1">
            {modeOnboarding
              ? "Ces pièces permettent à notre équipe de vérifier vos informations et d'accélérer vos futures demandes."
              : "Ces pièces permettent à l'analyste de vérifier vos informations."}
          </p>
          {modeOnboarding && (
            <p className="text-xs text-[#c99a4b] mb-5">{nombreEnvoyes}/{TYPES_DOCUMENTS.length} documents envoyés</p>
          )}
          {!modeOnboarding && <div className="mb-3" />}

          <p className="text-xs text-[#8e99a8] mb-5">
            <span className="text-[#c0563b]">*</span> Documents obligatoires — aucune demande de prêt ne pourra être traitée tant qu&apos;ils ne sont pas envoyés.
          </p>

          {erreur && (
            <p className="text-sm text-[#c0563b] bg-[rgba(192,86,59,0.12)] border border-[rgba(192,86,59,0.3)] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="space-y-3">
            {TYPES_DOCUMENTS.map((type) => {
              const existant = documentDejaEnvoye(type.valeur);
              const enCours = envoiEnCours === type.valeur;

              return (
                <div key={type.valeur} className="border border-[rgba(255,255,255,0.08)] rounded-md p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#eef1f4]">
                      {type.libelle} {type.requis && <span className="text-[#c0563b]">*</span>}
                    </p>
                    {type.note && <p className="text-[11px] text-[#8e99a8] mt-0.5">{type.note}</p>}
                    {existant ? (
                      <p className="text-xs text-[#3fa873] mt-0.5 truncate">✓ Envoyé : {existant.original_file_name}</p>
                    ) : (
                      <p className="text-xs text-[#66707d] mt-0.5">Aucun fichier envoyé</p>
                    )}
                  </div>

                  <label className="shrink-0 cursor-pointer text-sm font-semibold bg-[#c99a4b] text-[#10151c] px-3 py-2 rounded-md hover:bg-[#e4b565] transition disabled:opacity-50">
                    {enCours ? "Envoi..." : existant ? "Remplacer" : "Choisir un fichier"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      disabled={enCours}
                      onChange={(e) => gererSelectionFichier(type.valeur, e)}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          {modeOnboarding && (
            <>
              <button
                onClick={() => router.push("/tableau-de-bord")}
                className="w-full mt-6 bg-[#c99a4b] text-[#10151c] text-sm font-semibold py-2.5 rounded-md hover:bg-[#e4b565] transition"
              >
                {nombreEnvoyes === TYPES_DOCUMENTS.length ? "Terminer et accéder à mon compte" : "Continuer plus tard vers mon compte"}
              </button>
              {nombreEnvoyes < TYPES_DOCUMENTS.length && (
                <p className="text-[11px] text-[#66707d] text-center mt-2">
                  Vous pourrez compléter les documents manquants à tout moment depuis « Mes documents ».
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barre de navigation mobile — masquée pendant l'onboarding pour ne pas distraire du parcours */}
      {!modeOnboarding && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#10151c]/95 backdrop-blur border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around py-2 px-1">
          {LIENS_NAV_MOBILE.map((lien) => {
            const estActif = lien.href === "/documents";
            const Icone = lien.Icone;
            return (
              <button
                key={lien.href}
                onClick={() => router.push(lien.href)}
                className="flex flex-col items-center gap-0.5 flex-1 py-1"
              >
                <span className={estActif ? "text-[#c99a4b]" : "text-[#8e99a8]"}>
                  <Icone size={20} />
                </span>
                <span className={`text-[9px] ${estActif ? "text-[#c99a4b] font-medium" : "text-[#8e99a8]"}`}>{lien.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </main>
  );
}

export default function PageDocuments() {
  return (
    <Suspense fallback={null}>
      <PageDocumentsContenu />
    </Suspense>
  );
}
