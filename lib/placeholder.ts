function fnv(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(hash: number, salt: number, arr: readonly T[]): T {
  return arr[(hash + salt * 2654435761) % arr.length]!;
}

function jitter(hash: number, salt: number, range: number): number {
  return (((hash + salt * 40503) % (range * 2 + 1)) - range) | 0;
}

const TONES = ["#d8dbd4", "#cbcfc7", "#bec3ba", "#e2e4df"] as const;
const DARKS = ["#3a3e44", "#4a4f57", "#2c2f34"] as const;

function initialsFrom(seed: string): string {
  const words = seed
    .replace(/^(disposables|pod_systems|mods|e_liquids|coils_accessories)-/, "")
    .split("-")
    .filter((w) => /^[a-z]/i.test(w));
  const a = words[0]?.[0] ?? "e";
  const b = words[1]?.[0] ?? "7";
  return (a + b).toUpperCase();
}

function silhouette(seed: string, h: number): string {
  const tone = pick(h, 1, TONES);
  const tone2 = pick(h, 2, TONES);
  const dark = pick(h, 3, DARKS);
  const dx = jitter(h, 4, 24);
  const dy = jitter(h, 5, 16);

  if (seed.startsWith("disposables")) {
    const x = 325 + dx;
    const y = 180 + dy;
    return `
      <rect x="${x}" y="${y}" width="150" height="420" rx="72" fill="${tone}"/>
      <rect x="${x}" y="${y}" width="150" height="64" rx="32" fill="${dark}"/>
      <rect x="${x + 28}" y="${y + 120}" width="94" height="180" rx="12" fill="${tone2}"/>
      <circle cx="${x + 75}" cy="${y + 380}" r="7" fill="#2e45ff"/>`;
  }
  if (seed.startsWith("pod_systems")) {
    const x = 300 + dx;
    const y = 200 + dy;
    return `
      <rect x="${x}" y="${y}" width="200" height="380" rx="44" fill="${tone}"/>
      <rect x="${x + 46}" y="${y - 26}" width="108" height="96" rx="20" fill="${tone2}"/>
      <rect x="${x + 62}" y="${y - 14}" width="76" height="60" rx="10" fill="#f1f2ef"/>
      <rect x="${x + 40}" y="${y + 140}" width="120" height="150" rx="16" fill="${tone2}"/>
      <circle cx="${x + 100}" cy="${y + 330}" r="16" fill="${dark}"/>`;
  }
  if (seed.startsWith("mods")) {
    const x = 270 + dx;
    const y = 210 + dy;
    return `
      <rect x="${x}" y="${y}" width="260" height="400" rx="36" fill="${tone}"/>
      <rect x="${x + 18}" y="${y + 18}" width="224" height="364" rx="26" fill="${tone2}"/>
      <rect x="${x + 56}" y="${y + 60}" width="148" height="104" rx="12" fill="${dark}"/>
      <rect x="${x + 66}" y="${y + 72}" width="72" height="10" rx="5" fill="#2e45ff"/>
      <rect x="${x + 66}" y="${y + 94}" width="112" height="8" rx="4" fill="#8b9098"/>
      <circle cx="${x + 130}" cy="${y + 240}" r="30" fill="${dark}"/>
      <circle cx="${x + 92}" cy="${y + 310}" r="14" fill="${dark}"/>
      <circle cx="${x + 168}" cy="${y + 310}" r="14" fill="${dark}"/>`;
  }
  if (seed.startsWith("e_liquids")) {
    const x = 305 + dx;
    const y = 250 + dy;
    return `
      <rect x="${x + 62}" y="${y - 70}" width="66" height="80" rx="8" fill="${pick(h, 6, DARKS)}"/>
      <rect x="${x + 74}" y="${y - 4}" width="42" height="30" fill="${tone2}"/>
      <rect x="${x}" y="${y + 20}" width="190" height="330" rx="30" fill="${tone}"/>
      <rect x="${x + 22}" y="${y + 96}" width="146" height="150" rx="10" fill="#f1f2ef"/>
      <rect x="${x + 42}" y="${y + 124}" width="106" height="12" rx="6" fill="${pick(h, 7, DARKS)}"/>
      <rect x="${x + 42}" y="${y + 150}" width="70" height="9" rx="4" fill="#8b9098"/>
      <rect x="${x + 42}" y="${y + 208}" width="40" height="9" rx="4" fill="#2e45ff"/>`;
  }
  if (seed.startsWith("bulk")) {
    const x = 250 + dx;
    const y = 250 + dy;
    return `
      <rect x="${x}" y="${y + 150}" width="300" height="180" rx="10" fill="${tone}"/>
      <rect x="${x + 20}" y="${y + 40}" width="130" height="150" rx="8" fill="${tone2}"/>
      <rect x="${x + 20}" y="${y + 40}" width="130" height="34" rx="8" fill="${dark}"/>
      <rect x="${x + 160}" y="${y}" width="130" height="190" rx="8" fill="${tone2}"/>
      <rect x="${x + 160}" y="${y}" width="130" height="40" rx="8" fill="${dark}"/>
      <rect x="${x + 46}" y="${y + 96}" width="78" height="10" rx="5" fill="#2e45ff"/>
      <rect x="${x + 186}" y="${y + 66}" width="78" height="10" rx="5" fill="#ff7a1a"/>
      <text x="${x + 210}" y="${y + 150}" font-family="ui-monospace, monospace" font-size="46" font-weight="700" fill="${dark}">×</text>`;
  }
  const x = 250 + dx;
  const y = 290 + dy;
  return `
    <rect x="${x}" y="${y}" width="300" height="220" rx="24" fill="${tone}"/>
    <circle cx="${x + 150}" cy="${y + 110}" r="72" fill="${tone2}"/>
    <circle cx="${x + 150}" cy="${y + 110}" r="46" fill="${tone}"/>
    <circle cx="${x + 150}" cy="${y + 110}" r="22" fill="${pick(h, 8, DARKS)}"/>
    <circle cx="${x + 150}" cy="${y + 110}" r="6" fill="#2e45ff"/>`;
}

export function placeholderSvg(seed: string): string {
  const h = fnv(seed);
  const initials = initialsFrom(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="Product image placeholder">
  <rect width="800" height="800" fill="#f1f2ef"/>
  <ellipse cx="400" cy="650" rx="230" ry="34" fill="#e3e5e0"/>
  ${silhouette(seed, h)}
  <g transform="translate(48 692)">
    <rect width="60" height="60" rx="6" fill="none" stroke="#b6bab1" stroke-width="2"/>
    <text x="10" y="26" font-family="ui-monospace, monospace" font-size="12" fill="#8b9098">${(h % 89) + 10}</text>
    <text x="10" y="50" font-family="ui-monospace, monospace" font-size="22" font-weight="700" fill="#3a3e44">${initials}</text>
  </g>
</svg>`;
}
