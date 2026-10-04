import { useEffect, useState } from "react";

export function useTheme() {
  // La règle du thème initial vit dans le script en ligne d'`index.html`, qui
  // pose la classe avant le premier rendu : le hook n'en lit que le résultat.
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );

  // À chaque changement de isDark (et au montage) : synchronise <html> + localStorage
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { isDark, toggleTheme };
}
