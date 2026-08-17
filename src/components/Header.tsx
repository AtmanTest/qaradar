import { IconBell, IconRefresh } from "./icons";
import { formatCountdown, timeAgo } from "../lib/utils";

interface HeaderProps {
  scanning: boolean;
  lastScan: number | null;
  remaining: number;
  autoOn: boolean;
  intervalSec: number;
  newCount: number;
  notifOn: boolean;
  onToggleAuto: () => void;
  onIntervalChange: (sec: number) => void;
  onScanNow: () => void;
  onBell: () => void;
  onToggleNotif: () => void;
}

const INTERVALS = [
  { sec: 30, label: "30 s" },
  { sec: 60, label: "1 min" },
  { sec: 120, label: "2 min" },
  { sec: 300, label: "5 min" },
  { sec: 600, label: "10 min" },
];

export default function Header({
  scanning,
  lastScan,
  remaining,
  autoOn,
  intervalSec,
  newCount,
  notifOn,
  onToggleAuto,
  onIntervalChange,
  onScanNow,
  onBell,
  onToggleNotif,
}: HeaderProps) {
  const ringR = 10;
  const C = 2 * Math.PI * ringR;
  const frac = autoOn && intervalSec > 0 ? Math.min(1, remaining / (intervalSec * 1000)) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-edge/70 bg-abyss/85 backdrop-blur-md">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          {/* marque */}
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              <div className="absolute inset-0 rounded-full border border-signal/50" />
              <div className="absolute inset-[5px] rounded-full border border-signal/25" />
              <div className="absolute inset-[11px] rounded-full border border-signal/15" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div
                  className="radar-sweep absolute inset-0"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(63,224,165,0.55), transparent 75deg)",
                  }}
                />
              </div>
              <div className="ping-wrap absolute right-[5px] top-[6px] h-1.5 w-1.5 rounded-full bg-signal text-signal" />
            </div>
            <div>
              <div className="font-display text-lg font-bold leading-none tracking-tight text-fg">
                RADAR<span className="text-signal">·</span>QA
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
                veille offres · QA senior — Paris
              </div>
            </div>
          </div>

          {/* état du scan */}
          <div className="ml-auto hidden items-center gap-5 md:flex">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
                Dernier scan
              </div>
              <div className="mt-0.5 font-mono text-xs font-medium text-fg">
                {lastScan ? timeAgo(lastScan) : "—"}
              </div>
            </div>
            <div className="w-32">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim">
                {scanning ? "Scan en cours" : "État du flux"}
              </div>
              {scanning ? (
                <div className="scan-track mt-2 h-[3px] w-full rounded-full bg-edge" />
              ) : (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  <span className="font-mono text-xs text-signal">actif</span>
                </div>
              )}
            </div>
          </div>

          {/* contrôles */}
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-md border border-edge bg-panel px-2.5 py-1.5 sm:flex">
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <circle cx="13" cy="13" r={ringR} fill="none" stroke="var(--color-edge)" strokeWidth="3" />
                <circle
                  cx="13"
                  cy="13"
                  r={ringR}
                  fill="none"
                  stroke={autoOn ? "var(--color-signal)" : "var(--color-dim)"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - frac)}
                  transform="rotate(-90 13 13)"
                  style={{ transition: "stroke-dashoffset 0.25s linear" }}
                />
              </svg>
              <div className="w-[52px]">
                <div className="font-mono text-xs font-medium leading-none text-fg">
                  {autoOn ? formatCountdown(remaining) : "pause"}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-dim">
                  prochain scan
                </div>
              </div>
            </div>

            <button
              onClick={onToggleAuto}
              role="switch"
              aria-checked={autoOn}
              aria-label="Activer le scan automatique"
              className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
                autoOn ? "border-signal/60 bg-signal/25" : "border-edge bg-panel2"
              }`}
            >
              <span
                className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
                  autoOn ? "left-[18px] bg-signal" : "left-[3px] bg-dim"
                }`}
              />
            </button>

            <div className="relative">
              <select
                value={intervalSec}
                onChange={(e) => onIntervalChange(Number(e.target.value))}
                aria-label="Intervalle de scan"
                className="h-9 appearance-none rounded-md border border-edge bg-panel pl-2.5 pr-7 font-mono text-xs text-fg transition-colors hover:border-edge2 focus:outline-none"
              >
                {INTERVALS.map((i) => (
                  <option key={i.sec} value={i.sec}>
                    {i.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-dim"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <button
              onClick={onToggleNotif}
              aria-label="Notifications navigateur"
              title={notifOn ? "Notifications navigateur : activées" : "Notifications navigateur : coupées"}
              className={`relative grid h-9 w-9 place-items-center rounded-md border transition-all active:scale-95 ${
                notifOn
                  ? "border-radarc/60 bg-radarc/15 text-radarc"
                  : "border-edge bg-panel text-mut hover:border-edge2 hover:text-fg"
              }`}
            >
              <IconBell size={17} />
              {notifOn && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-abyss bg-radarc" />
              )}
            </button>

            <button
              onClick={onBell}
              aria-label="Voir les nouvelles offres"
              className="relative grid h-9 w-9 place-items-center rounded-md border border-edge bg-panel text-mut transition-all hover:border-edge2 hover:text-fg active:scale-95"
            >
              <IconBell size={17} />
              {newCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-coral px-1 font-mono text-[10px] font-bold text-abyss">
                  {newCount > 99 ? "99+" : newCount}
                </span>
              )}
            </button>

            <button
              onClick={onScanNow}
              disabled={scanning}
              className="flex h-9 items-center gap-2 rounded-md bg-signal px-3.5 font-display text-sm font-semibold text-abyss transition-all hover:bg-[#63e8b7] active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              <IconRefresh size={15} className={scanning ? "spin-slow" : ""} />
              <span className="hidden sm:inline">{scanning ? "Scan…" : "Scanner"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
