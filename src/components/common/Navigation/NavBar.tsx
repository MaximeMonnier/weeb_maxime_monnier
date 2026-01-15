import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../../ui/Logo/Logo";
import ThemeToggle from "../ThemeToggle";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { useTheme } from "../../../hooks/useTheme";
import type { NavItem } from "../../../types/navigation";

function NavBar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

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

  // Ferme le menu mobile au changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Helpers
  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHashClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    e.preventDefault();
    scrollToHash(hash);
    closeMobileMenu();
  };

  // Navigation
  const navItems: NavItem[] = [
    { type: "hash", href: "#accueil", label: "À propos de nous" },
    { type: "route", to: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-primary shadow-md dark:shadow-dark-md"
            : "bg-transparent",
        ].join(" ")}
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

              <Link className="nav-link" to="/login">
                Se connecter
              </Link>

              <Link to="/contact" className="btn-primary">
                Nous rejoindre
              </Link>
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
                className="btn-ghost touch-target p-2"
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
          navItems={navItems}
          onClose={closeMobileMenu}
          onHashClick={handleHashClick}
        />
      </nav>

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
}

export default NavBar;
