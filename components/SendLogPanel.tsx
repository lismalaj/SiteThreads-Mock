'use client';

type SendLogEntry = {
  id: string;
  mode: 'new' | 'reply';
  siteLabel: string;
  to: string;
  subject: string;
  sentAtLabel: string;
};

type ActivityNote = {
  id: string;
  text: string;
};

type SendLogPanelProps = {
  entries: SendLogEntry[];
  activityNote?: ActivityNote | null;
  onClear: () => void;
};

export type { ActivityNote, SendLogEntry };

export default function SendLogPanel({ entries, activityNote, onClear }: SendLogPanelProps) {
  const empty = entries.length === 0;

  return (
    <div className={`w-[340px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,19,28,0.78),rgba(10,13,20,0.72))] text-white shadow-panel backdrop-blur-[28px] ${empty ? 'px-4 py-3' : ''}`}>
      <div className={`${empty ? '' : 'border-b border-white/8 px-4 py-3'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">Activity</div>
            <p className="mt-1 text-[12px] text-white/55">Recent sends and small linking updates.</p>
          </div>
          {!empty ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/72 transition hover:bg-white/14"
            >
              Clear
            </button>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm text-sky-200">↗</div>
          )}
        </div>

        {activityNote ? (
          <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.07] px-3 py-2 text-[11px] text-white/74 animate-fadeUp">
            {activityNote.text}
          </div>
        ) : null}
      </div>

      {!empty ? (
        <div className="max-h-[300px] overflow-y-auto px-3 py-3">
          <div className="space-y-2.5">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-white/8 bg-white/[0.09] px-3.5 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        entry.mode === 'reply' ? 'bg-sky-400/18 text-sky-200' : 'bg-emerald-400/18 text-emerald-200'
                      }`}
                    >
                      {entry.mode}
                    </span>
                    <span className="text-[11px] font-medium text-white/48">{entry.siteLabel}</span>
                  </div>
                  <span className="text-[10.5px] text-white/34">{entry.sentAtLabel}</span>
                </div>

                <div className="mt-2 text-[12.5px] font-semibold tracking-tight text-white/90">{entry.subject}</div>
                <div className="mt-1 truncate text-[12px] text-white/54">To {entry.to}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
