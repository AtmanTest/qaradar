import type { ApplicationStatus, Contract, Job } from "../types";
import { formatPay, hueOf, initialsOf, timeAgo } from "../lib/utils";
import { APP_STATUS_LABEL } from "./Applications";
import { IconBookmark, IconExternal, IconEyeOff, IconPin, IconSend, IconZap } from "./icons";

const CONTRACT_STYLE: Record<Contract, string> = {
  CDI: "border-signal/40 bg-signal/10 text-signal",
  CDD: "border-radarc/40 bg-radarc/10 text-radarc",
  Freelance: "border-amberx/40 bg-amberx/10 text-amberx",
  Alternance: "border-coral/40 bg-coral/10 text-coral",
};

interface JobCardProps {
  job: Job;
  match: number;
  isNew: boolean;
  isAlert: boolean;
  saved: boolean;
  read: boolean;
  dense: boolean;
  index: number;
  application?: ApplicationStatus;
  onOpen: () => void;
  onSave: () => void;
  onHide: () => void;
}

export default function JobCard({
  job,
  match,
  isNew,
  isAlert,
  saved,
  read,
  dense,
  index,
  application,
  onOpen,
  onSave,
  onHide,
}: JobCardProps) {
  const hue = hueOf(job.company);

  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      tabIndex={0}
      role="button"
      aria-label={`${job.title} — ${job.company}`}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
      className={`anim-rise group relative cursor-pointer rounded-lg border bg-panel/85 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-edge2 hover:bg-panel hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ${
        isNew ? "border-signal/35" : "border-edge"
      } ${read ? "opacity-75 hover:opacity-100" : ""}`}
    >
      {/* barre d'état lu/non lu */}
      {isNew ? (
        <span className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full bg-signal" />
      ) : !read ? (
        <span className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full bg-edge2" />
      ) : null}

      <div className="flex gap-3.5">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border font-display text-xs font-bold"
          style={{
            background: `hsl(${hue} 42% 13%)`,
            borderColor: `hsl(${hue} 45% 26%)`,
            color: `hsl(${hue} 75% 68%)`,
          }}
        >
          {initialsOf(job.company)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className={`font-display text-[15px] font-semibold leading-tight ${read ? "text-mut" : "text-fg"}`}>
              {job.title}
            </h3>
            {isNew && (
              <span className="flex items-center gap-1.5 rounded border border-signal/40 bg-signal/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wider text-signal">
                <span className="ping-wrap h-1.5 w-1.5 rounded-full bg-signal text-signal" />
                NOUVEAU
              </span>
            )}
            {isAlert && (
              <span className="flex items-center gap-1 rounded border border-coral/40 bg-coral/10 px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wider text-coral">
                <IconZap size={10} />
                ALERTE
              </span>
            )}
            {match >= 60 && (
              <span className="rounded border border-radarc/30 bg-radarc/10 px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-radarc">
                Match {match}%
              </span>
            )}
            {application && (
              <span className="flex items-center gap-1 rounded border border-amberx/40 bg-amberx/10 px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wider text-amberx">
                <IconSend size={10} />
                {APP_STATUS_LABEL[application].toUpperCase()}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mut">
            <span className="font-medium text-fg/80">{job.company}</span>
            <span className="text-dim">·</span>
            <span className="flex items-center gap-1">
              <IconPin size={12} className="text-dim" />
              {job.location}
            </span>
            <span className="text-dim">·</span>
            <span>{job.workMode}</span>
            <span className={`rounded border px-1.5 py-px font-mono text-[10px] font-medium ${CONTRACT_STYLE[job.contract]}`}>
              {job.contract}
            </span>
            <span className="hidden text-dim md:inline">· {job.seniority}</span>
          </div>

          {!dense && (
            <>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {job.tags.slice(0, 5).map((t) => (
                  <span key={t} className="rounded border border-edge bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] text-mut">
                    {t}
                  </span>
                ))}
                {job.tags.length > 5 && (
                  <span className="rounded border border-edge/60 px-1.5 py-0.5 font-mono text-[10px] text-dim">
                    +{job.tags.length - 5}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-xs text-dim">{job.description}</p>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <div className="text-right">
            <div className="whitespace-nowrap font-mono text-sm font-bold text-signal">{formatPay(job)}</div>
            <div className="mt-0.5 whitespace-nowrap font-mono text-[10px] text-dim">{timeAgo(job.publishedAt)}</div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onSave}
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder l'offre"}
              title={saved ? "Retirer des favoris" : "Sauvegarder"}
              className={`grid h-7 w-7 place-items-center rounded border transition-all active:scale-90 ${
                saved
                  ? "border-amberx/50 bg-amberx/10 text-amberx"
                  : "border-edge text-mut hover:border-edge2 hover:text-fg"
              }`}
            >
              <IconBookmark size={13} filled={saved} />
            </button>
            <button
              onClick={onHide}
              aria-label="Masquer cette offre"
              title="Masquer"
              className="grid h-7 w-7 place-items-center rounded border border-edge text-mut transition-all hover:border-edge2 hover:text-fg active:scale-90"
            >
              <IconEyeOff size={13} />
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              title="Ouvrir l'offre"
              className="flex h-7 items-center gap-1 rounded border border-edge px-2 font-mono text-[10px] text-mut transition-all hover:border-signal/50 hover:text-signal active:scale-95"
            >
              Postuler
              <IconExternal size={11} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
