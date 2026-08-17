import type { Contract, Job, SourceId, SourceMeta, WorkMode } from "../types";

const NOW = Date.now();
const MIN = 60_000;
const H = 3_600_000;
const D = 86_400_000;

export const SOURCES: SourceMeta[] = [
  { id: "wttj", name: "Welcome to the Jungle", kind: "demo" },
  { id: "indeed", name: "Indeed", kind: "demo" },
  { id: "francetravail", name: "France Travail", kind: "demo" },
  { id: "hellowork", name: "HelloWork", kind: "demo" },
  { id: "linkedin", name: "LinkedIn Jobs", kind: "demo" },
  { id: "remotive", name: "Remotive · remote", kind: "api" },
  { id: "arbeitnow", name: "Arbeitnow · remote", kind: "api" },
  { id: "adzuna", name: "Adzuna · France", kind: "api", needsKey: true },
];

export const CONTRACTS: Contract[] = ["CDI", "CDD", "Freelance", "Alternance"];
export const WORKMODES: WorkMode[] = ["Sur site", "Hybride", "Full remote"];

export const SENIORITIES = [
  "Tous niveaux",
  "Confirmé · 5 ans et +",
  "Senior · 8 ans et +",
  "Expert · 10 ans et +",
];

export const TAGS = [
  "Selenium",
  "Cypress",
  "Playwright",
  "Appium",
  "Postman",
  "REST API",
  "GraphQL",
  "Karate",
  "Cucumber",
  "BDD",
  "JMeter",
  "Gatling",
  "k6",
  "ISTQB",
  "TestRail",
  "Xray",
  "Squash TM",
  "CI/CD",
  "GitLab CI",
  "GitHub Actions",
  "Jenkins",
  "Docker",
  "Kubernetes",
  "Python",
  "Java",
  "TypeScript",
  "SQL",
  "AWS",
  "Kafka",
  "Leadership",
];

export const LOCATION_FILTERS = [
  { id: "paris", label: "Paris" },
  { id: "couronne", label: "Petite couronne" },
  { id: "remote", label: "Full remote" },
];

export function locationMatches(loc: string, id: string): boolean {
  const l = loc.toLowerCase();
  if (id === "paris") return l.includes("paris");
  if (id === "couronne")
    return [
      "boulogne",
      "nanterre",
      "saint-denis",
      "défense",
      "defense",
      "issy",
      "levallois",
      "montreuil",
      "île-de-france",
      "ile-de-france",
    ].some((k) => l.includes(k));
  return l.includes("remote");
}

export const PROFILE = {
  name: "Ingénieur QA · Testeur logiciel",
  years: 12,
  city: "Paris & IDF",
  cv: "github.com/votre-cv",
  skills: [
    "Selenium",
    "Cypress",
    "Playwright",
    "API",
    "Postman",
    "CI/CD",
    "ISTQB",
    "Cucumber",
    "BDD",
    "JMeter",
    "Java",
    "TypeScript",
    "Python",
    "Docker",
    "SQL",
    "TestRail",
    "Appium",
    "Leadership",
  ],
};

export function matchScore(job: Job): number {
  const hay = `${job.title} ${job.tags.join(" ")} ${job.description}`.toLowerCase();
  let hits = 0;
  for (const s of PROFILE.skills) if (hay.includes(s.toLowerCase())) hits++;
  const titleBonus = /(lead|manager|senior|expert|principal)/i.test(job.title) ? 8 : 0;
  return Math.min(99, 36 + hits * 5 + titleBonus);
}

function desc(company: string, title: string, tags: string[]): string {
  const t = tags.slice(0, 3).join(", ") || "tests API et E2E";
  return `${company} renforce son pôle Qualité Logicielle et recrute un(e) ${title}. Rattaché(e) à la direction de l'ingénierie, vous définissez la stratégie de test du périmètre, automatisez les parcours critiques (${t}) et sécurisez les mises en production continues. Vous accompagnez les développeurs sur la qualité embarquée (shift-left), outillez les pipelines CI/CD et portez la voix du test lors des arbitrages produit. Environnement technique exigeant, forte culture de l'observabilité, revues de tests systématiques et budget formation/veille dédié.`;
}

/** URL de recherche native par source : le bouton « Postuler sur la source »
 *  doit renvoyer vers le job board concerné, pas vers Google. */
