import type { Job } from "../types";

export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d} j`;
  const w = Math.floor(d / 7);
  return `il y a ${w} sem.`;
}

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function annualized(job: Job): number | undefined {
  if (job.contract === "Freelance" && job.tjm) return job.tjm * 218;
  return job.salaryMax;
}

export function formatPay(job: Job): string {
  if (job.contract === "Freelance" && job.tjm) return `${job.tjm} €/j`;
  if (job.salaryMin && job.salaryMax) return `${job.salaryMin}–${job.salaryMax} k€`;
  if (job.salaryMax) return `${job.salaryMax} k€`;
  return "—";
}

export function annualLabel(job: Job): string {
  if (job.contract === "Freelance" && job.tjm) return `${job.tjm} €/j (≈ ${Math.round((job.tjm * 218) / 1000)} k€/an)`;
  return formatPay(job);
}

export function hueOf(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on continue en mémoire */
  }
}

export function jobsToCsv(jobs: Job[]): string {
  const head = [
    "Titre",
    "Entreprise",
    "Lieu",
    "Mode",
    "Contrat",
    "Salaire",
    "Niveau",
    "Source",
    "Tags",
    "Publiée",
    "Lien",
  ];
  const rows = jobs.map((j) =>
    [
      j.title,
      j.company,
      j.location,
      j.workMode,
      j.contract,
      formatPay(j),
      j.seniority,
      j.source,
      j.tags.join(" | "),
      new Date(j.publishedAt).toISOString(),
      j.url,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  return "\uFEFF" + [head.join(";"), ...rows].join("\n");
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
