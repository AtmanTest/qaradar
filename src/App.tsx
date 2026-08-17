import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ApiKeys,
  Application,
  ApplicationStatus,
  Filters as FiltersState,
  Job,
  Prefs,
  SortId,
  SourceId,
  SourceStatus,
  TabId,
  ToastMsg,
} from "./types";
import { locationMatches, matchScore, RESERVE_POOL, SEED_JOBS, SOURCES } from "./data/jobs";
import { fetchAdzuna, fetchArbeitnow, fetchRemotive } from "./lib/api";
import {
  annualized,
  clockTime,
  delay,
  download,
  jobsToCsv,
  jobsToRss,
  loadJSON,
  saveJSON,
} from "./lib/utils";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import Filters from "./components/Filters";
import JobCard from "./components/JobCard";
import JobDrawer from "./components/JobDrawer";
import Applications from "./components/Applications";
import Toasts from "./components/Toasts";
import { IconCheck, IconInbox, IconLayers, IconRefresh } from "./components/icons";

const LS = {
  jobs: "radarqa:jobs",
  known: "radarqa:known",
  saved: "radarqa:saved",
  hidden: "radarqa:hidden",
  filters: "radarqa:filters",
  alerts: "radarqa:alerts",
  prefs: "radarqa:prefs",
  applications: "radarqa:applications",
  apiKeys: "radarqa:apikeys",
};

const ALL_SOURCES = SOURCES.map((s) => s.id);

const DEFAULT_FILTERS: FiltersState = {
  query: "",
  locations: [],
  contracts: [],
  workModes: [],
  tags: [],
  minSalary: 0,
  seniority: "Tous niveaux",
  sources: ALL_SOURCES,
};

const DEFAULT_PREFS: Prefs = {
  autoOn: true,
  intervalSec: 120,
  notifOn: false,
  dense: false,
  sort: "recent",
  theme: "dark",
};

const DEFAULT_KEYS: ApiKeys = { adzunaAppId: "", adzunaAppKey: "" };

const INITIAL_STATUS = Object.fromEntries(
  SOURCES.map((s) => [s.id, s.kind === "api" ? "pending" : "scanning"])
) as Record<SourceId, SourceStatus>;

function initialJobs(): Job[] {
  const stored = loadJSON<Job[] | null>(LS.jobs, null);
  return stored && stored.length > 0 ? stored : SEED_JOBS;
}

function initialKnown(): string[] {
  const stored = loadJSON<string[] | null>(LS.known, null);
  if (stored) return stored;
  return SEED_JOBS.filter((j) => Date.now() - j.publishedAt > 45 * 60_000).map((j) => j.id);
}

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "new", label: "Nouvelles" },
  { id: "saved", label: "Sauvegardées" },
  { id: "applications", label: "Candidatures" },
];

