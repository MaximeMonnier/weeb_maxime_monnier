import React, { useState, useEffect } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";
import MainButton from "../ui/MainButton";

type NavLink = { href: string; label: string };

function NavBar() {
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
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
    const newTheme = !isDark;
    setIsDark(newTheme);
    updateTheme(newTheme);
  };

  // Toggle menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fermer le menu mobile lors du clic sur un lien
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks: NavLink[] = [
    { href: "#accueil", label: "À Propos de Nous" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${
            isScrolled
              ? "bg-light-bg-primary/95 dark:bg-dark-bg-primary/95 backdrop-blur-md shadow-md dark:shadow-dark-md"
              : "bg-transparent"
          }
        `}
      >
        <div className="container-custom py-6">
          <div className="flex items-center p-4 rounded-2xl bg-dark-bg-secondary bg-secondary justify-between">
            <div className="flex items-center justify-center">
              {/* Logo */}
              <a
                href="#accueil"
                className="flex items-center gap-2 text-2xl font-bold focus-ring-primary"
                aria-label="Retour à l'accueil"
              >
                <span className="text-light-text-primary dark:text-dark-text-primary">
                  weeb
                </span>
              </a>

              {/* Navigation Desktop */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="nav-link">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center">
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

                {/* CTA Button */}
                <a className="nav-link" href="#login">
                  Se connecter
                </a>
                <MainButton className="btn-primary">
                  {" "}
                  <a href="#contact">Nous Rejoindre</a>
                </MainButton>
              </div>
            </div>

            {/* Mobile Menu Button + Theme Toggle */}
            <div className="flex md:hidden items-center gap-2">
              {/* Theme Toggle Mobile */}
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

              {/* Hamburger Button */}
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
          className={`
            px-6
            md:hidden
            overflow-hidden
            transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className=" bg-light-bg-secondary dark:bg-dark-bg-secondary border-t border-light-border-primary dark:border-dark-border-primary">
            <div className="container-custom py-4">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="nav-link block py-3 px-4 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                  >
                    {link.label}
                  </a>
                ))}

                {/* CTA Mobile */}
                <a className="nav-link" href="#login">
                  Log In
                </a>
                <a
                  href="#contact"
                  onClick={closeMobileMenu}
                  className="btn-primary w-full mt-4"
                >
                  Se connecter
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer pour éviter que le contenu passe sous la navbar fixe */}
      <div className="h-16 md:h-20" />
    </>
  );
}

export default NavBar;
