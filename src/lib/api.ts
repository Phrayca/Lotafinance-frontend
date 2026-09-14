// Ce fichier centralise tous les appels vers le backend (FastAPI).

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function inscrire(email: string, phone: string, password: string) {
  const reponse = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, phone, password }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la création du compte");
  }
  return donnees;
}

// Étape 1 : identifiant (email ou téléphone) + mot de passe → envoie un code par email,
// SAUF pour les comptes de test qui reçoivent directement le jeton d'accès (access_token présent)
export async function demanderConnexion(identifiant: string, password: string) {
  const reponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiant, password }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Aucun compte ne correspond à cet identifiant, ou mot de passe incorrect");
  }
  return donnees as { message: string; access_token?: string };
}

// Étape 2 : identifiant + code reçu par email → jeton d'accès
export async function verifierCodeConnexion(identifiant: string, code: string) {
  const reponse = await fetch(`${API_URL}/auth/login/verifier`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiant, code }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Code invalide ou expiré");
  }
  return donnees as { access_token: string; token_type: string };
}

export async function recupererMonProfilUtilisateur(token: string) {
  const reponse = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Session invalide");
  }
  return reponse.json();
}

export async function changerMonMotDePasse(token: string, currentPassword: string, newPassword: string) {
  const reponse = await fetch(`${API_URL}/users/me/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors du changement de mot de passe");
  }
  return donnees;
}

export async function supprimerMonCompte(token: string) {
  const reponse = await fetch(`${API_URL}/clients/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la suppression du compte");
  }
  return donnees;
}

export async function supprimerCompteClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la suppression du compte");
  }
  return donnees;
}

export async function envoyerMaPhotoDeProfil(token: string, fichier: File) {
  const formData = new FormData();
  formData.append("fichier", fichier);

  const reponse = await fetch(`${API_URL}/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi de la photo");
  }
  return donnees;
}

export function urlPhotoDeProfil(userId: string) {
  return `${API_URL}/users/${userId}/avatar`;
}

export type StatutCompte = {
  email_verified: boolean;
  has_avatar: boolean;
};

export async function obtenirStatutDeMonCompte(token: string) {
  const reponse = await fetch(`${API_URL}/users/me/statut-compte`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du statut du compte");
  }
  return reponse.json() as Promise<StatutCompte>;
}

export type ProfilClient = {
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  birth_date?: string;
  national_id_number?: string;
  profession?: string;
  employer?: string;
  employment_type?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  activity_seniority_months?: number;
  categorie_professionnelle?: string;
  anciennete_residence?: string;
  autres_credits_mensuels?: number;
  code_parrainage_utilise?: string;
};

export async function enregistrerMonProfilClient(token: string, profil: ProfilClient) {
  const reponse = await fetch(`${API_URL}/clients/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profil),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'enregistrement du profil");
  }
  return donnees;
}

export async function obtenirMonProfilClient(token: string) {
  const reponse = await fetch(`${API_URL}/clients/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (reponse.status === 404) {
    return null;
  }
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du profil");
  }
  return reponse.json();
}

export type DemandePret = {
  amount_requested: number;
  duration_weeks: number;
  purpose?: string;
  facilite_paiement?: boolean;
  payout_channel: "wave" | "orange_money";
  payout_phone: string;
  signature: string;
};

export type StatutDemande = "soumis" | "approuve" | "refuse" | "infos_demandees";

export type LoanOut = {
  id: string;
  client_id: string;
  amount_requested: number;
  duration_weeks: number;
  purpose?: string;
  status: string;
  rate_percent_applied?: number;
  total_to_repay?: number;
  credit_score?: number;
  risk_level?: string;
  recommended_amount?: number;
  facilite_paiement?: boolean;
  payout_channel?: string;
  payout_phone?: string;
  signature?: string;
  decision?: string;
  decision_reason?: string;
  approved_amount?: number;
  submitted_at?: string;
  decided_at?: string;
};

export type LoanDetailOut = LoanOut & {
  client_first_name: string;
  client_last_name: string;
  client_phone: string;
  monthly_income?: number;
  monthly_expenses?: number;
  profession_score?: number;
  anciennete_score?: number;
  capacity_score?: number;
  residence_score?: number;
  history_score?: number;
  // Situation du client, pour l'outil d'aide à la décision de l'analyste
  client_profession?: string;
  client_employer?: string;
  client_employment_type?: string;
  client_categorie_professionnelle?: string;
  client_anciennete_residence?: string;
  client_activity_seniority_months?: number;
  client_autres_credits_mensuels?: number;
  // Historique réel du client chez Lotafinance (tous prêts confondus)
  client_nombre_prets_reussis: number;
  client_nombre_echeances_en_retard_historique: number;
};

export async function soumettreDemandeDePret(token: string, demande: DemandePret) {
  const reponse = await fetch(`${API_URL}/loans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(demande),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la soumission de la demande");
  }
  return donnees as LoanOut;
}

