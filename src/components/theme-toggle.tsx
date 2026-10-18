"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "financontrol:theme";

/**
 * Alternância claro/escuro. O estado efetivo vive no `className` do
 * <html> (aplicado pelo script anti-flash do root layout); aqui só
 * espelhamos/aplicamos. Sem preferência salva, acompanha o sistema:
 * se o usuário voltar ao tema do sistema, a chave salva é removida
 * para o app seguir mudanças do SO de novo.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    if (dark === null) return;
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      const systemPrefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (next === systemPrefersDark) {
        localStorage.removeItem(THEME_KEY);
      } else {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      }
    } catch {
      // sem localStorage p.ex. modo privado estrito: só a classe aplica
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark === null ? "Tema" : `Tema ${dark ? "escuro" : "claro"} — alternar`}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors ${className ?? ""}`}
    >
      {/* PlaceholderGhost pré-hidratação (evita mismatch server/client) */}
      {dark === null ? (
        <Sun className="h-4 w-4 opacity-0" />
      ) : dark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
