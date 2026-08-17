import type { Job } from "../types";
import { stripHtml } from "./utils";

const TIMEOUT = 6500;

async function getJSON<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location?: string;
  url?: string;
  publication_date?: string;
  tags?: string[];
  job_type?: string;
  salary?: string;
  description?: string;
}

interface ArbeitnowJob {
  slug: string;
  title: string;
  company_name: string;
  location?: string;
  remote?: boolean;
  url?: string;
  created_at?: string;
  tags?: string[];
  description?: string;
}

function parseSalaryK(s?: string): { min?: number; max?: number } {
  if (!s) return {};
  const nums = s.match(/\d+/g);
  if (!nums || nums.length === 0) return {};
  const vals = nums.slice(0, 2).map(Number).filter((n) => n > 0);
  if (vals.length === 0) return {};
  let [a, b] = [vals[0], vals[1] ?? vals[0]];
  if (a > 1000) a = Math.round(a / 1000);
  if (b > 1000) b = Math.round(b / 1000);
  if (a > 250 || b > 250) return {};
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

function searchUrl(title: string, company: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `"${title}" ${company} job`
  )}`;
}

/** API publique gratuite (CORS ouvert) — offres QA en télétravail. */
export async function fetchRemotive(): Promise<Job[]> {
  const data = await getJSON<{ jobs?: RemotiveJob[] }>(
    "https://remotive.com/api/remote-jobs?category=qa&limit=12"
  );
  const list = (data.jobs ?? []).slice(0, 10);
  return list.map((j) => {
    const pay = parseSalaryK(j.salary);
    return {
      id: `rm-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: (j.candidate_required_location ?? "Worldwide").slice(0, 42),
      workMode: "Full remote" as const,
      contract: j.job_type === "full_time" ? ("CDI" as const) : ("CDD" as const),
      salaryMin: pay.min,
      salaryMax: pay.max,
      tags: (j.tags ?? []).slice(0, 8),
      source: "remotive" as const,
      url: j.url ?? searchUrl(j.title, j.company_name),
      publishedAt: j.publication_date ? new Date(j.publication_date).getTime() : Date.now(),
      description: stripHtml(j.description ?? "").slice(0, 900) ||
        `Offre ${j.title} chez ${j.company_name}, publiée sur Remotive (full remote).`,
      seniority: "Confirmé · 5 ans et +",
      fromApi: true,
    };
  });
}

/** API publique gratuite (CORS ouvert) — marché européen, remote-friendly. */
export async function fetchArbeitnow(): Promise<Job[]> {
  const data = await getJSON<{ data?: ArbeitnowJob[] }>(
    "https://www.arbeitnow.com/api/job-board-api"
  );
  const qare = /qa|quality|test/i;
  const list = (data.data ?? [])
    .filter(
      (j) =>
        qare.test(j.title) || (j.tags ?? []).some((t) => qare.test(t)) || j.remote
    )
    .filter((j) => qare.test(j.title) || (j.tags ?? []).some((t) => qare.test(t)))
    .slice(0, 8);
  return list.map((j) => ({
    id: `an-${j.slug}`,
    title: j.title,
    company: j.company_name,
    location: (j.location ?? "Europe").slice(0, 42),
    workMode: j.remote ? ("Full remote" as const) : ("Hybride" as const),
    contract: "CDI" as const,
    tags: (j.tags ?? []).slice(0, 8),
    source: "arbeitnow" as const,
    url: j.url ?? searchUrl(j.title, j.company_name),
    publishedAt: j.created_at ? new Date(j.created_at).getTime() : Date.now(),
    description: stripHtml(j.description ?? "").slice(0, 900) ||
      `Offre ${j.title} chez ${j.company_name}, publiée sur Arbeitnow.`,
    seniority: "Confirmé · 5 ans et +",
    fromApi: true,
  }));
}