export async function obtenirMesDemandesDePret(token: string) {
  const reponse = await fetch(`${API_URL}/loans/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des demandes");
  }
  return reponse.json() as Promise<LoanOut[]>;
}

export type PretEnCours = { a_un_pret_en_cours: boolean };

export async function obtenirPretEnCours(token: string) {
  const reponse = await fetch(`${API_URL}/loans/me/en-cours`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la vérification du prêt en cours");
  }
  return reponse.json() as Promise<PretEnCours>;
}

export type Plafond = {
  plafond?: number;
  nombre_prets_reussis: number;
  salaire_renseigne: boolean;
  niveau_code: string;
  niveau_libelle: string;
  niveau_emoji: string;
  a_eu_un_retard: boolean;
};

export type Parrainage = {
  mon_code: string;
  solde_parrainage: number;
  nombre_filleuls: number;
  nombre_filleuls_ayant_rembourse: number;
};

export async function obtenirMonParrainage(token: string) {
  const reponse = await fetch(`${API_URL}/clients/me/parrainage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du parrainage");
  }
  return reponse.json() as Promise<Parrainage>;
}

export async function obtenirMonPlafond(token: string) {
  const reponse = await fetch(`${API_URL}/loans/me/plafond`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du plafond");
  }
  return reponse.json() as Promise<Plafond>;
}

export async function obtenirPlafondClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/plafond`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du plafond du client");
  }
  return reponse.json() as Promise<Plafond>;
}

export type Echeance = {
  id: string;
  numero: number;
  montant: number;
  date_echeance: string;
  payee: boolean;
  payee_le?: string;
  declaration_canal?: string;
  declaration_reference?: string;
  declaration_le?: string;
  frais_retard: number;
};

export async function obtenirEcheances(token: string, loanId: string) {
  const reponse = await fetch(`${API_URL}/loans/${loanId}/installments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des échéances");
  }
  return reponse.json() as Promise<Echeance[]>;
}

export async function declarerPaiementEcheance(token: string, loanId: string, installmentId: string, canal: string, reference: string) {
  const reponse = await fetch(`${API_URL}/loans/${loanId}/echeances/${installmentId}/declarer-paiement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ canal, reference }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la déclaration du paiement");
  }
  return donnees as Echeance;
}

// Retirée côté client : seul un analyste peut confirmer un paiement (voir plus bas).

export async function obtenirEcheancesAnalyste(token: string, loanId: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}/installments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des échéances");
  }
  return reponse.json() as Promise<Echeance[]>;
}

export async function confirmerPaiementEcheance(token: string, loanId: string, installmentId: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}/installments/${installmentId}/confirmer-paiement`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la confirmation du paiement");
  }
  return donnees as Echeance;
}

export type TypeDocument = "piece_identite" | "carte_residence" | "contrat_travail" | "certificat_travail";

export type DocumentClient = {
  id: string;
  document_type: TypeDocument;
  original_file_name: string;
  uploaded_at: string;
};

export async function envoyerDocument(token: string, type: TypeDocument, fichier: File) {
  const formData = new FormData();
  formData.append("document_type", type);
  formData.append("fichier", fichier);

  const reponse = await fetch(`${API_URL}/clients/me/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi du document");
  }
  return donnees as DocumentClient;
}

export async function obtenirMesDocuments(token: string) {
  const reponse = await fetch(`${API_URL}/clients/me/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des documents");
  }
  return reponse.json() as Promise<DocumentClient[]>;
}

