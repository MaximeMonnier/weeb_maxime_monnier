import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Button from "../../ui/Button/MainButton";
import { buttonClasses } from "../../ui/Button/buttonClasses";
import Logo from "../../ui/Logo/Logo";
import ThemeToggle from "../ThemeToggle";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { useTheme } from "../../../hooks/useTheme";
import {
  logout,
  useIsAuthenticated,
} from "../../../hooks/useIsAuthenticated";
import { cx } from "../../../lib/cx";
import {
  LIEN_A_PROPOS,
  LIEN_BLOG,
  LIEN_CONNEXION,
  LIEN_CONTACT,
  LIEN_INSCRIPTION,
} from "../../../lib/navigation";
import type { NavItem } from "../../../types/navigation";

function NavBar() {
  const { isDark, toggleTheme } = useTheme();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Détection du scroll pour effet sticky
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
    navigate("/");
  };

  // Helpers
  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHashClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string,
  ) => {
    e.preventDefault();
    scrollToHash(hash);
    closeMobileMenu();
  };

  // Navigation
  const navItems: NavItem[] = [LIEN_BLOG, LIEN_A_PROPOS, LIEN_CONTACT];

  return (
    <>
      <nav
        // Deux navigations sur la page depuis que le pied de page porte la
        // sienne : sans nom, ni un lecteur d'écran ni `e2e/` ne les départagent.
        aria-label="Navigation principale"
        className={cx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-primary shadow-md dark:shadow-dark-md"
            : "bg-transparent",
        )}
      >
        <div className="container-custom py-6">
          <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="focus-ring-primary rounded inline-flex items-center"
                aria-label="Retour à l'accueil"
                onClick={closeMobileMenu}
              >
                <Logo size="md" />
              </Link>

              <DesktopNav navItems={navItems} onHashClick={handleHashClick} />
            </div>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              ) : (
                <>
                  <Link className="nav-link" to={LIEN_CONNEXION.to}>
                    {LIEN_CONNEXION.label}
                  </Link>

                  <Link
                    to={LIEN_INSCRIPTION.to}
                    className={buttonClasses({ size: "cta" })}
                  >
                    {LIEN_INSCRIPTION.label}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Buttons */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle
                isDark={isDark}
                onToggle={toggleTheme}
                isMobile={true}
              />

              <button
                onClick={toggleMobileMenu}
                className={buttonClasses({
                  variant: "ghost",
                  size: "none",
                  className: "touch-target p-2",
                })}
                aria-label={
                  isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
                }
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          isAuthenticated={isAuthenticated}
          navItems={navItems}
          onClose={closeMobileMenu}
          onHashClick={handleHashClick}
          onLogout={handleLogout}
        />
      </nav>

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
}

export default NavBar;