function searchUrl(src: SourceId, title: string, company: string): string {
  const q = encodeURIComponent(`${title} ${company}`);
  switch (src) {
    case "wttj":
      return `https://www.welcometothejungle.com/fr/jobs?query=${q}`;
    case "indeed":
      return `https://fr.indeed.com/jobs?q=${q}`;
    case "francetravail":
      return `https://candidat.francetravail.fr/offres/recherche?motsCles=${q}`;
    case "hellowork":
      return `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${q}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(
        `"${title}" ${company} offre emploi`
      )}`;
  }
}

interface MkOpts {
  off: number;
  loc?: string;
  wm?: WorkMode;
  ct?: Contract;
  sMin?: number;
  sMax?: number;
  tjm?: number;
  tags?: string[];
  src?: SourceId;
  sen?: string;
}

let seq = 0;
function mk(title: string, company: string, o: MkOpts): Job {
  seq += 1;
  return {
    id: `seed-${seq}`,
    title,
    company,
    location: o.loc ?? "Paris",
    workMode: o.wm ?? "Hybride",
    contract: o.ct ?? "CDI",
    salaryMin: o.sMin,
    salaryMax: o.sMax,
    tjm: o.tjm,
    tags: o.tags ?? [],
    source: o.src ?? "wttj",
    url: searchUrl(o.src ?? "wttj", title, company),
    publishedAt: NOW - o.off,
    description: desc(company, title, o.tags ?? []),
    seniority: o.sen ?? "Senior · 8 ans et +",
  };
}

