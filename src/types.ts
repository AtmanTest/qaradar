export type Contract = "CDI" | "CDD" | "Freelance" | "Alternance";
export type WorkMode = "Sur site" | "Hybride" | "Full remote";
export type SourceId =
  | "wttj"
  | "indeed"
  | "francetravail"
  | "hellowork"
  | "linkedin"
  | "remotive"
  | "arbeitnow";

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
export type TabId = "all" | "new" | "saved";

export interface Prefs {
  autoOn: boolean;
  intervalSec: number;
  notifOn: boolean;
  dense: boolean;
  sort: SortId;
}

export interface ToastMsg {
  id: number;
  kind: "success" | "info" | "alert";
  text: string;
}
