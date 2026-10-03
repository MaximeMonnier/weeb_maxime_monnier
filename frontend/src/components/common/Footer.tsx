import { Link } from "react-router-dom";

import Logo from "../ui/Logo/Logo";
import {
  LIEN_A_PROPOS,
  LIEN_BLOG,
  LIEN_CONNEXION,
  LIEN_CONTACT,
  LIEN_INSCRIPTION,
} from "../../lib/navigation";
import { useIsAuthenticated } from "../../hooks/useIsAuthenticated";

type FooterLink = {
  label: string;
  to: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

// Chaque `to` doit exister dans `App.tsx` : `Footer.test.tsx` le tient. Les
// entrées servies aussi par l'en-tête viennent de `lib/navigation.ts`, seul
// endroit où s'écrivent leur libellé et leur destination.
const SITE_COLUMN: FooterColumn = {
  title: "SITE",
  links: [{ label: "Accueil", to: "/" }, LIEN_BLOG, LIEN_A_PROPOS],
};

// Entrées du seul visiteur : connecté, l'en-tête propose la déconnexion.
const VISITOR_LINKS: FooterLink[] = [
  LIEN_CONNEXION,
  LIEN_INSCRIPTION,
  { label: "Mot de passe oublié", to: "/forgot-password" },
];

// Le membre connaît son mot de passe : il le change sans passer par un email.
const MEMBER_LINKS: FooterLink[] = [
  { label: "Changer mon mot de passe", to: "/change-password" },
];

const LEGAL_COLUMN: FooterColumn = {
  title: "LÉGAL",
  links: [
    { label: "Conditions d'utilisation", to: "/terms" },
    { label: "Politique de confidentialité", to: "/privacy" },
    LIEN_CONTACT,
  ],
};

const Footer = () => {
  const year = new Date().getFullYear();
  // La même source que `NavBar.tsx` : sans elle, l'en-tête proposerait la
  // déconnexion pendant que le pied de page propose encore l'inscription.
  const isAuthenticated = useIsAuthenticated();

  const accountColumn: FooterColumn = {
    title: "COMPTE",
    links: isAuthenticated ? MEMBER_LINKS : VISITOR_LINKS,
  };

  const columns = [SITE_COLUMN, accountColumn, LEGAL_COLUMN];

  return (
    <footer className="footer">
      <div className="container-custom">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start">
            <Logo size="lg" />
          </div>

          <nav
            aria-label="Navigation du pied de page"
            className="grid w-full grid-cols-2 gap-10 sm:grid-cols-3 md:w-auto"
          >
            {columns.map((col) => (
              <div key={col.title} className="min-w-[140px]">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-caption">
                  {col.title}
                </p>

                <ul className="mt-4 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="footer-link text-sm">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {year} Weeb, Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <SocialIcon
              href="https://youtube.com"
              label="YouTube"
              icon={<YoutubeIcon />}
            />
            <SocialIcon
              href="https://facebook.com"
              label="Facebook"
              icon={<FacebookIcon />}
            />
            <SocialIcon
              href="https://x.com"
              label="Twitter / X"
              icon={<TwitterIcon />}
            />
            <SocialIcon
              href="https://instagram.com"
              label="Instagram"
              icon={<InstagramIcon />}
            />
            <SocialIcon
              href="https://linkedin.com"
              label="LinkedIn"
              icon={<LinkedinIcon />}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target="_blank"
      rel="noreferrer"
      className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-hover hover:text-ink"
    >
      {icon}
    </a>
  );
}

function YoutubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31.5 31.5 0 0 0 2 12a31.5 31.5 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 22 12a31.5 31.5 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.2-1.5 1.5-1.5h1.7V5c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7v3h2.1v8h4.4Z"
      />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.2L6.5 22H2l7.4-8.5L1 2h6.4l4.3 5.7L18.9 2Zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5ZM18 6.6a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z"
      />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.9 6.8a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM5.2 21.4V9h3.4v12.4H5.2Zm5.5 0V9h3.2v1.7h.1c.4-.8 1.6-2 3.6-2 3.9 0 4.6 2.3 4.6 5.5v7.2h-3.4v-6.4c0-1.5 0-3.4-2.2-3.4-2.2 0-2.5 1.6-2.5 3.3v6.5h-3.4Z"
      />
    </svg>
  );
}
