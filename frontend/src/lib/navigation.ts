import type { NavItem } from "../types/navigation";

// Les cinq couples servis à la fois par l'en-tête, le menu mobile et le pied de
// page. Recopiés, ils ont coûté deux défauts : « Nous rejoindre » menant ailleurs
// en mobile (#148), et des libellés divergents entre le menu et le pied (#155).
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
