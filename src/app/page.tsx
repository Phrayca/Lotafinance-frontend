"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inscrire, demanderConnexion, verifierCodeConnexion } from "@/lib/api";

const FOND_TEXTURE_STYLE: React.CSSProperties = {
  backgroundColor: "#0B0E14",
  backgroundImage:
    "radial-gradient(ellipse 900px 420px at 50% -10%, rgba(201,162,39,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(201,162,39,0.035) 0px, rgba(201,162,39,0.035) 1px, transparent 1px, transparent 14px)",
};

const CHAMP_CLASSES =
  "w-full bg-[#0B0E14] border border-[#232733] rounded-md px-3 py-2.5 text-sm text-[#E8E6DE] placeholder-[#5A6070] focus:outline-none focus:border-[#C9A227] transition";

function IllustrationFinance() {
  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto">
      <ellipse cx="90" cy="300" rx="55" ry="16" fill="#C9A227" opacity="0.9" />
      <rect x="35" y="272" width="110" height="28" fill="#C9A227" opacity="0.9" />
      <ellipse cx="90" cy="272" rx="55" ry="16" fill="#DDB63A" />
      <ellipse cx="90" cy="272" rx="40" ry="10" fill="none" stroke="#0B0E14" strokeWidth="1.5" opacity="0.4" />

      <rect x="45" y="244" width="90" height="24" fill="#C9A227" opacity="0.85" />
      <ellipse cx="90" cy="244" rx="45" ry="13" fill="#DDB63A" />
      <ellipse cx="90" cy="244" rx="32" ry="8" fill="none" stroke="#0B0E14" strokeWidth="1.5" opacity="0.4" />

      <rect x="55" y="220" width="70" height="22" fill="#C9A227" />
      <ellipse cx="90" cy="220" rx="35" ry="11" fill="#E8C34A" />
      <ellipse cx="90" cy="220" rx="24" ry="6" fill="none" stroke="#0B0E14" strokeWidth="1.5" opacity="0.4" />

      <g transform="translate(160,130) rotate(-8)">
        <rect x="0" y="0" width="150" height="80" rx="6" fill="#12151C" stroke="#C9A227" strokeWidth="2" />
        <circle cx="38" cy="40" r="20" fill="none" stroke="#C9A227" strokeWidth="1.5" opacity="0.7" />
        <text x="38" y="46" textAnchor="middle" fill="#C9A227" fontSize="14" fontFamily="serif" opacity="0.9">F</text>
        <line x1="75" y1="14" x2="140" y2="14" stroke="#C9A227" strokeWidth="1.5" opacity="0.5" />
        <line x1="75" y1="24" x2="130" y2="24" stroke="#C9A227" strokeWidth="1.5" opacity="0.35" />
        <text x="120" y="66" textAnchor="end" fill="#C9A227" fontSize="16" fontWeight="bold" fontFamily="serif">10 000</text>
      </g>

      <g transform="translate(180,175) rotate(4)">
        <rect x="0" y="0" width="150" height="80" rx="6" fill="#171B24" stroke="#DDB63A" strokeWidth="2" />
        <circle cx="38" cy="40" r="20" fill="none" stroke="#DDB63A" strokeWidth="1.5" opacity="0.7" />
        <text x="38" y="46" textAnchor="middle" fill="#DDB63A" fontSize="14" fontFamily="serif" opacity="0.9">F</text>
        <line x1="75" y1="14" x2="140" y2="14" stroke="#DDB63A" strokeWidth="1.5" opacity="0.5" />
        <line x1="75" y1="24" x2="130" y2="24" stroke="#DDB63A" strokeWidth="1.5" opacity="0.35" />
        <text x="120" y="66" textAnchor="end" fill="#DDB63A" fontSize="16" fontWeight="bold" fontFamily="serif">5 000</text>
      </g>

      <path
        d="M60 190c40-60 90-70 130-40 35 26 70 20 95-10"
        fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"
      />
      <circle cx="285" cy="140" r="5" fill="#3DDC97" />
      <path d="M270 130l15 10 15-18" fill="none" stroke="#3DDC97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

type Etape = "identifiants" | "code";

export default function PageConnexion() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [etape, setEtape] = useState<Etape>("identifiants");

  const [identifiant, setIdentifiant] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [code, setCode] = useState("");

  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [aideMotDePasseOuverte, setAideMotDePasseOuverte] = useState(false);

  const [identifiantPourCode, setIdentifiantPourCode] = useState("");

  async function gererEnvoi(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      if (mode === "inscription") {
        await inscrire(email, telephone, motDePasse);
        await demanderConnexion(email, motDePasse);
        setIdentifiantPourCode(email);
        setEtape("code");
        return;
      }

      await demanderConnexion(identifiant, motDePasse);
      setIdentifiantPourCode(identifiant);
      setEtape("code");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  async function gererVerificationCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const { access_token } = await verifierCodeConnexion(identifiantPourCode, code);
      localStorage.setItem("token", access_token);
      if (mode === "inscription") {
        router.push("/profil?onboarding=1");
      } else {
        router.push("/tableau-de-bord");
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  function revenirAuxIdentifiants() {
    setEtape("identifiants");
    setCode("");
    setErreur("");
  }

  return (
    <main style={FOND_TEXTURE_STYLE} className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
        <div className="hidden md:flex flex-col items-center text-center">
          <IllustrationFinance />
          <p className="font-['Source_Serif_4',serif] text-xl text-[#E8E6DE] mt-4">
            Plus qu&apos;un prêt, un partenaire pour votre avenir.
          </p>
          <p className="text-sm text-[#7C8494] mt-2 max-w-xs">
            Des solutions de financement rapides et transparentes, pensées pour vous.
          </p>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="w-14 h-14 rounded-xl bg-[#C9A227] flex items-center justify-center text-[#0B0E14] font-bold text-2xl font-['Source_Serif_4',serif] mb-3 shadow-lg shadow-[#C9A227]/20">
              L
            </span>
            <h1 className="font-['Source_Serif_4',serif] text-2xl text-[#E8E6DE]">Lotafinance</h1>
            <p className="text-[#7C8494] mt-1 text-sm">
              {etape === "code"
                ? "Vérification de votre identité"
                : mode === "connexion"
                ? "Connectez-vous à votre compte"
                : "Créez votre compte"}
            </p>
          </div>

          <div className="bg-[#12151C] border border-[#232733] rounded-lg shadow-xl p-6">
            {etape === "identifiants" ? (
              <>
                <div className="flex mb-6 bg-[#0B0E14] border border-[#232733] rounded-md p-1">
                  <button
                    type="button"
                    onClick={() => setMode("connexion")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                      mode === "connexion" ? "bg-[#C9A227] text-[#0B0E14]" : "text-[#7C8494] hover:text-[#E8E6DE]"
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("inscription")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                      mode === "inscription" ? "bg-[#C9A227] text-[#0B0E14]" : "text-[#7C8494] hover:text-[#E8E6DE]"
                    }`}
                  >
                    Inscription
                  </button>
                </div>

                <form onSubmit={gererEnvoi} className="space-y-4">
                  {mode === "connexion" ? (
                    <div>
                      <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Email ou téléphone</label>
                      <input
                        type="text"
                        required
                        value={identifiant}
                        onChange={(e) => setIdentifiant(e.target.value)}
                        placeholder="vous@exemple.com ou 77 123 45 67"
                        className={CHAMP_CLASSES}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vous@exemple.com"
                          className={CHAMP_CLASSES}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Téléphone</label>
                        <input
                          type="tel"
                          required
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          placeholder="77 123 45 67"
                          className={CHAMP_CLASSES}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-[#B8BAC4]">Mot de passe</label>
                      {mode === "connexion" && (
                        <button
                          type="button"
                          onClick={() => setAideMotDePasseOuverte((v) => !v)}
                          className="text-xs text-[#C9A227] hover:text-[#DDB63A] transition"
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={motDePasseVisible ? "text" : "password"}
                        required
                        minLength={6}
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        placeholder="••••••••"
                        className={`${CHAMP_CLASSES} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setMotDePasseVisible((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C8494] hover:text-[#E8E6DE] transition"
                        tabIndex={-1}
                      >
                        {motDePasseVisible ? (
                          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M3 3l18 18 M10.6 10.6a3 3 0 0 0 4.24 4.24 M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.7-1.1 M17.9 17.9C20.5 16.2 22 12 22 12s-1.2-2.4-3.2-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {aideMotDePasseOuverte && mode === "connexion" && (
                    <p className="text-xs text-[#C9A227] bg-[#1B1706] border border-[#3A3013] rounded-md px-3 py-2">
                      La réinitialisation automatique par email arrive bientôt. En attendant, contactez directement
                      l&apos;équipe Lotafinance pour réinitialiser votre mot de passe.
                    </p>
                  )}

                  {erreur && (
                    <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2">
                      {erreur}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={chargement}
                    className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
                  >
                    {chargement
                      ? "Veuillez patienter..."
                      : mode === "connexion"
                      ? "Continuer"
                      : "Créer mon compte"}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={gererVerificationCode} className="space-y-4">
                <p className="text-sm text-[#B8BAC4]">
                  Un code à 6 chiffres a été envoyé par email à l&apos;adresse associée à ce compte. Il est valable 10 minutes.
                </p>

                <div>
                  <label className="block text-sm font-medium text-[#B8BAC4] mb-1">Code de vérification</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className={`${CHAMP_CLASSES} text-center text-lg tracking-[0.5em] font-mono`}
                    autoFocus
                  />
                </div>

                {erreur && (
                  <p className="text-sm text-[#F0A0A0] bg-[#2A1414] border border-[#4A2222] rounded-md px-3 py-2">
                    {erreur}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={chargement || code.length !== 6}
                  className="w-full bg-[#C9A227] text-[#0B0E14] text-sm font-semibold py-2.5 rounded-md hover:bg-[#DDB63A] transition disabled:opacity-50"
                >
                  {chargement ? "Vérification..." : "Valider et me connecter"}
                </button>

                <button
                  type="button"
                  onClick={revenirAuxIdentifiants}
                  className="w-full text-xs font-medium text-[#7C8494] hover:text-[#E8E6DE] transition"
                >
                  ← Revenir en arrière
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-[#5A6070] mt-6">
            Lotafinance – Plus qu&apos;un prêt, un partenaire pour votre avenir.
          </p>
        </div>
      </div>
    </main>
  );
}
