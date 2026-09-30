export type ThemeMode = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";

/**
 * Exécuté avant le premier rendu (guide Next « preventing flash before hydration ») :
 * applique la classe `dark` selon la préférence enregistrée ou celle du système.
 */
export const themeInitScript = `(function(){try{var r=document.documentElement;var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/);var t=m?m[1]:'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);r.dataset.theme=t;}catch(e){}})();`;

export function readThemeMode(): ThemeMode {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveDark(mode: ThemeMode): boolean {
  return mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle("dark", resolveDark(mode));
  document.cookie = `${THEME_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