// ---------------------- Espace analyste ----------------------

export async function obtenirDemandesEnAttente(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des demandes");
  }
  return reponse.json() as Promise<LoanOut[]>;
}

export async function obtenirToutesLesDemandes(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/toutes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des demandes");
  }
  return reponse.json() as Promise<LoanOut[]>;
}

export async function obtenirDossier(token: string, loanId: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du dossier");
  }
  return reponse.json() as Promise<LoanDetailOut>;
}

export async function deciderDossier(
  token: string,
  loanId: string,
  decision: "approuve" | "refuse" | "infos_demandees",
  comment?: string,
  approvedAmount?: number
) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}/decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      decision,
      comment: comment || undefined,
      approved_amount: approvedAmount,
    }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la décision");
  }
  return donnees as LoanOut;
}

export async function supprimerDossier(token: string, loanId: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    const donnees = await reponse.json().catch(() => ({}));
    throw new Error(donnees.detail || "Erreur lors de la suppression du dossier");
  }
}

export type DecisionLog = {
  id: string;
  ancien_statut?: string;
  nouveau_statut: string;
  commentaire?: string;
  analyst_email?: string;
  cree_le: string;
};

export async function obtenirJournalDecisions(token: string, loanId: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}/journal`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du journal");
  }
  return reponse.json() as Promise<DecisionLog[]>;
}

export type IdentityStatus = {
  identity_verified: boolean;
  identity_rejected: boolean;
  identity_rejection_reason?: string;
};

export async function verifierIdentiteClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/verifier-identite`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la vérification de l'identité");
  }
  return donnees as IdentityStatus;
}

export async function rejeterIdentiteClient(token: string, clientId: string, reason: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/rejeter-identite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors du rejet de l'identité");
  }
  return donnees as IdentityStatus;
}

export async function obtenirMonStatutIdentite(token: string) {
  const reponse = await fetch(`${API_URL}/clients/me/identite`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du statut d'identité");
  }
  return reponse.json() as Promise<IdentityStatus>;
}

export async function obtenirStatutIdentiteClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/identite`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du statut d'identité");
  }
  return reponse.json() as Promise<IdentityStatus>;
}

export type ClientApercu = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
  nombre_prets: number;
  identity_verified: boolean;
  identity_rejected: boolean;
  dernier_score?: number;
  dernier_risque?: string;
};

export async function obtenirTousLesClients(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des clients");
  }
  return reponse.json() as Promise<ClientApercu[]>;
}

export type ClientDetail = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  birth_date?: string;
  national_id_number?: string;
  profession?: string;
  employer?: string;
  employment_type?: string;
  monthly_income?: number;
  monthly_expenses?: number;
  activity_seniority_months?: number;
  categorie_professionnelle?: string;
  anciennete_residence?: string;
  autres_credits_mensuels?: number;
  email: string;
  created_at: string;
  identity_verified: boolean;
  identity_rejected: boolean;
  identity_rejection_reason?: string;
};

export async function obtenirFicheClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération de la fiche client");
  }
  return reponse.json() as Promise<ClientDetail>;
}

export type EcheanceGlobale = {
  id: string;
  loan_id: string;
  numero: number;
  montant: number;
  date_echeance: string;
  payee: boolean;
  payee_le?: string;
  client_id: string;
  client_first_name: string;
  client_last_name: string;
  declaration_canal?: string;
  declaration_reference?: string;
  declaration_le?: string;
  frais_retard: number;
};

export async function obtenirTousLesRemboursements(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/remboursements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des remboursements");
  }
  return reponse.json() as Promise<EcheanceGlobale[]>;
}

export type AuditEntry = {
  id: string;
  loan_id: string;
  client_first_name: string;
  client_last_name: string;
  ancien_statut?: string;
  nouveau_statut: string;
  commentaire?: string;
  analyst_email?: string;
  cree_le: string;
};

export async function obtenirAuditGlobal(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/audit`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du journal d'audit");
  }
  return reponse.json() as Promise<AuditEntry[]>;
}

