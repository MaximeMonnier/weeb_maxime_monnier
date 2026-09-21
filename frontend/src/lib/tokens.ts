// Seul fichier à toucher aux jetons : une écriture faite ailleurs n'avertirait
// pas les composants abonnés. Renommer une clé déconnecterait toutes les
// sessions ouvertes au moment du déploiement.
const CLE_ACCES = "access";
const CLE_RENOUVELLEMENT = "refresh";

type Abonne = () => void;

const abonnes = new Set<Abonne>();

function prevenirAbonnes() {
  abonnes.forEach((abonne) => abonne());
}

export function getAccessToken(): string | null {
  return localStorage.getItem(CLE_ACCES);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(CLE_RENOUVELLEMENT);
}

export function saveTokens(tokens: { access: string; refresh: string }): void {
  localStorage.setItem(CLE_ACCES, tokens.access);
  localStorage.setItem(CLE_RENOUVELLEMENT, tokens.refresh);
  prevenirAbonnes();
}

export function clearTokens(): void {
  localStorage.removeItem(CLE_ACCES);
  localStorage.removeItem(CLE_RENOUVELLEMENT);
  prevenirAbonnes();
}

// Une écriture faite dans un autre onglet n'arrive que par l'événement
// `storage`. Sa clé vaut null quand cet onglet a vidé tout le localStorage.
function concerneLesJetons(evenement: StorageEvent): boolean {
  return [null, CLE_ACCES, CLE_RENOUVELLEMENT].includes(evenement.key);
}

export function subscribeToTokens(abonne: Abonne): () => void {
  const surAutreOnglet = (evenement: StorageEvent) => {
    if (concerneLesJetons(evenement)) abonne();
  };

  abonnes.add(abonne);
  window.addEventListener("storage", surAutreOnglet);

  return () => {
    abonnes.delete(abonne);
    window.removeEventListener("storage", surAutreOnglet);
  };
}
