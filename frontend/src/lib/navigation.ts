import type { NavItem } from "../types/navigation";

// Les cinq couples servis à la fois par l'en-tête, le menu mobile et le pied de
// page. Recopiés, ils divergent : même libellé menant ailleurs, ou même lien
// nommé autrement d'un bloc à l'autre.
export const LIEN_BLOG: NavItem = {
  to: "/blog",
  label: "Blog",
};

export const LIEN_A_PROPOS: NavItem = {
  to: "/about",
  label: "À propos de nous",
};

export const LIEN_CONTACT: NavItem = {
  to: "/contact",
  label: "Contact",
};

export const LIEN_CONNEXION: NavItem = {
  to: "/login",
  label: "Se connecter",
};

export const LIEN_INSCRIPTION: NavItem = {
  to: "/subscribe",
  label: "Nous rejoindre",
};
