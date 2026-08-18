import type { Job } from "../types";
import { stripHtml } from "./utils";
import { searchUrl } from "./searchUrl";

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

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  redirect_url?: string;
  created?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  category?: { label?: string };
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

export function parseSalaryK(s?: string): { min?: number; max?: number } {
  if (!s) return {};
  // neutralise les séparateurs de milliers (« 60 000 », « 60,000 », « 60 000 »)
  const norm = s.replace(/(\d)[\s\u00a0\u202f,](?=\d{3}(\D|$))/g, "$1");
  const nums = norm.match(/\d+/g);
  if (!nums || nums.length === 0) return {};
  const vals = nums.slice(0, 2).map(Number).filter((n) => n > 0);
  if (vals.length === 0) return {};
  let [a, b] = [vals[0], vals[1] ?? vals[0]];
  if (a > 1000) a = Math.round(a / 1000);
  if (b > 1000) b = Math.round(b / 1000);
  if (a > 250 || b > 250) return {};
  return { min: Math.min(a, b), max: Math.max(a, b) };
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
      url: j.url ?? searchUrl("remotive", j.title, j.company_name),
      publishedAt: j.publication_date ? new Date(j.publication_date).getTime() : Date.now(),
      description: stripHtml(j.description ?? "").slice(0, 900) ||
        `Offre ${j.title} chez ${j.company_name}, publiée sur Remotive (full remote).`,
      seniority: "Confirmé · 5 ans et +",
      fromApi: true,
    };
  });
}

/**
 * API Adzuna (clé développeur gratuite sur developer.adzuna.com).
 * Interrogée en direct depuis le navigateur — les identifiants sont fournis
 * par l'utilisateur et ne quittent jamais son navigateur.
 */
export async function fetchAdzuna(appId: string, appKey: string): Promise<Job[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "12",
    what: "QA engineer testeur logiciel",
    where: "Paris",
    sort_by: "date",
    "content-type": "application/json",
  });
  const data = await getJSON<{ results?: AdzunaJob[] }>(
    `https://api.adzuna.com/v1/api/jobs/fr/search/1?${params.toString()}`
  );
  return (data.results ?? []).slice(0, 12).map((j) => {
    const title = stripHtml(j.title ?? "");
    const company = j.company?.display_name ?? "Entreprise confidentielle";
    const desc = stripHtml(j.description ?? "");
    const tags = Array.from(
      new Set(
        [j.category?.label, j.contract_time, j.contract_type]
          .filter((t): t is string => Boolean(t))
          .map((t) => t.replace(/_/g, " "))
      )
    );
    const minK = j.salary_min ? Math.round(j.salary_min / 1000) : undefined;
    const maxK = j.salary_max ? Math.round(j.salary_max / 1000) : undefined;
    return {
      id: `az-${j.id}`,
      title,
      company,
      location: (j.location?.display_name ?? "Paris").slice(0, 42),
      workMode: /remote|télétravail|teletravail/i.test(`${title} ${desc}`)
        ? ("Full remote" as const)
        : ("Hybride" as const),
      contract: j.contract_type === "contract" ? ("CDD" as const) : ("CDI" as const),
      salaryMin: minK && minK > 10 && minK < 250 ? minK : undefined,
      salaryMax: maxK && maxK > 10 && maxK < 250 ? maxK : undefined,
      tags,
      source: "adzuna" as const,
      url: j.redirect_url ?? searchUrl("adzuna", title, company),
      publishedAt: j.created ? new Date(j.created).getTime() : Date.now(),
      description: desc.slice(0, 900) || `Offre ${title} chez ${company}, publiée sur Adzuna.`,
      seniority: /senior|lead|expert|principal/i.test(title)
        ? "Senior · 8 ans et +"
        : "Confirmé · 5 ans et +",
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
    url: j.url ?? searchUrl("arbeitnow", j.title, j.company_name),
    publishedAt: j.created_at ? new Date(j.created_at).getTime() : Date.now(),
    description: stripHtml(j.description ?? "").slice(0, 900) ||
      `Offre ${j.title} chez ${j.company_name}, publiée sur Arbeitnow.`,
    seniority: "Confirmé · 5 ans et +",
    fromApi: true,
  }));
}
