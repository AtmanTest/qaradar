import { useState, type CSSProperties, type ReactNode } from "react";
import type { Filters as FiltersState, SourceId, SourceMeta, SourceStatus } from "../types";
import {
  CONTRACTS,
  LOCATION_FILTERS,
  PROFILE,
  SENIORITIES,
  TAGS,
  WORKMODES,
} from "../data/jobs";
import { IconChevronDown, IconDownload, IconFile, IconSearch, IconSliders, IconX, IconPlus } from "./icons";

interface FiltersProps {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  onReset: () => void;
  sources: SourceMeta[];
  status: Record<SourceId, SourceStatus>;
  counts: Record<string, number>;
  alerts: string[];
  onAddAlert: (w: string) => void;
  onRemoveAlert: (w: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  shown: number;
  totalActive: number;
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b border-edge/60 px-4 py-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${small ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs"} rounded-md border font-medium transition-all active:scale-95 ${
        active
          ? "border-signal/50 bg-signal/15 text-signal"
          : "border-edge bg-panel2/60 text-mut hover:border-edge2 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function dotClass(st: SourceStatus, enabled: boolean): string {
  if (!enabled) return "bg-dim/60";
  if (st === "online") return "bg-signal";
  if (st === "scanning") return "bg-radarc blink";
  if (st === "offline") return "bg-coral";
  return "bg-dim";
}

export default function Filters({
  filters,
  onChange,
  onReset,
  sources,
  status,
  counts,
  alerts,
  onAddAlert,
  onRemoveAlert,
  onExportCsv,
  onExportJson,
  shown,
  totalActive,
}: FiltersProps) {
  const [alertInput, setAlertInput] = useState("");
  const pct = (filters.minSalary / 80) * 100;

  const toggleIn = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const toggleSource = (id: SourceId) => {
    const next = toggleIn(filters.sources, id);
    onChange({ ...filters, sources: next.length === 0 ? sources.map((s) => s.id) : next });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-edge bg-panel">
      {/* Profil calibré */}
      <div className="border-b border-edge/60 bg-panel2/40 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-signal/30 bg-signal/15 font-display text-sm font-bold text-signal">
            QA
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold leading-tight text-fg">
              {PROFILE.name}
            </div>
            <div className="mt-0.5 font-mono text-[9.5px] tracking-[0.08em] text-dim">
              {PROFILE.years} ANS XP · {PROFILE.city.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PROFILE.skills.slice(0, 5).map((s) => (
            <span key={s} className="rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-mut">
              {s}
            </span>
          ))}
          <span className="rounded border border-edge/60 px-1.5 py-0.5 font-mono text-[10px] text-dim">
            +{PROFILE.skills.length - 5} technos
          </span>
        </div>
        <p className="mt-2.5 text-[11px] leading-snug text-dim">
          CV GitHub pris en compte : le score <span className="font-medium text-radarc">Match</span>{" "}
          pondère vos technos sur chaque offre.
        </p>
      </div>

      <Section title="Recherche">
        <div className="relative">
          <IconSearch size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            id="job-search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Titre, entreprise, techno…"
            className="h-9 w-full rounded-md border border-edge bg-ink pl-8 pr-8 text-sm text-fg placeholder:text-dim transition-colors focus:border-signal/60 focus:outline-none"
          />
          {filters.query ? (
            <button
              onClick={() => onChange({ ...filters, query: "" })}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-dim transition-colors hover:text-fg"
            >
              <IconX size={14} />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-edge px-1.5 font-mono text-[10px] text-dim">
              /
            </kbd>
          )}
        </div>
      </Section>

      <Section title="Contrat">
        <div className="flex flex-wrap gap-1.5">
          {CONTRACTS.map((c) => (
            <Chip key={c} active={filters.contracts.includes(c)} onClick={() => onChange({ ...filters, contracts: toggleIn(filters.contracts, c) })}>
              {c}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Localisation">
        <div className="flex flex-wrap gap-1.5">
          {LOCATION_FILTERS.map((l) => (
            <Chip key={l.id} active={filters.locations.includes(l.id)} onClick={() => onChange({ ...filters, locations: toggleIn(filters.locations, l.id) })}>
              {l.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Mode de travail">
        <div className="flex flex-wrap gap-1.5">
          {WORKMODES.map((w) => (
            <Chip key={w} active={filters.workModes.includes(w)} onClick={() => onChange({ ...filters, workModes: toggleIn(filters.workModes, w) })}>
              {w}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Rémunération annuelle min">
        <input
          type="range"
          min={0}
          max={80}
          step={5}
          value={filters.minSalary}
          onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
          style={{ "--fill": `${pct}%` } as CSSProperties}
          aria-label="Salaire minimum"
        />
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-dim">
          <span>0</span>
          <span className="font-medium text-signal">
            {filters.minSalary > 0 ? `≥ ${filters.minSalary} k€` : "indifférent"}
          </span>
          <span>80 k€+</span>
        </div>
        <p className="mt-1 text-[10px] text-dim">TJM freelance annualisé automatiquement.</p>
      </Section>

      <Section title="Niveau d'expérience">
        <div className="relative">
          <select
            value={filters.seniority}
            onChange={(e) => onChange({ ...filters, seniority: e.target.value })}
            className="h-9 w-full appearance-none rounded-md border border-edge bg-ink pl-2.5 pr-8 text-sm text-fg focus:border-signal/60 focus:outline-none"
          >
            {SENIORITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <IconChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-dim" />
        </div>
      </Section>

      <Section
        title="Technos & outils"
        right={
          filters.tags.length > 0 ? (
            <button onClick={() => onChange({ ...filters, tags: [] })} className="font-mono text-[10px] text-coral hover:underline">
              effacer ({filters.tags.length})
            </button>
          ) : undefined
        }
      >
        <div className="fade-mask-b flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {TAGS.map((t) => (
            <Chip key={t} small active={filters.tags.includes(t)} onClick={() => onChange({ ...filters, tags: toggleIn(filters.tags, t) })}>
              {t}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Sources">
        <ul className="space-y-1">
          {sources.map((s) => {
            const enabled = filters.sources.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  onClick={() => toggleSource(s.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                    enabled ? "hover:bg-panel2/70" : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(status[s.id], enabled)}`} />
                  <span className={`flex-1 truncate text-xs ${enabled ? "text-fg" : "text-dim"}`}>{s.name}</span>
                  <span className="font-mono text-[10px] text-dim">{counts[s.id] ?? 0}</span>
                  {s.kind === "api" ? (
                    <span className="rounded border border-radarc/30 bg-radarc/10 px-1 font-mono text-[9px] text-radarc">API</span>
                  ) : (
                    <span className="rounded border border-edge bg-ink/60 px-1 font-mono text-[9px] text-dim">flux</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Alertes mots-clés">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const w = alertInput.trim();
            if (w) {
              onAddAlert(w);
              setAlertInput("");
            }
          }}
          className="flex gap-1.5"
        >
          <input
            value={alertInput}
            onChange={(e) => setAlertInput(e.target.value)}
            placeholder="ex : Lead, Playwright…"
            className="h-8 min-w-0 flex-1 rounded-md border border-edge bg-ink px-2.5 text-xs text-fg placeholder:text-dim focus:border-coral/60 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Ajouter l'alerte"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-edge text-mut transition-all hover:border-coral/60 hover:text-coral active:scale-95"
          >
            <IconPlus size={14} />
          </button>
        </form>
        {alerts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {alerts.map((a) => (
              <span key={a} className="flex items-center gap-1 rounded border border-coral/40 bg-coral/10 py-0.5 pl-2 pr-1 text-[11px] font-medium text-coral">
                {a}
                <button onClick={() => onRemoveAlert(a)} aria-label={`Supprimer l'alerte ${a}`} className="rounded p-0.5 transition-colors hover:bg-coral/20">
                  <IconX size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-[10px] leading-snug text-dim">
          Un badge <span className="font-mono font-bold text-coral">ALERTE</span> s'affiche sur les offres correspondantes.
        </p>
      </Section>

      <div className="space-y-2 px-4 py-4">
        <button
          onClick={onReset}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-edge text-xs font-medium text-mut transition-all hover:border-coral/60 hover:text-coral active:scale-[0.98]"
        >
          <IconSliders size={14} />
          Réinitialiser les filtres
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportCsv}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-edge text-xs font-medium text-mut transition-all hover:border-radarc/60 hover:text-radarc active:scale-[0.98]"
          >
            <IconDownload size={13} />
            CSV
          </button>
          <button
            onClick={onExportJson}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-edge text-xs font-medium text-mut transition-all hover:border-radarc/60 hover:text-radarc active:scale-[0.98]"
          >
            <IconFile size={13} />
            JSON
          </button>
        </div>
        <p className="text-center font-mono text-[10px] text-dim">
          {shown} affichée{shown > 1 ? "s" : ""} / {totalActive} en veille
        </p>
      </div>
    </div>
  );
}
