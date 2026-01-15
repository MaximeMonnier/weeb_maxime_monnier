import React, { useEffect, useState } from "react";
import { Link, NavLink as RRNavLink, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import Logo from "../ui/Logo/Logo";

type NavItem =
  | { type: "hash"; href: string; label: string } // ex: "#accueil"
  | { type: "route"; to: string; label: string }; // ex: "/contact"

function NavBar() {
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Toggle du thème
  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Détection du scroll pour effet sticky
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialisation du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      updateTheme(next);
      return next;
    });
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Ferme le menu mobile au changement de route
  useEffect(() => {
    closeMobileMenu();
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
                onClick={() => {
                  closeMobileMenu?.();
                }}
              >
                <Logo size="md" />
              </Link>

              {/* Navigation Desktop */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  if (item.type === "route") {
                    return (
                      <RRNavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `nav-link ${isActive ? "active" : ""}`
                        }
                      >
                        {item.label}
                      </RRNavLink>
                    );
                  }

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleHashClick(e, item.href)}
                      className="nav-link"
                    >
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-ghost touch-target rounded-full"
                aria-label={
                  isDark ? "Activer le mode clair" : "Activer le mode sombre"
                }
                title={isDark ? "Mode clair" : "Mode sombre"}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              <Link className="nav-link" to="/login">
                Se connecter
              </Link>

              {/* IMPORTANT : pas de <a> dans un <button> */}
              <Link to="/contact" className="btn-primary">
                Nous rejoindre
              </Link>

              {/* Si tu veux absolument utiliser MainButton, il faut qu'il supporte "asChild".
                  Sinon préfère <Link className="btn-primary" ...> */}
              {/* <MainButton className="btn-primary" onClick={() => {}}>
                  Nous rejoindre
                </MainButton> */}
            </div>

            {/* Mobile Buttons */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="btn-ghost touch-target rounded-full p-2"
                aria-label={
                  isDark ? "Activer le mode clair" : "Activer le mode sombre"
                }
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

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

        {/* Mobile Menu */}
        <div
          className={[
            "px-6 md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="bg-secondary border-t border-primary">
            <div className="container-custom py-4">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  if (item.type === "route") {
                    return (
                      <RRNavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `nav-link block py-3 px-4 rounded-lg hover:bg-tertiary ${
                            isActive ? "active" : ""
                          }`
                        }
                      >
                        {item.label}
                      </RRNavLink>
                    );
                  }

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleHashClick(e, item.href)}
                      className="nav-link block py-3 px-4 rounded-lg hover:bg-tertiary"
                    >
                      {item.label}
                    </a>
                  );
                })}

                <RRNavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className="nav-link block py-3 px-4 rounded-lg hover:bg-tertiary"
                >
                  Se connecter
                </RRNavLink>

                <Link
                  to="/contact"
                  onClick={closeMobileMenu}
                  className="btn-primary w-full mt-4"
                >
                  Nous rejoindre
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
}

export default NavBar;
