'use client';

const palette: Record<string, { bg: string; border: string; text: string }> = {
  DK: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  MS: { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
  TR: { bg: '#ffedd5', border: '#fdba74', text: '#c2410c' },
  GH: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  FR: { bg: '#f3e8ff', border: '#d8b4fe', text: '#7e22ce' },
  KP: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1' },
  ME: { bg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6' },
};

export default function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  const colors = palette[initials] ?? palette.GH;

  return (
    <div
      aria-hidden
      className="shrink-0 rounded-full border flex items-center justify-center font-bold tracking-tight"
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        fontSize: Math.max(11, size * 0.34),
      }}
    >
      {initials === 'ME' ? 'Me' : initials}
    </div>
  );
}