export type ScoringApercu = {
  loan_id: string;
  client_first_name: string;
  client_last_name: string;
  status: string;
  credit_score?: number;
  risk_level?: string;
  profession_score?: number;
  anciennete_score?: number;
  capacity_score?: number;
  residence_score?: number;
  history_score?: number;
};

export async function obtenirScoringPortefeuille(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/scoring`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du scoring");
  }
  return reponse.json() as Promise<ScoringApercu[]>;
}

export type Taux = {
  id: string;
  duration_weeks: number;
  rate_percent: number;
  is_active: boolean;
};

export async function obtenirTaux(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/parametres/taux`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des taux");
  }
  return reponse.json() as Promise<Taux[]>;
}

export async function modifierTaux(token: string, tauxId: string, ratePercent: number) {
  const reponse = await fetch(`${API_URL}/analyst/parametres/taux/${tauxId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rate_percent: ratePercent }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la modification du taux");
  }
  return donnees as Taux;
}

export type UtilisateurApercu = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export async function obtenirUtilisateurs(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/utilisateurs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des utilisateurs");
  }
  return reponse.json() as Promise<UtilisateurApercu[]>;
}

export async function modifierRoleUtilisateur(token: string, userId: string, role: string) {
  const reponse = await fetch(`${API_URL}/analyst/utilisateurs/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors du changement de rôle");
  }
  return donnees as UtilisateurApercu;
}

export type AlerteFraude = {
  type: string;
  gravite: string;
  message: string;
};

export async function obtenirAlertesFraudeClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/alertes-fraude`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des alertes fraude");
  }
  return reponse.json() as Promise<AlerteFraude[]>;
}

export type AlerteFraudeGlobale = AlerteFraude & {
  client_id: string;
  client_first_name: string;
  client_last_name: string;
};

export async function obtenirAlertesFraudeGlobales(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/alertes-fraude`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des alertes fraude");
  }
  return reponse.json() as Promise<AlerteFraudeGlobale[]>;
}

export type ResultatRecherche = {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_phone: string;
  amount_requested: number;
  status: string;
};

export async function rechercherDossiers(token: string, q: string) {
  const reponse = await fetch(`${API_URL}/analyst/recherche?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la recherche");
  }
  return reponse.json() as Promise<ResultatRecherche[]>;
}

export type StatMois = {
  mois: string;
  capital_prete: number;
  montant_encaisse: number;
  nombre_dossiers_traites: number;
  nombre_approuves: number;
};

export async function obtenirStatistiques(token: string, mois: number = 6) {
  const reponse = await fetch(`${API_URL}/analyst/statistiques?mois=${mois}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des statistiques");
  }
  return reponse.json() as Promise<StatMois[]>;
}

export type ClientRisque = {
  client_id: string;
  client_first_name: string;
  client_last_name: string;
  client_phone: string;
  nombre_prets: number;
  nombre_prets_approuves: number;
  echeances_en_retard: number;
  montant_total_emprunte: number;
  dernier_risque?: string;
};

export async function obtenirClientsARisque(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients-a-risque`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des clients à risque");
  }
  return reponse.json() as Promise<ClientRisque[]>;
}

export async function obtenirPretsDuClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/prets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération de l'historique du client");
  }
  return reponse.json() as Promise<LoanOut[]>;
}

export async function obtenirDocumentsDuClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des documents");
  }
  return reponse.json() as Promise<DocumentClient[]>;
}

export async function telechargerDocument(token: string, documentId: string, nomFichier: string) {
  const reponse = await fetch(`${API_URL}/analyst/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors du téléchargement du document");
  }
  const blob = await reponse.blob();
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

// ---------------------- Assistance (tchat) ----------------------

export type MessageAssistance = {
  id: string;
  auteur: "client" | "support";
  contenu?: string;
  fichier_nom?: string;
  envoye_le: string;
};

export async function obtenirMesMessagesAssistance(token: string) {
  const reponse = await fetch(`${API_URL}/support/messages/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des messages");
  }
  return reponse.json() as Promise<MessageAssistance[]>;
}

export async function envoyerMessageAssistance(token: string, contenu: string, fichier?: File) {
  const formData = new FormData();
  formData.append("contenu", contenu);
  if (fichier) formData.append("fichier", fichier);

  const reponse = await fetch(`${API_URL}/support/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi du message");
  }
  return donnees as MessageAssistance;
}

