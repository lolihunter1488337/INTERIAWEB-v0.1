import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("interia_theme") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") { html.classList.add("light"); }
    else                   { html.classList.remove("light"); }
    try { localStorage.setItem("interia_theme", theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
