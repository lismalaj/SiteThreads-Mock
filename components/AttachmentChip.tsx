'use client';

import type { Attachment } from '@/lib/types';

const attachmentIcons: Record<string, string> = {
  pdf: '📄',
  image: '🖼️',
  other: '📎',
};

type AttachmentChipProps = {
  attachment: Attachment;
  onOpen?: (attachment: Attachment) => void;
  onRemove?: (attachment: Attachment) => void;
  removable?: boolean;
};

export default function AttachmentChip({ attachment, onOpen, onRemove, removable = false }: AttachmentChipProps) {
  const interactive = !!onOpen || !!onRemove;

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.09] px-3 py-1.5 text-[11px] text-white/82 transition hover:bg-white/[0.13]">
      <button
        type="button"
        onClick={() => onOpen?.(attachment)}
        className={`inline-flex min-w-0 items-center gap-2 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span>{attachmentIcons[attachment.type] ?? attachmentIcons.other}</span>
        <span className="max-w-[160px] truncate font-medium">{attachment.name}</span>
        <span className="text-white/35">{attachment.size}</span>
      </button>
      {removable ? (
        <button
          type="button"
          onClick={() => onRemove?.(attachment)}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] text-[10px] text-white/60 transition hover:bg-white/[0.14] hover:text-white"
          aria-label={`Remove ${attachment.name}`}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
