export type Theme = "light" | "dark";

export const THEME_COOKIE = "tesis-theme";

export function parseTheme(value: string | undefined | null): Theme | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

export function themeCookieValue(theme: Theme): string {
  return `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}
