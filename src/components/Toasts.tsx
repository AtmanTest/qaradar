import type { ToastMsg } from "../types";
import { IconCheck, IconX, IconZap } from "./icons";

const KIND_STYLE: Record<ToastMsg["kind"], string> = {
  success: "border-l-signal text-signal",
  info: "border-l-radarc text-radarc",
  alert: "border-l-amberx text-amberx",
};

export default function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`toast-in pointer-events-auto flex items-center gap-2.5 rounded-md border border-edge border-l-2 bg-panel2/95 px-3.5 py-3 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.7)] backdrop-blur-sm ${KIND_STYLE[t.kind]}`}
        >
          {t.kind === "success" ? <IconCheck size={15} /> : <IconZap size={15} />}
          <p className="flex-1 text-xs font-medium leading-snug text-fg">{t.text}</p>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Fermer la notification"
            className="text-dim transition-colors hover:text-fg"
          >
            <IconX size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
