import type { ReactNode } from "react";
import { IconBriefcase, IconLayers, IconTarget, IconZap } from "./icons";

interface StatsBarProps {
  total: number;
  new24: number;
  highMatch: number;
  online: number;
  sourcesTotal: number;
  scans: number;
  blips: number;
  scanning: boolean;
}

const BLIPS = [
  { top: "22%", left: "62%" },
  { top: "58%", left: "74%" },
  { top: "40%", left: "26%" },
  { top: "70%", left: "40%" },
  { top: "28%", left: "44%" },
  { top: "52%", left: "56%" },
];

function Tile({
  label,
  value,
  sub,
  accent,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-edge bg-panel/80 p-4 transition-colors hover:border-edge2">
      <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full" style={{ background: accent }} />
      <span className="absolute right-3 top-3 text-edge2 transition-colors group-hover:text-mut">{icon}</span>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">{label}</div>
      <div className={`mt-1.5 font-display text-[27px] font-bold leading-none ${valueClass ?? "text-fg"}`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] leading-snug text-mut">{sub}</div>
    </div>
  );
}

export default function StatsBar({
  total,
  new24,
  highMatch,
  online,
  sourcesTotal,
  scans,
  blips,
  scanning,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Tile
        label="Offres en veille"
        value={String(total)}
        sub="base agrégée, toutes sources"
        accent="var(--color-signal)"
        icon={<IconLayers size={18} />}
      />
      <Tile
        label="Nouvelles · 24 h"
        value={String(new24)}
        sub="publiées depuis hier"
        accent="var(--color-radarc)"
        icon={<IconZap size={18} />}
        valueClass={new24 > 0 ? "text-radarc" : undefined}
      />
      <Tile
        label="Match profil ≥ 80 %"
        value={String(highMatch)}
        sub="calibré sur 12 ans d'XP QA"
        accent="var(--color-amberx)"
        icon={<IconTarget size={18} />}
      />
      <Tile
        label="Sources actives"
        value={`${online}/${sourcesTotal}`}
        sub="API live + flux nationaux"
        accent="var(--color-coral)"
        icon={<IconBriefcase size={18} />}
      />
      <div className="col-span-2 flex items-center gap-4 rounded-lg border border-edge bg-panel/80 p-4 lg:col-span-1">
        <div className="relative h-[84px] w-[84px] shrink-0">
          <div className="absolute inset-0 rounded-full border border-signal/40 bg-signal/[0.05]" />
          <div className="absolute inset-[13px] rounded-full border border-signal/25" />
          <div className="absolute inset-[26px] rounded-full border border-signal/15" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-signal/10" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-signal/10" />
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div
              className="radar-sweep absolute inset-0"
              style={{
                background:
                  "conic-gradient(from 0deg, color-mix(in srgb, var(--color-signal) 45%, transparent), transparent 80deg)",
              }}
            />
          </div>
          {BLIPS.slice(0, Math.min(BLIPS.length, blips)).map((b, i) => (
            <span
              key={i}
              className="ping-wrap absolute h-1.5 w-1.5 rounded-full bg-signal text-signal"
              style={{ top: b.top, left: b.left }}
            />
          ))}
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
            Radar · scan <span className="text-signal">#{scans}</span>
          </div>
          <div className={`mt-1 font-display text-sm font-semibold ${scanning ? "blink text-radarc" : "text-fg"}`}>
            {scanning ? "Balayage des sources…" : "En écoute active"}
          </div>
          <div className="mt-1 text-[11px] text-mut">
            {blips > 0 ? `${blips} écho${blips > 1 ? "s" : ""} récent${blips > 1 ? "s" : ""} sur la zone` : "zone calme"}
          </div>
        </div>
      </div>
    </div>
  );
}