export async function telechargerFichierChat(token: string, messageId: string, nomFichier: string) {
  const reponse = await fetch(`${API_URL}/support/messages/${messageId}/fichier`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors du téléchargement du fichier");
  }
  const blob = await reponse.blob();
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

// ---------------------- Assistance : conversations côté analyste ----------------------

export type ConversationApercu = {
  client_id: string;
  client_first_name: string;
  client_last_name: string;
  dernier_message: string;
  dernier_message_le: string;
  non_lus: number;
};

export async function obtenirConversations(token: string) {
  const reponse = await fetch(`${API_URL}/analyst/support/clients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des conversations");
  }
  return reponse.json() as Promise<ConversationApercu[]>;
}

export async function obtenirMessagesDunClient(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/support/messages/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des messages");
  }
  return reponse.json() as Promise<MessageAssistance[]>;
}

export async function repondreAUnClient(token: string, clientId: string, contenu: string, fichier?: File) {
  const formData = new FormData();
  formData.append("contenu", contenu);
  if (fichier) formData.append("fichier", fichier);

  const reponse = await fetch(`${API_URL}/analyst/support/messages/${clientId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi de la réponse");
  }
  return donnees as MessageAssistance;
}

// ---------------------- Contrat PDF (côté analyste) ----------------------

export async function telechargerContratPdf(token: string, loanId: string, nomClient: string) {
  const reponse = await fetch(`${API_URL}/analyst/loans/${loanId}/contrat.pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors du téléchargement du contrat");
  }
  const blob = await reponse.blob();
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `contrat-lotafinance-${nomClient}.pdf`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

// ---------------------- Informations et documents de l'analyste ----------------------

export async function enregistrerMesInformations(token: string, firstName: string, lastName: string) {
  const reponse = await fetch(`${API_URL}/users/me/informations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ first_name: firstName, last_name: lastName }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'enregistrement");
  }
  return donnees;
}

export type TypeDocumentAnalyste = "piece_identite" | "diplome" | "cv";

export type DocumentAnalyste = {
  id: string;
  document_type: TypeDocumentAnalyste;
  original_file_name: string;
  uploaded_at: string;
};

export async function envoyerMonDocumentAnalyste(token: string, type: TypeDocumentAnalyste, fichier: File) {
  const formData = new FormData();
  formData.append("document_type", type);
  formData.append("fichier", fichier);

  const reponse = await fetch(`${API_URL}/users/me/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi du document");
  }
  return donnees as DocumentAnalyste;
}

export async function obtenirMesDocumentsAnalyste(token: string) {
  const reponse = await fetch(`${API_URL}/users/me/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des documents");
  }
  return reponse.json() as Promise<DocumentAnalyste[]>;
}

export async function telechargerMonDocumentAnalyste(token: string, documentId: string, nomFichier: string) {
  const reponse = await fetch(`${API_URL}/users/me/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors du téléchargement du document");
  }
  const blob = await reponse.blob();
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

// ---------------------- Vérification automatique d'identité (OCR) ----------------------

export type VerificationAuto = {
  texte_lisible: boolean;
  prenom_trouve: boolean | null;
  nom_trouve: boolean | null;
  numero_piece_trouve: boolean | null;
  extrait_texte: string;
};

export async function lancerVerificationAutomatique(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/analyst/clients/${clientId}/verification-auto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la vérification automatique");
  }
  return donnees as VerificationAuto;
}

// ---------------------- Tickets / réclamations ----------------------

export type StatutTicket = "nouveau" | "en_cours" | "en_attente" | "resolu";

export type Ticket = {
  id: string;
  sujet: string;
  categorie?: string;
  description: string;
  statut: StatutTicket;
  priorite: string;
  cree_le: string;
  mis_a_jour_le: string;
  resolu_le?: string;
  dernier_message_agent_le?: string;
};

export type TicketDetail = Ticket & {
  client_id: string;
  client_first_name: string;
  client_last_name: string;
  client_phone: string;
  agent_id?: string;
  agent_email?: string;
};

export type TicketMessage = {
  id: string;
  auteur: "client" | "agent";
  contenu: string;
  envoye_le: string;
};

// ---- Côté client ----

export async function creerTicket(token: string, sujet: string, description: string, categorie?: string) {
  const reponse = await fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sujet, description, categorie }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la création de la réclamation");
  }
  return donnees as Ticket;
}

export async function obtenirMesTickets(token: string) {
  const reponse = await fetch(`${API_URL}/tickets/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération de vos réclamations");
  }
  return reponse.json() as Promise<Ticket[]>;
}

export async function obtenirMonTicket(token: string, ticketId: string) {
  const reponse = await fetch(`${API_URL}/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération de la réclamation");
  }
  return reponse.json() as Promise<TicketDetail>;
}

export async function obtenirMessagesDeMonTicket(token: string, ticketId: string) {
  const reponse = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des messages");
  }
  return reponse.json() as Promise<TicketMessage[]>;
}

export async function repondreAMonTicket(token: string, ticketId: string, contenu: string) {
  const reponse = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contenu }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi du message");
  }
  return donnees as TicketMessage;
}

// ---- Côté agent support ----

export async function obtenirTousLesTicketsSupport(token: string, statut?: string) {
  const url = statut && statut !== "tous" ? `${API_URL}/support/tickets?statut=${statut}` : `${API_URL}/support/tickets`;
  const reponse = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des tickets");
  }
  return reponse.json() as Promise<TicketDetail[]>;
}

export async function obtenirTicketSupport(token: string, ticketId: string) {
  const reponse = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération du ticket");
  }
  return reponse.json() as Promise<TicketDetail>;
}

export async function obtenirMessagesTicketSupport(token: string, ticketId: string) {
  const reponse = await fetch(`${API_URL}/support/tickets/${ticketId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des messages");
  }
  return reponse.json() as Promise<TicketMessage[]>;
}

export async function repondreTicketSupport(token: string, ticketId: string, contenu: string) {
  const reponse = await fetch(`${API_URL}/support/tickets/${ticketId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contenu }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'envoi de la réponse");
  }
  return donnees as TicketMessage;
}

export async function changerStatutTicket(token: string, ticketId: string, statut: StatutTicket) {
  const reponse = await fetch(`${API_URL}/support/tickets/${ticketId}/statut`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ statut }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors du changement de statut");
  }
  return donnees as Ticket;
}


// ---------------------- Modèles de réponse ----------------------

export type ModeleReponse = {
  id: string;
  titre: string;
  contenu: string;
  cree_le: string;
};

export async function obtenirModelesReponse(token: string) {
  const reponse = await fetch(`${API_URL}/support/modeles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des modèles");
  }
  return reponse.json() as Promise<ModeleReponse[]>;
}

export async function creerModeleReponse(token: string, titre: string, contenu: string) {
  const reponse = await fetch(`${API_URL}/support/modeles`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ titre, contenu }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la création du modèle");
  }
  return donnees as ModeleReponse;
}

export async function supprimerModeleReponse(token: string, modeleId: string) {
  const reponse = await fetch(`${API_URL}/support/modeles/${modeleId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de la suppression du modèle");
  }
  return donnees;
}


// ---------------------- Assignation d'agent, historique client ----------------------

export type AgentApercu = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
};

export async function obtenirAgentsSupport(token: string) {
  const reponse = await fetch(`${API_URL}/support/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération des agents");
  }
  return reponse.json() as Promise<AgentApercu[]>;
}

export async function assignerTicket(token: string, ticketId: string, agentId: string) {
  const reponse = await fetch(`${API_URL}/support/tickets/${ticketId}/assigner`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ agent_id: agentId }),
  });
  const donnees = await reponse.json();
  if (!reponse.ok) {
    throw new Error(donnees.detail || "Erreur lors de l'assignation");
  }
  return donnees as TicketDetail;
}

export async function obtenirTicketsDuClientSupport(token: string, clientId: string) {
  const reponse = await fetch(`${API_URL}/support/tickets/client/${clientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reponse.ok) {
    throw new Error("Erreur lors de la récupération de l'historique du client");
  }
  return reponse.json() as Promise<Ticket[]>;
}
