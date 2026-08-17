export type Contract = "CDI" | "CDD" | "Freelance" | "Alternance";
export type WorkMode = "Sur site" | "Hybride" | "Full remote";
export type SourceId =
  | "wttj"
  | "indeed"
  | "francetravail"
  | "hellowork"
  | "linkedin"
  | "remotive"
  | "arbeitnow"
  | "adzuna";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  contract: Contract;
  salaryMin?: number;
  salaryMax?: number;
  tjm?: number;
  tags: string[];
  source: SourceId;
  url: string;
  publishedAt: number;
  description: string;
  seniority: string;
  fromApi?: boolean;
}

export interface SourceMeta {
  id: SourceId;
  name: string;
  kind: "demo" | "api";
  /** La source exige une clé API saisie par l'utilisateur. */
  needsKey?: boolean;
}

export type SourceStatus = "online" | "scanning" | "offline" | "pending";

export interface Filters {
  query: string;
  locations: string[];
  contracts: Contract[];
  workModes: WorkMode[];
  tags: string[];
  minSalary: number;
  seniority: string;
  sources: SourceId[];
}

export type SortId = "recent" | "salary_desc" | "salary_asc" | "match";
export type TabId = "all" | "new" | "saved" | "applications";

export type ThemeId = "dark" | "light";

export interface Prefs {
  autoOn: boolean;
  intervalSec: number;
  notifOn: boolean;
  dense: boolean;
  sort: SortId;
  theme: ThemeId;
}

/** Suivi de candidature : statuts du pipeline (roadmap). */
export type ApplicationStatus = "postule" | "entretien" | "refus";

export interface Application {
  jobId: string;
  status: ApplicationStatus;
  /** Date de dernière mise à jour du statut (ms). */
  updatedAt: number;
  note?: string;
}

/** Clés API saisies par l'utilisateur (stockées localement). */
export interface ApiKeys {
  adzunaAppId: string;
  adzunaAppKey: string;
}

export interface ToastMsg {
  id: number;
  kind: "success" | "info" | "alert";
  text: string;
}
