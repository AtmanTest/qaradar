import { useEffect, useRef } from "react";
import type { Application, ApplicationStatus, Job } from "../types";
import { annualLabel, formatPay, hueOf, initialsOf, timeAgo } from "../lib/utils";
import { APP_STATUSES } from "./Applications";
import { IconBookmark, IconExternal, IconEyeOff, IconPin, IconSend, IconX, IconZap } from "./icons";

interface JobDrawerProps {
  job: Job | null;
  match: number;
  saved: boolean;
  isNew: boolean;
  isAlert: boolean;
  sourceName: string;
  application?: Application;
  onClose: () => void;
  onSave: () => void;
  onHide: () => void;
  onApply: () => void;
  onAppStatus: (status: ApplicationStatus) => void;
}

export default function JobDrawer({
  job,
  match,
  saved,
  isNew,
  isAlert,
  sourceName,
  application,
  onClose,
  onSave,
  onHide,
  onApply,
  onAppStatus,
}: JobDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const jobId = job?.id;

  // focus clavier à l'ouverture (accessibilité)
  useEffect(() => {
    if (jobId) closeRef.current?.focus();
  }, [jobId]);

  if (!job) return null;
  const hue = hueOf(job.company);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-abyss/70 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className="drawer-in absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col border-l border-edge bg-panel"
        role="dialog"
        aria-label={`Détail de l'offre ${job.title}`}
      >
        <header className="flex items-center justify-between border-b border-edge px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
            Fiche offre · {sourceName}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-md border border-edge text-mut transition-all hover:border-edge2 hover:text-fg active:scale-95"
          >
            <IconX size={15} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-3.5">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-md border font-display text-sm font-bold"
              style={{
                background: `hsl(${hue} 42% 13%)`,
                borderColor: `hsl(${hue} 45% 26%)`,
                color: `hsl(${hue} 75% 68%)`,
              }}
            >
              {initialsOf(job.company)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold leading-tight text-fg">{job.title}</h2>
              <div className="mt-1 text-sm text-mut">
                {job.company} <span className="text-dim">· publiée {timeAgo(job.publishedAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                <span className="rounded border border-radarc/30 bg-radarc/10 px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-radarc">
                  Match profil {match}%
                </span>
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-edge bg-edge">
            {[
              ["Contrat", job.contract],
              ["Rémunération", annualLabel(job) === "—" ? formatPay(job) : annualLabel(job)],
              ["Localisation", job.location],
              ["Mode", job.workMode],
              ["Niveau requis", job.seniority],
              ["Source", sourceName],
            ].map(([k, v]) => (
              <div key={k} className="bg-panel px-3.5 py-3">
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-dim">{k}</dt>
                <dd className="mt-1 text-[13px] font-medium text-fg">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-start gap-2 text-sm text-mut">
            <IconPin size={15} className="mt-0.5 shrink-0 text-dim" />
            <p className="leading-relaxed">
              {job.description}
            </p>
          </div>

          <div className="mt-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
              Stack & mots-clés
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.length > 0 ? (
                job.tags.map((t) => (
                  <span key={t} className="rounded border border-edge bg-ink/60 px-2 py-1 font-mono text-[11px] text-mut">
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-dim">Aucun tag fourni par la source.</span>
              )}
            </div>
          </div>

          {/* suivi de candidature */}
          <div className="mt-5 rounded-lg border border-edge bg-panel2/40 p-4">
            <div className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
              <IconSend size={12} />
              Suivi candidature
            </div>
            {application ? (
              <>
                <div className="flex items-center gap-1.5">
                  {APP_STATUSES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onAppStatus(s.id)}
                      aria-pressed={application.status === s.id}
                      className={`h-7 flex-1 rounded-md border font-mono text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
                        application.status === s.id
                          ? s.chip
                          : "border-edge text-dim hover:border-edge2 hover:text-mut"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10.5px] text-dim">
                  Dans le pipeline depuis {timeAgo(application.updatedAt)} — retrouvez-la dans
                  l'onglet <span className="text-mut">Candidatures</span>.
                </p>
              </>
            ) : (
              <button
                onClick={onApply}
                className="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-radarc/40 bg-radarc/10 text-xs font-medium text-radarc transition-all hover:bg-radarc/20 active:scale-[0.98]"
              >
                <IconSend size={13} />
                Marquer comme postulé
              </button>
            )}
          </div>
        </div>

        <footer className="flex gap-2 border-t border-edge px-5 py-4">
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-signal font-display text-sm font-semibold text-abyss transition-all hover:bg-[#63e8b7] active:scale-[0.98]"
          >
            Postuler sur la source
            <IconExternal size={15} />
          </a>
          <button
            onClick={onSave}
            className={`grid h-11 w-11 place-items-center rounded-md border transition-all active:scale-95 ${
              saved ? "border-amberx/50 bg-amberx/10 text-amberx" : "border-edge text-mut hover:border-edge2 hover:text-fg"
            }`}
            aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
            title={saved ? "Retirer des favoris" : "Sauvegarder"}
          >
            <IconBookmark size={17} filled={saved} />
          </button>
          <button
            onClick={onHide}
            className="grid h-11 w-11 place-items-center rounded-md border border-edge text-mut transition-all hover:border-coral/60 hover:text-coral active:scale-95"
            aria-label="Masquer cette offre"
            title="Masquer"
          >
            <IconEyeOff size={17} />
          </button>
        </footer>
      </aside>
    </div>
  );
}