export const SEED_JOBS: Job[] = [
  mk("QA Engineer Senior", "Doctolib", { off: 18 * MIN, sMin: 60, sMax: 68, tags: ["Cypress", "Playwright", "CI/CD", "REST API", "TypeScript", "TestRail"], src: "wttj" }),
  mk("Lead QA Engineer", "Qonto", { off: 38 * MIN, sMin: 65, sMax: 75, tags: ["Playwright", "REST API", "CI/CD", "Leadership", "TypeScript"], src: "linkedin" }),
  mk("Ingénieur Test & Automatisation Senior", "Datadog", { off: 52 * MIN, sMin: 68, sMax: 80, tags: ["Selenium", "Python", "CI/CD", "AWS", "k6"], src: "indeed", sen: "Expert · 10 ans et +" }),
  mk("QA Automation Engineer", "Back Market", { off: 3 * H, sMin: 55, sMax: 62, tags: ["Cypress", "TypeScript", "GraphQL", "Docker"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
  mk("Testeur Logiciel Senior", "Fnac Darty", { off: 4 * H, loc: "Île-de-France", sMin: 52, sMax: 58, tags: ["Selenium", "Java", "Squash TM", "ISTQB"], src: "francetravail" }),
  mk("QA Manager", "Contentsquare", { off: 5 * H, sMin: 70, sMax: 82, tags: ["Leadership", "Cypress", "CI/CD", "ISTQB", "TestRail"], src: "linkedin", sen: "Expert · 10 ans et +" }),
  mk("Ingénieur QA Performance", "SFR", { off: 6 * H, loc: "Saint-Denis", wm: "Sur site", sMin: 55, sMax: 62, tags: ["JMeter", "Gatling", "k6", "SQL"], src: "indeed" }),
  mk("Senior SDET", "Criteo", { off: 8 * H, sMin: 65, sMax: 74, tags: ["Java", "Selenium", "Kubernetes", "CI/CD", "Kafka"], src: "wttj", sen: "Expert · 10 ans et +" }),
  mk("QA Engineer", "Alan", { off: 9 * H, loc: "Full remote", wm: "Full remote", sMin: 55, sMax: 65, tags: ["Playwright", "REST API", "TypeScript", "CI/CD"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
  mk("Freelance QA Senior — 6 mois", "Société Générale", { off: 10 * H, loc: "La Défense", wm: "Sur site", ct: "Freelance", tjm: 600, tags: ["Selenium", "ISTQB", "SQL", "TestRail"], src: "hellowork" }),
  mk("Ingénieur Assurance Qualité", "Ubisoft", { off: 12 * H, sMin: 50, sMax: 58, tags: ["Python", "Selenium", "CI/CD", "Karate"], src: "indeed", sen: "Confirmé · 5 ans et +" }),
  mk("QA Lead Paiements", "Mirakl", { off: 14 * H, sMin: 68, sMax: 78, tags: ["REST API", "Postman", "Playwright", "Leadership"], src: "linkedin", sen: "Expert · 10 ans et +" }),
  mk("Testeur Fonctionnel Senior", "Assurance Maladie (CNAM)", { off: 16 * H, wm: "Sur site", sMin: 48, sMax: 54, tags: ["Squash TM", "ISTQB", "SQL", "Cucumber"], src: "francetravail" }),
  mk("QA Engineer Mobile Senior", "Deezer", { off: 18 * H, sMin: 55, sMax: 63, tags: ["Appium", "CI/CD", "TypeScript", "REST API"], src: "wttj" }),
  mk("QA Engineer Senior", "Veepee", { off: 20 * H, sMin: 58, sMax: 64, tags: ["Cypress", "GraphQL", "Docker", "GitLab CI"], src: "indeed" }),
  mk("QA Engineer Senior", "ManoMano", { off: 22 * H, sMin: 55, sMax: 62, tags: ["Playwright", "Python", "AWS", "k6"], src: "wttj" }),
  mk("Ingénieur Tests & Qualité", "BNP Paribas", { off: 26 * H, sMin: 58, sMax: 66, tags: ["Java", "Selenium", "Cucumber", "BDD"], src: "linkedin" }),
  mk("QA Automation Senior", "BlaBlaCar", { off: 28 * H, sMin: 58, sMax: 66, tags: ["Cypress", "TypeScript", "REST API", "GitHub Actions"], src: "wttj" }),
  mk("Freelance Test Manager", "SNCF Connect", { off: 30 * H, loc: "Saint-Denis", ct: "Freelance", tjm: 560, tags: ["ISTQB", "Squash TM", "Leadership", "Xray"], src: "hellowork", sen: "Expert · 10 ans et +" }),
  mk("QA Engineer", "PayFit", { off: 32 * H, sMin: 50, sMax: 57, tags: ["Cypress", "TypeScript", "SQL", "Postman"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
  mk("Ingénieur QA Senior", "Thales", { off: 34 * H, loc: "Île-de-France", sMin: 55, sMax: 65, tags: ["Python", "Selenium", "ISTQB", "Docker"], src: "indeed" }),
  mk("QA Lead", "Swile", { off: 36 * H, sMin: 62, sMax: 70, tags: ["Playwright", "Leadership", "CI/CD", "GraphQL"], src: "linkedin" }),
  mk("Senior QA Engineer", "Ledger", { off: 40 * H, sMin: 60, sMax: 70, tags: ["Python", "REST API", "CI/CD", "Kubernetes"], src: "wttj", sen: "Expert · 10 ans et +" }),
  mk("Testeur QA Senior", "leboncoin", { off: 44 * H, sMin: 52, sMax: 59, tags: ["Selenium", "Appium", "TestRail", "SQL"], src: "indeed" }),
  mk("QA Engineer Confirmé", "SeLoger (Axel Springer)", { off: 2 * D, sMin: 48, sMax: 55, tags: ["Cypress", "Postman", "Cucumber"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
  mk("Ingénieur QA", "Dassault Systèmes", { off: 2 * D + 3 * H, loc: "Île-de-France", wm: "Sur site", sMin: 50, sMax: 58, tags: ["Java", "Selenium", "ISTQB"], src: "francetravail" }),
  mk("QA Performance Engineer", "OVHcloud", { off: 2 * D + 6 * H, loc: "Full remote", wm: "Full remote", sMin: 52, sMax: 60, tags: ["Gatling", "k6", "Python", "JMeter"], src: "hellowork" }),
  mk("Senior QA Engineer", "Accor Tech", { off: 2 * D + 9 * H, sMin: 55, sMax: 63, tags: ["Playwright", "REST API", "AWS", "Docker"], src: "linkedin" }),
  mk("QA Engineer", "Canal+ Tech", { off: 3 * D, sMin: 50, sMax: 58, tags: ["Cypress", "Appium", "CI/CD"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
  mk("Lead QA Engineer", "Vestiaire Collective", { off: 3 * D + 4 * H, sMin: 65, sMax: 72, tags: ["Playwright", "Leadership", "TypeScript", "CI/CD"], src: "linkedin", sen: "Expert · 10 ans et +" }),
  mk("Freelance QA Automation", "Renault Digital", { off: 3 * D + 7 * H, loc: "Boulogne-Billancourt", ct: "Freelance", tjm: 580, tags: ["Selenium", "Python", "CI/CD"], src: "hellowork" }),
  mk("Ingénieur QA Senior", "TotalEnergies", { off: 3 * D + 10 * H, loc: "La Défense", sMin: 58, sMax: 68, tags: ["Java", "Selenium", "SQL", "ISTQB"], src: "indeed" }),
  mk("QA Engineer", "TF1 Pub", { off: 4 * D, sMin: 48, sMax: 55, tags: ["Cypress", "Postman", "Xray"], src: "francetravail", sen: "Confirmé · 5 ans et +" }),
  mk("Alternance QA Engineer", "Orange", { off: 4 * D + 5 * H, ct: "Alternance", tags: ["Selenium", "ISTQB", "Java"], src: "francetravail", sen: "Tous niveaux" }),
];

let pseq = 0;
function pool(title: string, company: string, o: Omit<MkOpts, "off"> & { off: number }): Job {
  const j = mk(title, company, o);
  pseq += 1;
  return { ...j, id: `pool-${pseq}` };
}

/** Offres injectées progressivement par les scans automatiques (effet "temps réel"). */
export const RESERVE_POOL: Job[] = [
  pool("Senior QA Engineer", "Wavestone", { off: 12 * MIN, sMin: 60, sMax: 70, tags: ["Playwright", "CI/CD", "Leadership"], src: "linkedin" }),
  pool("QA Engineer Senior", "Iliad (Free)", { off: 20 * MIN, sMin: 55, sMax: 62, tags: ["Python", "REST API", "Jenkins"], src: "indeed" }),
  pool("Ingénieur QA — équipe Plateforme", "Doctolib", { off: 25 * MIN, sMin: 58, sMax: 66, tags: ["Cypress", "TypeScript", "CI/CD"], src: "wttj" }),
  pool("Freelance QA Lead — 12 mois", "LVMH Tech", { off: 30 * MIN, ct: "Freelance", tjm: 650, tags: ["Leadership", "ISTQB", "Xray", "Squash TM"], src: "hellowork", sen: "Expert · 10 ans et +" }),
  pool("QA Engineer", "Malt", { off: 35 * MIN, loc: "Full remote", wm: "Full remote", sMin: 52, sMax: 60, tags: ["Playwright", "GraphQL", "GitHub Actions"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
  pool("SDET Senior", "Aircall", { off: 40 * MIN, sMin: 62, sMax: 72, tags: ["Java", "Selenium", "Kafka", "AWS"], src: "linkedin", sen: "Expert · 10 ans et +" }),
  pool("QA Manager", "Shift Technology", { off: 45 * MIN, sMin: 68, sMax: 78, tags: ["Leadership", "Python", "CI/CD", "ISTQB"], src: "linkedin", sen: "Expert · 10 ans et +" }),
  pool("Ingénieur Tests & Qualification", "EDF Pulse", { off: 50 * MIN, loc: "Île-de-France", sMin: 50, sMax: 58, tags: ["Squash TM", "ISTQB", "SQL"], src: "francetravail" }),
  pool("Senior QA Engineer", "Sorare", { off: 55 * MIN, sMin: 60, sMax: 68, tags: ["Playwright", "TypeScript", "k6", "Docker"], src: "wttj" }),
  pool("QA Engineer", "Qwant", { off: 60 * MIN, loc: "Full remote", wm: "Full remote", sMin: 48, sMax: 56, tags: ["Selenium", "Python", "GitLab CI"], src: "hellowork", sen: "Confirmé · 5 ans et +" }),
  pool("Testeur Senior — domaine Paiement", "La Poste Digital", { off: 65 * MIN, sMin: 50, sMax: 57, tags: ["TestRail", "SQL", "Cucumber", "BDD"], src: "francetravail" }),
  pool("QA Lead Data", "Dataiku", { off: 70 * MIN, sMin: 66, sMax: 76, tags: ["Python", "REST API", "CI/CD", "Leadership"], src: "linkedin", sen: "Expert · 10 ans et +" }),
  pool("Consultant QA Senior", "Capgemini", { off: 75 * MIN, sMin: 55, sMax: 64, tags: ["Java", "Selenium", "ISTQB", "Jenkins"], src: "indeed" }),
  pool("QA Engineer Mobile", "Back Market", { off: 80 * MIN, sMin: 54, sMax: 61, tags: ["Appium", "TypeScript", "GitHub Actions"], src: "wttj", sen: "Confirmé · 5 ans et +" }),
];