/** Événement PWA `beforeinstallprompt` (absent des types DOM standard). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [knownIds, setKnownIds] = useState<string[]>(initialKnown);
  const [savedIds, setSavedIds] = useState<string[]>(() => loadJSON(LS.saved, [] as string[]));
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => loadJSON(LS.hidden, [] as string[]));
  const [readIds, setReadIds] = useState<string[]>([]);
  const [newIds, setNewIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FiltersState>(() => ({
    ...DEFAULT_FILTERS,
    ...loadJSON<Partial<FiltersState>>(LS.filters, {}),
  }));
  const [alerts, setAlerts] = useState<string[]>(() =>
    loadJSON(LS.alerts, ["Lead", "Playwright"])
  );
  const [prefs, setPrefs] = useState<Prefs>(() => ({
    ...DEFAULT_PREFS,
    ...loadJSON<Partial<Prefs>>(LS.prefs, {}),
  }));
  const [applications, setApplications] = useState<Record<string, Application>>(() =>
    loadJSON(LS.applications, {} as Record<string, Application>)
  );
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => ({
    ...DEFAULT_KEYS,
    ...loadJSON<Partial<ApiKeys>>(LS.apiKeys, {}),
  }));
  const [tab, setTab] = useState<TabId>("all");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<number | null>(null);
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(DEFAULT_PREFS.intervalSec * 1000);
  const [scans, setScans] = useState(0);
  const [status, setStatus] = useState<Record<SourceId, SourceStatus>>(INITIAL_STATUS);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  const scanningRef = useRef(false);
  const bootedRef = useRef(false);
  const roundRef = useRef(0);
  const poolRef = useRef(0);
  const toastSeq = useRef(0);
  const knownRef = useRef(knownIds);
  const hiddenRef = useRef(hiddenIds);
  const prefsRef = useRef(prefs);
  const jobsRef = useRef(jobs);
  const keysRef = useRef(apiKeys);

  useEffect(() => { knownRef.current = knownIds; }, [knownIds]);
  useEffect(() => { hiddenRef.current = hiddenIds; }, [hiddenIds]);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => { keysRef.current = apiKeys; }, [apiKeys]);

  // thème sombre / clair
  useEffect(() => {
    document.documentElement.classList.toggle("light", prefs.theme === "light");
  }, [prefs.theme]);

  // installation PWA : capture de l'événement différé
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const pushToast = useCallback((kind: ToastMsg["kind"], text: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);

  const notifyBrowser = useCallback((fresh: Job[]) => {
    if (!prefsRef.current.notifOn) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      new Notification("Radar QA — nouvelles offres", {
        body: `${fresh.length} nouveauté${fresh.length > 1 ? "s" : ""} : ${fresh
          .slice(0, 2)
          .map((j) => j.title)
          .join(" · ")}${fresh.length > 2 ? "…" : ""}`,
      });
    } catch {
      /* certains navigateurs exigent un service worker */
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* Moteur de scan : flux nationaux simulés + APIs live                  */
  /* ------------------------------------------------------------------ */
  const runScan = useCallback(
    async (initial = false) => {
      if (scanningRef.current) return;
      scanningRef.current = true;
      setScanning(true);
      const round = ++roundRef.current;
      setStatus((s) => ({
        ...s,
        wttj: "scanning",
        indeed: "scanning",
        francetravail: "scanning",
        hellowork: "scanning",
        linkedin: "scanning",
      }));

      await delay(initial ? 1200 : 750 + Math.random() * 650);

      // 1) arrivages du flux national (effet temps réel entre deux scans)
      const injected: Job[] = [];
      const take = initial ? 0 : Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < take; i++) {
        const base = RESERVE_POOL[poolRef.current % RESERVE_POOL.length];
        poolRef.current += 1;
        injected.push({
          ...base,
          id: `${base.id}-r${round}-${i}`,
          publishedAt: Date.now() - Math.floor((1 + Math.random() * 30) * 60_000),
        });
      }

      // 2) APIs publiques interrogées en direct depuis le navigateur
      const keys = keysRef.current;
      const adzunaReady = Boolean(keys.adzunaAppId && keys.adzunaAppKey);
      const calls: [SourceId, Promise<Job[]>][] = [
        ["remotive", fetchRemotive()],
        ["arbeitnow", fetchArbeitnow()],
      ];
      if (adzunaReady) calls.push(["adzuna", fetchAdzuna(keys.adzunaAppId, keys.adzunaAppKey)]);
      const settled = await Promise.allSettled(calls.map(([, p]) => p));
      const apiJobs: Job[] = [];
      const apiStatus: Partial<Record<SourceId, SourceStatus>> = {};
      calls.forEach(([id], i) => {
        const r = settled[i];
        if (r.status === "fulfilled") {
          apiJobs.push(...r.value);
          apiStatus[id] = "online";
        } else {
          apiStatus[id] = "offline";
        }
      });
      if (!adzunaReady) apiStatus.adzuna = "pending";

      setStatus((s) => ({
        ...s,
        wttj: "online",
        indeed: "online",
        francetravail: "online",
        hellowork: "online",
        linkedin: "online",
        ...apiStatus,
      }));

      const known = new Set(knownRef.current);
      const hiddenSet = new Set(hiddenRef.current);
      const seen = new Set<string>();
      const fresh = [...injected, ...apiJobs].filter((j) => {
        if (known.has(j.id) || hiddenSet.has(j.id) || seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      });

      if (fresh.length > 0) {
        setJobs((prev) => [...fresh, ...prev].slice(0, 240));
        setKnownIds((prev) => {
          const all = [...fresh.map((f) => f.id), ...prev];
          knownRef.current = all;
          return all.slice(0, 900);
        });
        if (!initial) {
          setNewIds((prev) => [...fresh.map((f) => f.id), ...prev].slice(0, 400));
          pushToast(
            "success",
            `${fresh.length} nouvelle${fresh.length > 1 ? "s" : ""} offre${
              fresh.length > 1 ? "s" : ""
            } détectée${fresh.length > 1 ? "s" : ""} — scan #${round}`
          );
          notifyBrowser(fresh);
        }
      }

      if (initial) {
        const recentSeed = SEED_JOBS.filter(
          (j) => Date.now() - j.publishedAt <= 45 * 60_000
        ).map((j) => j.id);
        setNewIds(recentSeed.filter((id) => !hiddenRef.current.includes(id)));
        pushToast(
          "info",
          `Veille initialisée — ${jobsRef.current.length + fresh.length} offres rapatriées, ${recentSeed.length} nouveauté${recentSeed.length > 1 ? "s" : ""}`
        );
      }

      setLastScan(Date.now());
      setScans(round);
      setScanning(false);
      scanningRef.current = false;
      if (prefsRef.current.autoOn) {
        setNextAt(Date.now() + prefsRef.current.intervalSec * 1000);
      }
    },
    [pushToast, notifyBrowser]
  );

  // premier scan au montage
  useEffect(() => {
    if (!bootedRef.current) {
      bootedRef.current = true;
      void runScan(true);
    }
  }, [runScan]);

  // planification du scan automatique
  useEffect(() => {
    if (!prefs.autoOn || nextAt === null) return;
    const wait = Math.max(400, nextAt - Date.now());
    const t = setTimeout(() => {
      void runScan(false);
    }, wait);
    return () => clearTimeout(t);
  }, [prefs.autoOn, nextAt, runScan]);

  // compte à rebours affiché
  useEffect(() => {
    const id = setInterval(
      () => setRemaining(nextAt ? Math.max(0, nextAt - Date.now()) : 0),
      250
    );
    return () => clearInterval(id);
  }, [nextAt]);

  // persistance
  useEffect(() => { saveJSON(LS.jobs, jobs.slice(0, 160)); }, [jobs]);
  useEffect(() => { saveJSON(LS.known, knownIds); }, [knownIds]);
  useEffect(() => { saveJSON(LS.saved, savedIds); }, [savedIds]);
  useEffect(() => { saveJSON(LS.hidden, hiddenIds); }, [hiddenIds]);
  useEffect(() => { saveJSON(LS.filters, filters); }, [filters]);
  useEffect(() => { saveJSON(LS.alerts, alerts); }, [alerts]);
  useEffect(() => { saveJSON(LS.prefs, prefs); }, [prefs]);
  useEffect(() => { saveJSON(LS.applications, applications); }, [applications]);
  useEffect(() => { saveJSON(LS.apiKeys, apiKeys); }, [apiKeys]);

  // raccourcis clavier
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea" && tag !== "select") {
        e.preventDefault();
        document.getElementById("job-search")?.focus();
      }
      if (e.key === "Escape") setOpenJob(null);
      if (e.key >= "1" && e.key <= "4" && tag !== "input" && tag !== "textarea" && tag !== "select") {
        const t = TABS[Number(e.key) - 1];
        if (t) setTab(t.id);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ----------------------------- dérivés ----------------------------- */

  const activeJobs = useMemo(
    () => jobs.filter((j) => !hiddenIds.includes(j.id)),
    [jobs, hiddenIds]
  );

  const jobsById = useMemo(() => {
    const m = new Map<string, Job>();
    for (const j of jobs) m.set(j.id, j);
    return m;
  }, [jobs]);

  const matchMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) m.set(j.id, matchScore(j));
    return m;
  }, [jobs]);

  const sourceCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const j of activeJobs) c[j.source] = (c[j.source] ?? 0) + 1;
    return c;
  }, [activeJobs]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = activeJobs.filter((j) => {
      if (!filters.sources.includes(j.source)) return false;
      if (filters.contracts.length > 0 && !filters.contracts.includes(j.contract)) return false;
      if (filters.workModes.length > 0 && !filters.workModes.includes(j.workMode)) return false;
      if (
        filters.locations.length > 0 &&
        !filters.locations.some((l) => locationMatches(j.location, l))
      )
        return false;
      if (filters.tags.length > 0 && !filters.tags.some((t) => j.tags.includes(t))) return false;
      if (filters.seniority !== "Tous niveaux" && j.seniority !== filters.seniority) return false;
      if (filters.minSalary > 0) {
        const pay = annualized(j);
        if (pay == null || pay < filters.minSalary) return false;
      }
      if (q) {
        const hay = `${j.title} ${j.company} ${j.location} ${j.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const pay = (j: Job) => annualized(j) ?? -1;
    switch (prefs.sort) {
      case "salary_desc":
        list.sort((a, b) => pay(b) - pay(a));
        break;
      case "salary_asc":
        list.sort((a, b) => pay(a) - pay(b));
        break;
      case "match":
        list.sort((a, b) => (matchMap.get(b.id) ?? 0) - (matchMap.get(a.id) ?? 0));
        break;
      default:
        list.sort((a, b) => b.publishedAt - a.publishedAt);
    }
    return list;
  }, [activeJobs, filters, prefs.sort, matchMap]);

  const newInFiltered = useMemo(
    () => filtered.filter((j) => newIds.includes(j.id)),
    [filtered, newIds]
  );
  const savedInFiltered = useMemo(
    () => filtered.filter((j) => savedIds.includes(j.id)),
    [filtered, savedIds]
  );
  const applicationCount = useMemo(
    () => Object.values(applications).filter((a) => jobsById.has(a.jobId)).length,
    [applications, jobsById]
  );

  const tabVisible = tab === "new" ? newInFiltered : tab === "saved" ? savedInFiltered : filtered;

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 86_400_000;
    return {
      total: activeJobs.length,
      new24: activeJobs.filter((j) => j.publishedAt > dayAgo).length,
      highMatch: activeJobs.filter((j) => (matchMap.get(j.id) ?? 0) >= 80).length,
      online: SOURCES.filter((s) => status[s.id] === "online").length,
    };
    // lastScan/scans : recalcule les compteurs temporels après chaque scan
  }, [activeJobs, matchMap, status, lastScan, scans]);

  const activeIdSet = useMemo(() => new Set(activeJobs.map((j) => j.id)), [activeJobs]);
  const bellCount = useMemo(
    () => newIds.filter((id) => activeIdSet.has(id)).length,
    [newIds, activeIdSet]
  );

  const isAlert = useCallback(
    (j: Job) =>
      alerts.length > 0 &&
      alerts.some((w) =>
        `${j.title} ${j.company} ${j.tags.join(" ")}`.toLowerCase().includes(w.toLowerCase())
      ),
    [alerts]
  );

  /* ---------------------------- handlers ----------------------------- */

  const toggleAuto = () => {
    const next = !prefsRef.current.autoOn;
    setPrefs((p) => ({ ...p, autoOn: next }));
    if (next) {
      setNextAt(Date.now() + prefsRef.current.intervalSec * 1000);
      pushToast("info", "Scan automatique réactivé");
    } else {
      setNextAt(null);
      pushToast("info", "Scan automatique en pause");
    }
  };

  const changeInterval = (sec: number) => {
    setPrefs((p) => ({ ...p, intervalSec: sec }));
    if (prefsRef.current.autoOn) setNextAt(Date.now() + sec * 1000);
  };

  const toggleNotif = () => {
    const next = !prefsRef.current.notifOn;
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        const prm = Notification.requestPermission();
        if (prm && typeof prm.then === "function") {
          void prm.then((p) => {
            if (p !== "granted") pushToast("alert", "Notifications refusées par le navigateur");
            else pushToast("success", "Notifications navigateur autorisées");
          });
        }
      } catch {
        /* API indisponible */
      }
    }
    setPrefs((p) => ({ ...p, notifOn: next }));
  };

  const toggleTheme = () => {
    const next = prefsRef.current.theme === "dark" ? "light" : "dark";
    setPrefs((p) => ({ ...p, theme: next }));
    pushToast("info", next === "light" ? "Thème clair activé" : "Thème sombre activé");
  };

  const installApp = () => {
    if (!installEvt) return;
    void installEvt.prompt().then(() => setInstallEvt(null));
  };

  const openOffer = (j: Job) => {
    setOpenJob(j);
    setReadIds((prev) => (prev.includes(j.id) ? prev : [...prev, j.id]));
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const hideJob = (id: string) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (openJob?.id === id) setOpenJob(null);
    pushToast("info", "Offre masquée du flux");
  };

  /* ---------- suivi des candidatures ---------- */

  const markApplied = (jobId: string) => {
    setApplications((prev) =>
      prev[jobId]
        ? prev
        : { ...prev, [jobId]: { jobId, status: "postule", updatedAt: Date.now() } }
    );
    if (!savedIds.includes(jobId)) setSavedIds((prev) => [...prev, jobId]);
    pushToast("success", "Candidature ajoutée au pipeline — statut « Postulé »");
  };

  const setAppStatus = (jobId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev[jobId] ? { ...prev, [jobId]: { ...prev[jobId], status, updatedAt: Date.now() } } : prev
    );
  };

  const setAppNote = (jobId: string, note: string) => {
    setApplications((prev) =>
      prev[jobId] ? { ...prev, [jobId]: { ...prev[jobId], note } } : prev
    );
  };

  const removeApplication = (jobId: string) => {
    setApplications((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
    pushToast("info", "Candidature retirée du suivi");
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    pushToast("info", "Filtres réinitialisés");
  };

  const addAlert = (w: string) => {
    setAlerts((prev) => (prev.some((a) => a.toLowerCase() === w.toLowerCase()) ? prev : [...prev, w]));
    pushToast("alert", `Alerte « ${w} » activée sur les nouvelles offres`);
  };

  const stamp = new Date().toISOString().slice(0, 10);

  const exportCsv = () => {
    download(`radar-qa-${stamp}.csv`, jobsToCsv(tabVisible), "text/csv");
    pushToast("info", `Export CSV — ${tabVisible.length} offre${tabVisible.length > 1 ? "s" : ""}`);
  };

  const exportJson = () => {
    download(
      `radar-qa-${stamp}.json`,
      JSON.stringify(tabVisible, null, 2),
      "application/json"
    );
    pushToast("info", `Export JSON — ${tabVisible.length} offre${tabVisible.length > 1 ? "s" : ""}`);
  };

  const exportRss = () => {
    const name = (id: SourceId) => SOURCES.find((s) => s.id === id)?.name ?? id;
    download(`radar-qa-${stamp}.xml`, jobsToRss(tabVisible, name), "application/rss+xml");
    pushToast("info", `Flux RSS exporté — ${tabVisible.length} offre${tabVisible.length > 1 ? "s" : ""}`);
  };

  /* ----------------------------- rendu ------------------------------- */

  return (
    <div className="min-h-screen">
      <div className="bg-scene" aria-hidden="true" />

      <Header
        scanning={scanning}
        lastScan={lastScan}
        remaining={remaining}
        autoOn={prefs.autoOn}
        intervalSec={prefs.intervalSec}
        newCount={bellCount}
        notifOn={prefs.notifOn}
        theme={prefs.theme}
        canInstall={installEvt !== null}
        onToggleAuto={toggleAuto}
        onIntervalChange={changeInterval}
        onScanNow={() => void runScan(false)}
        onBell={() => {
          setTab("new");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onToggleNotif={toggleNotif}
        onToggleTheme={toggleTheme}
        onInstall={installApp}
      />

      <main className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 sm:px-6">
        <StatsBar
          total={stats.total}
          new24={stats.new24}
          highMatch={stats.highMatch}
          online={stats.online}
          sourcesTotal={SOURCES.length}
          scans={scans}
          blips={Math.min(6, stats.new24)}
          scanning={scanning}
          applications={applicationCount}
        />

        <div className="flex flex-col gap-5 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-[302px]">
            <div className="lg:sticky lg:top-[86px] lg:max-h-[calc(100vh-106px)] lg:overflow-y-auto lg:rounded-lg">
              <Filters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                sources={SOURCES}
                status={status}
                counts={sourceCounts}
                alerts={alerts}
                onAddAlert={addAlert}
                onRemoveAlert={(w) => setAlerts((prev) => prev.filter((a) => a !== w))}
                apiKeys={apiKeys}
                onApiKeys={setApiKeys}
                onExportCsv={exportCsv}
                onExportJson={exportJson}
                onExportRss={exportRss}
                shown={tabVisible.length}
                totalActive={activeJobs.length}
              />
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            {/* barre d'onglets + tri */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex rounded-md border border-edge bg-panel p-0.5" role="tablist">
                {TABS.map((t) => {
                  const count =
                    t.id === "all"
                      ? filtered.length
                      : t.id === "new"
                      ? newInFiltered.length
                      : t.id === "saved"
                      ? savedInFiltered.length
                      : applicationCount;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all ${
                        active ? "bg-signal/15 text-signal" : "text-mut hover:text-fg"
                      }`}
                    >
                      {t.label}
                      <span className={`font-mono text-[10px] ${active ? "text-signal/80" : "text-dim"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {tab === "new" && newIds.length > 0 && (
                  <button
                    onClick={() => setNewIds([])}
                    className="flex h-8 items-center gap-1.5 rounded-md border border-edge px-2.5 text-[11px] font-medium text-mut transition-all hover:border-signal/50 hover:text-signal active:scale-95"
                  >
                    <IconCheck size={13} />
                    Tout marquer traité
                  </button>
                )}
                <button
                  onClick={() => setPrefs((p) => ({ ...p, dense: !p.dense }))}
                  aria-label={prefs.dense ? "Vue confortable" : "Vue compacte"}
                  aria-pressed={prefs.dense}
                  title={prefs.dense ? "Vue confortable" : "Vue compacte"}
                  className={`grid h-8 w-8 place-items-center rounded-md border transition-all active:scale-95 ${
                    prefs.dense
                      ? "border-radarc/50 bg-radarc/10 text-radarc"
                      : "border-edge bg-panel text-mut hover:border-edge2 hover:text-fg"
                  }`}
                >
                  <IconLayers size={14} />
                </button>
                <div className="relative">
                  <select
                    value={prefs.sort}
                    onChange={(e) => setPrefs((p) => ({ ...p, sort: e.target.value as SortId }))}
                    aria-label="Tri des offres"
                    className="h-8 appearance-none rounded-md border border-edge bg-panel pl-2.5 pr-7 font-mono text-[11px] text-fg transition-colors hover:border-edge2 focus:outline-none"
                  >
                    <option value="recent">Plus récentes</option>
                    <option value="salary_desc">Salaire ↓</option>
                    <option value="salary_asc">Salaire ↑</option>
                    <option value="match">Match profil</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-dim"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ligne de contexte */}
            <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] text-dim">
              <span className="text-signal">▸</span>
              {tab === "applications" ? (
                <>{applicationCount} candidature{applicationCount > 1 ? "s" : ""} suivie{applicationCount > 1 ? "s" : ""}</>
              ) : (
                <>
                  {tabVisible.length} offre{tabVisible.length > 1 ? "s" : ""}
                  {filters.query.trim() && <> pour « {filters.query.trim()} »</>}
                  <span className="mx-1 text-edge2">|</span>
                  tri : {prefs.sort === "recent" ? "plus récentes" : prefs.sort === "match" ? "match profil" : "salaire"}
                </>
              )}
              {scanning && (
                <span className="ml-auto flex items-center gap-1.5 text-radarc">
                  <span className="blink">●</span> rapatriement en cours…
                </span>
              )}
            </div>

            {tab === "applications" ? (
              <Applications
                applications={applications}
                jobsById={jobsById}
                onOpen={openOffer}
                onSetStatus={setAppStatus}
                onSetNote={setAppNote}
                onRemove={removeApplication}
              />
            ) : tabVisible.length === 0 ? (
              <div className="anim-rise flex flex-col items-center rounded-lg border border-dashed border-edge bg-panel/50 px-6 py-16 text-center">
                <IconInbox size={34} className="text-edge2" />
                <div className="mt-4 font-display text-lg font-semibold text-fg">
                  Aucune offre dans cette vue
                </div>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-mut">
                  {tab === "saved"
                    ? "Sauvegardez des offres avec le marque-page pour les retrouver ici, même après un redémarrage."
                    : tab === "new"
                    ? "Aucune nouveauté pour le moment — le prochain scan automatique arrive bientôt."
                    : "Ajustez vos filtres, ou lancez un scan pour rapatrier les dernières publications des sources."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {tab === "all" && (
                    <button
                      onClick={resetFilters}
                      className="h-9 rounded-md border border-edge px-3.5 text-xs font-medium text-mut transition-all hover:border-edge2 hover:text-fg active:scale-95"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                  <button
                    onClick={() => void runScan(false)}
                    disabled={scanning}
                    className="flex h-9 items-center gap-2 rounded-md bg-signal px-3.5 font-display text-xs font-semibold text-abyss transition-all hover:bg-[#63e8b7] active:scale-95 disabled:opacity-60"
                  >
                    <IconRefresh size={13} className={scanning ? "spin-slow" : ""} />
                    Scanner maintenant
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tabVisible.map((j, i) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    index={i}
                    match={matchMap.get(j.id) ?? 0}
                    isNew={newIds.includes(j.id)}
                    isAlert={isAlert(j)}
                    saved={savedIds.includes(j.id)}
                    read={readIds.includes(j.id)}
                    dense={prefs.dense}
                    application={applications[j.id]?.status}
                    onOpen={() => openOffer(j)}
                    onSave={() => toggleSave(j.id)}
                    onHide={() => hideJob(j.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-[1480px] px-4 pb-8 pt-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-edge bg-panel/70 px-4 py-3">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">Sources</span>
          {SOURCES.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-mut">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status[s.id] === "online"
                    ? "bg-signal"
                    : status[s.id] === "scanning"
                    ? "bg-radarc blink"
                    : status[s.id] === "offline"
                    ? "bg-coral"
                    : "bg-dim"
                }`}
              />
              {s.name}
            </span>
          ))}
          <span className="ml-auto font-mono text-[10px] text-dim">
            {lastScan ? `dernier scan ${clockTime(lastScan)}` : "scan initial…"} · données stockées
            localement · v2.0
          </span>
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-dim">
          Flux nationaux (France Travail, Indeed, WTTJ, HelloWork, LinkedIn) alimentés par un
          référentiel réaliste côté navigateur — ces API exigent un accès serveur. Remotive,
          Arbeitnow et Adzuna (avec votre clé) sont interrogés en direct depuis votre navigateur
          à chaque scan.
        </p>
      </footer>

      <JobDrawer
        job={openJob}
        match={openJob ? matchMap.get(openJob.id) ?? 0 : 0}
        saved={openJob ? savedIds.includes(openJob.id) : false}
        isNew={openJob ? newIds.includes(openJob.id) : false}
        isAlert={openJob ? isAlert(openJob) : false}
        sourceName={
          openJob ? SOURCES.find((s) => s.id === openJob.source)?.name ?? openJob.source : ""
        }
        application={openJob ? applications[openJob.id] : undefined}
        onClose={() => setOpenJob(null)}
        onSave={() => openJob && toggleSave(openJob.id)}
        onHide={() => openJob && hideJob(openJob.id)}
        onApply={() => openJob && markApplied(openJob.id)}
        onAppStatus={(s) => openJob && setAppStatus(openJob.id, s)}
      />

      <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
