"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { envoyerDocument, obtenirMesDocuments, DocumentClient, TypeDocument } from "@/lib/api";
import { DocumentIcon, IconCircle } from "@/components/icons";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const TYPES_DOCUMENTS: { valeur: TypeDocument; libelle: string; note?: string }[] = [
  { valeur: "piece_identite", libelle: "Pièce d'identité" },
  { valeur: "carte_residence", libelle: "Carte de résidence (Dakar)" },
  { valeur: "contrat_travail", libelle: "Contrat de travail" },
  { valeur: "certificat_travail", libelle: "Certificat de travail", note: "Idéalement daté de moins de 3 mois" },
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
        <p className="text-sm text-[#7C8494] font-mono">Chargement...</p>
      </main>
    );
  }

  const nombreEnvoyes = TYPES_DOCUMENTS.filter((t) => documentDejaEnvoye(t.valeur)).length;

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        {!modeOnboarding && (
          <button onClick={() => router.push("/tableau-de-bord")} className="text-sm text-[#7C8494] hover:text-[#E8E6DE] mb-4 transition">
            ← Retour au tableau de bord
          </button>
        )}

        <div className="bg-[#12151C] border border-[#232733] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-1">
            <IconCircle color="blue" size={40}><DocumentIcon size={20} /></IconCircle>
            <h1 className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE]">
              {modeOnboarding ? "Envoyez vos documents (étape 3/3)" : "Mes documents"}
            </h1>
          </div>
          <p className="text-[#7C8494] text-sm mb-1">
            {modeOnboarding
              ? "Ces pièces permettent à notre équipe de vérifier vos informations et d'accélérer vos futures demandes."
              : "Ces pièces permettent à l'analyste de vérifier vos informations."}
          </p>
          {modeOnboarding && (
            <p className="text-xs text-[#C9A227] mb-5">{nombreEnvoyes}/{TYPES_DOCUMENTS.length} documents envoyés</p>
          )}
          {!modeOnboarding && <div className="mb-6" />}

          {erreur && (
            <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2 mb-4">{erreur}</p>
          )}

          <div className="space-y-3">
            {TYPES_DOCUMENTS.map((type) => {
              const existant = documentDejaEnvoye(type.valeur);
              const enCours = envoiEnCours === type.valeur;

              return (
                <div key={type.valeur} className="border border-[#232733] rounded-md p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#E8E6DE]">{type.libelle}</p>
                    {type.note && <p className="text-[11px] text-[#7C8494] mt-0.5">{type.note}</p>}
                    {existant ? (
                      <p className="text-xs text-[#3DDC97] mt-0.5 truncate">✓ Envoyé : {existant.original_file_name}</p>
                    ) : (
                      <p className="text-xs text-[#5A6070] mt-0.5">Aucun fichier envoyé</p>
                    )}
                  </div>

                  <label className="shrink-0 cursor-pointer text-sm font-semibold bg-[#C9A227] text-[#0B0E14] px-3 py-2 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50">
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
                className="w-full mt-6 bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition"
              >
                {nombreEnvoyes === TYPES_DOCUMENTS.length ? "Terminer et accéder à mon compte" : "Continuer plus tard vers mon compte"}
              </button>
              {nombreEnvoyes < TYPES_DOCUMENTS.length && (
                <p className="text-[11px] text-[#5A6070] text-center mt-2">
                  Vous pourrez compléter les documents manquants à tout moment depuis « Mes documents ».
                </p>
              )}
            </>
          )}
        </div>
      </div>
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
