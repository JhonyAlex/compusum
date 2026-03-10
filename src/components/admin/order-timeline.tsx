import { CheckCircle2, Circle } from "lucide-react";

interface StatusEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  note: string | null;
  createdAt: string | Date;
}

interface OrderTimelineProps {
  history: StatusEntry[];
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  return (
    <div className="space-y-4">
      {history.map((entry, i) => {
        const isLast = i === history.length - 1;
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {isLast ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
              )}
              {i < history.length - 1 && (
                <div className="w-px h-full bg-slate-200 mt-1" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-slate-900">
                {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : entry.toStatus}
              </p>
              {entry.note && (
                <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>{new Date(entry.createdAt).toLocaleString("es-CO")}</span>
                {entry.changedBy && <span>por {entry.changedBy}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
