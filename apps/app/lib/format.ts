export function formatPrice(from: number, to: number): string {
  const fmt = (n: number) => n.toLocaleString("sr-RS").replace(/,/g, ".");
  if (from === to) return `${fmt(from)} RSD`;
  return `${fmt(from)}–${fmt(to)} RSD`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDate(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleDateString(
    locale === "sr" ? "sr-RS" : locale === "ru" ? "ru-RU" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
