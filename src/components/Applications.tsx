import type { Application, ApplicationStatus, Job } from "../types";
import { formatPay, timeAgo } from "../lib/utils";
import { hueOf, initialsOf } from "../lib/utils";
import { IconExternal, IconNote, IconSend, IconTrash, IconX } from "./icons";

export const APP_STATUSES: {
  id: ApplicationStatus;
  label: string;
  accent: string;
  chip: string;
}[] = [
  {
    id: "postule",
    label: "Postulé",
    accent: "var(--color-radarc)",
    chip: "border-radarc/40 bg-radarc/10 text-radarc",
  },
  {
    id: "entretien",
    label: "Entretien",
    accent: "var(--color-amberx)",
    chip: "border-amberx/40 bg-amberx/10 text-amberx",
  },
  {
    id: "refus",
    label: "Refus",
    accent: "var(--color-coral)",
    chip: "border-coral/40 bg-coral/10 text-coral",
  },
];

export const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  postule: "Postulé",
  entretien: "Entretien",
  refus: "Refus",
};

interface ApplicationsProps {
  applications: Record<string, Application>;
  jobsById: Map<string, Job>;
  onOpen: (job: Job) => void;
  onSetStatus: (jobId: string, status: ApplicationStatus) => void;
  onSetNote: (jobId: string, note: string) => void;
  onRemove: (jobId: string) => void;
}

function ApplicationCard({
  app,
  job,
  onOpen,
  onSetStatus,
  onSetNote,
  onRemove,
}: {
  app: Application;
  job: Job;
  onOpen: () => void;
  onSetStatus: (s: ApplicationStatus) => void;
  onSetNote: (note: string) => void;
  onRemove: () => void;
}) {
  const hue = hueOf(job.company);
  return (
    <article className="anim-rise rounded-lg border border-edge bg-panel/85 p-3.5 transition-colors hover:border-edge2">
      <div className="flex items-start gap-2.5">
        <button
          onClick={onOpen}
          aria-label={`Ouvrir la fiche ${job.title}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border font-display text-[11px] font-bold transition-transform active:scale-95"
          style={{
            background: `hsl(${hue} 42% 13%)`,
            borderColor: `hsl(${hue} 45% 26%)`,
            color: `hsl(${hue} 75% 68%)`,
          }}
        >
          {initialsOf(job.company)}
        </button>
        <div className="min-w-0 flex-1">
          <button
            onClick={onOpen}
            className="block max-w-full truncate text-left font-display text-[13px] font-semibold leading-tight text-fg hover:text-signal"
          >
            {job.title}
          </button>
          <div className="mt-0.5 truncate text-[11px] text-mut">
            {job.company} <span className="text-dim">· {job.location}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Retirer ${job.title} du suivi`}
          title="Retirer du suivi"
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-dim transition-colors hover:text-coral"
        >
          <IconTrash size={13} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-dim">
        <span className="text-signal">{formatPay(job)}</span>
        <span>maj {timeAgo(app.updatedAt)}</span>
      </div>

      <label className="mt-2.5 flex items-center gap-1.5 rounded-md border border-edge bg-ink/60 px-2 py-1.5 focus-within:border-radarc/50">
        <IconNote size={12} className="shrink-0 text-dim" />
        <input
          value={app.note ?? ""}
          onChange={(e) => onSetNote(e.target.value)}
          placeholder="Note : contact, relance, lien…"
          aria-label={`Note pour ${job.title}`}
          className="w-full bg-transparent text-[11px] text-fg placeholder:text-dim focus:outline-none"
        />
      </label>

      <div className="mt-2.5 flex items-center gap-1">
        {APP_STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => onSetStatus(s.id)}
            aria-pressed={app.status === s.id}
            className={`h-6 flex-1 rounded border font-mono text-[9.5px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
              app.status === s.id
                ? s.chip
                : "border-edge text-dim hover:border-edge2 hover:text-mut"
            }`}
          >
            {s.label}
          </button>
        ))}
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Ouvrir l'annonce"
          title="Ouvrir l'annonce"
          className="grid h-6 w-6 shrink-0 place-items-center rounded border border-edge text-mut transition-all hover:border-signal/50 hover:text-signal active:scale-95"
        >
          <IconExternal size={11} />
        </a>
      </div>
    </article>
  );
}

export default function Applications({
  applications,
  jobsById,
  onOpen,
  onSetStatus,
  onSetNote,
  onRemove,
}: ApplicationsProps) {
  const entries = Object.values(applications).filter((a) => jobsById.has(a.jobId));

  if (entries.length === 0) {
    return (
      <div className="anim-rise flex flex-col items-center rounded-lg border border-dashed border-edge bg-panel/50 px-6 py-16 text-center">
        <IconSend size={34} className="text-edge2" />
        <div className="mt-4 font-display text-lg font-semibold text-fg">
          Aucune candidature suivie
        </div>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-mut">
          Depuis une fiche offre, cliquez sur « Marquer postulé » : l'offre rejoint ce pipeline
          et vous suivez son avancement (postulé · entretien · refus) avec vos notes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {APP_STATUSES.map((col) => {
        const items = entries
          .filter((a) => a.status === col.id)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        return (
          <section
            key={col.id}
            aria-label={`Candidatures : ${col.label}`}
            className="rounded-lg border border-edge bg-panel/40 p-3"
          >
            <header className="mb-3 flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full" style={{ background: col.accent }} />
              <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-mut">
                {col.label}
              </h3>
              <span className="ml-auto font-mono text-[10px] text-dim">{items.length}</span>
            </header>
            <div className="space-y-2.5">
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-edge px-3 py-6 text-center text-[11px] text-dim">
                  <IconX size={12} className="mx-auto mb-1.5" />
                  Aucune carte ici
                </p>
              ) : (
                items.map((a) => {
                  const job = jobsById.get(a.jobId)!;
                  return (
                    <ApplicationCard
                      key={a.jobId}
                      app={a}
                      job={job}
                      onOpen={() => onOpen(job)}
                      onSetStatus={(s) => onSetStatus(a.jobId, s)}
                      onSetNote={(n) => onSetNote(a.jobId, n)}
                      onRemove={() => onRemove(a.jobId)}
                    />
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
