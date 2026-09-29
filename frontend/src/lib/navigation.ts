import type { NavItem } from "../types/navigation";

// La seule variante de `NavItem` qu'un lien partagé puisse prendre : la variante
// `hash` sert les ancres de défilement, et ne porte pas le `to` que le pied de
// page attend.
type LienPartage = Extract<NavItem, { type: "route" }>;

// Les cinq couples servis à la fois par l'en-tête, le menu mobile et le pied de
// page. Recopiés, ils ont coûté deux défauts : « Nous rejoindre » menant ailleurs
// en mobile (#148), et des libellés divergents entre le menu et le pied (#155).
export const LIEN_BLOG: LienPartage = {
  type: "route",
  to: "/blog",
  label: "Blog",
};

export const LIEN_A_PROPOS: LienPartage = {
  type: "route",
  to: "/about",
  label: "À propos de nous",
};

export const LIEN_CONTACT: LienPartage = {
  type: "route",
  to: "/contact",
  label: "Contact",
};

export const LIEN_CONNEXION: LienPartage = {
  type: "route",
  to: "/login",
  label: "Se connecter",
};

export const LIEN_INSCRIPTION: LienPartage = {
  type: "route",
  to: "/subscribe",
  label: "Nous rejoindre",
};
