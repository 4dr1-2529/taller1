/** Validación O(n) sin regex propensas a ReDoS (Sonar S5852). */

const MAX_EMAIL_LEN = 254;
const MAX_LOCAL_LEN = 64;
const MAX_DOMAIN_LEN = 253;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length === 0 || email.length > MAX_EMAIL_LEN) return false;
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > MAX_LOCAL_LEN || domain.length === 0 || domain.length > MAX_DOMAIN_LEN) {
    return false;
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  const dot = domain.lastIndexOf(".");
  if (dot <= 0 || dot >= domain.length - 1) return false;
  return !email.includes(" ");
}

function isLetter(ch: string): boolean {
  return ch.length === 1 && /\p{L}/u.test(ch);
}

export function isPersonName(value: string, maxLen = 120): boolean {
  if (value.length < 2 || value.length > maxLen) return false;
  for (const ch of value) {
    if (ch === " " || ch === "'" || ch === "-") continue;
    if (!isLetter(ch)) return false;
  }
  return true;
}

export function isCodigo(value: string, maxLen = 32): boolean {
  if (value.length < 2 || value.length > maxLen) return false;
  for (const ch of value) {
    const ok =
      (ch >= "A" && ch <= "Z") ||
      (ch >= "a" && ch <= "z") ||
      (ch >= "0" && ch <= "9") ||
      ch === "_" ||
      ch === "-";
    if (!ok) return false;
  }
  return true;
}
