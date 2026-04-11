import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { colorScheme as nativewindColorScheme } from "nativewind";

const THEME_KEY = "@gbk_tema_escuro";

interface ThemeContextValue {
  modoEscuro: boolean;
  toggleModoEscuro: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function aplicarEsquema(escuro: boolean) {
  const scheme = escuro ? "dark" : "light";
  nativewindColorScheme.set(scheme);
  Appearance.setColorScheme?.(scheme);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.theme = scheme;
    root.classList.toggle("dark", escuro);
  }
}

export function GBKThemeProvider({ children }: { children: React.ReactNode }) {
  const [modoEscuro, setModoEscuro] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === "true") {
        setModoEscuro(true);
        aplicarEsquema(true);
      }
    });
  }, []);

  const toggleModoEscuro = useCallback(() => {
    setModoEscuro((prev) => {
      const novo = !prev;
      AsyncStorage.setItem(THEME_KEY, String(novo));
      aplicarEsquema(novo);
      return novo;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ modoEscuro, toggleModoEscuro }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useGBKTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useGBKTheme deve ser usado dentro de GBKThemeProvider");
  return ctx;
}
