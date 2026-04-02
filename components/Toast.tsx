'use client';

type ToastProps = {
  tone: 'success' | 'error';
  title: string;
  description: string;
  onClose: () => void;
};

export default function Toast({ tone, title, description, onClose }: ToastProps) {
  const palette =
    tone === 'success'
      ? {
          shell: 'bg-white/90 border-emerald-200/80',
          icon: 'bg-emerald-100 text-emerald-700',
        }
      : {
          shell: 'bg-white/90 border-rose-200/80',
          icon: 'bg-rose-100 text-rose-700',
        };

  return (
    <div className={`pointer-events-auto flex min-w-[280px] max-w-[360px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-panel backdrop-blur-2xl ${palette.shell}`}>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${palette.icon}`}>
        {tone === 'success' ? '✓' : '!'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold tracking-tight text-ink">{title}</div>
        <p className="mt-1 text-[12px] leading-5 text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs text-muted transition hover:bg-black/10"
        aria-label="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}
