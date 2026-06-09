/** Validación O(n) sin regex propensas a ReDoS (Sonar S5852). */

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
