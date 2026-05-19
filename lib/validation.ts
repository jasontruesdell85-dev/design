export function cleanText(value: unknown, max = 5000): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function validSessionId(value: unknown): string | null {
  const id = cleanText(value, 80);
  return /^[a-zA-Z0-9-]{8,80}$/.test(id) ? id : null;
}

export function validEmail(value: unknown): boolean {
  const email = cleanText(value, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validProductId(value: unknown): boolean {
  return ["wooden_plaque", "glass_plaque", "glass_candle"].includes(cleanText(value, 40));
}

export function validOrientation(value: unknown): "portrait" | "landscape" {
  return cleanText(value, 20) === "landscape" ? "landscape" : "portrait";
}
