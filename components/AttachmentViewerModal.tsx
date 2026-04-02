'use client';

import type { Attachment } from '@/lib/types';

const attachmentIcons: Record<string, string> = {
  pdf: '📄',
  image: '🖼️',
  other: '📎',
};

type AttachmentViewerModalProps = {
  attachment: Attachment;
  onClose: () => void;
};

export default function AttachmentViewerModal({ attachment, onClose }: AttachmentViewerModalProps) {
  const canPreview = !!attachment.url;
  const isImage = attachment.type === 'image' && canPreview;
  const isPdf = attachment.type === 'pdf' && canPreview;

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-[rgba(3,6,12,0.58)] backdrop-blur-md"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-[760px] max-w-[94vw] overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,14,21,0.95),rgba(8,11,18,0.92))] text-white shadow-[0_30px_84px_rgba(2,8,20,0.42),0_10px_32px_rgba(2,8,20,0.24)] backdrop-blur-[34px] animate-fadeUp">
        <div className="flex items-start justify-between border-b border-white/[0.08] bg-white/[0.02] px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[22px]">{attachmentIcons[attachment.type] ?? attachmentIcons.other}</span>
              <div className="min-w-0">
                <h2 className="truncate text-[18px] font-bold tracking-tight text-white">{attachment.name}</h2>
                <p className="mt-1 text-[12px] text-white/42">{attachment.size} · {attachment.type.toUpperCase()}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-sm text-white/48 transition hover:bg-white/[0.12]"
            aria-label="Close attachment preview"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachment.url} alt={attachment.name} className="max-h-[68vh] w-full rounded-[18px] object-contain" />
            ) : isPdf ? (
              <iframe src={attachment.url} title={attachment.name} className="h-[68vh] w-full rounded-[18px] border border-white/[0.06] bg-white" />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[18px] border border-dashed border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-6 text-center">
                <div className="text-[44px]">{attachmentIcons[attachment.type] ?? attachmentIcons.other}</div>
                <div className="mt-4 text-[16px] font-semibold text-white">Preview unavailable in this mock build</div>
                <p className="mt-2 max-w-[420px] text-[13px] leading-6 text-white/48">
                  The attachment opens inside SiteThread when a real file is available. For seeded mock attachments, we show the file card and metadata in the same dark UI style.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] px-6 py-4">
          <div className="text-[11px] text-white/30">Attachment preview</div>
          {attachment.url ? (
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/[0.08] bg-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white/72 transition hover:bg-white/[0.12]"
            >
              Open full file
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
