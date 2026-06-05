export type NavItem =
  | { type: "hash"; href: string; label: string }
  | { type: "route"; to: string; label: string };
