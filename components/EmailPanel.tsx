'use client';

import { useState } from 'react';
import AttachmentChip from '@/components/AttachmentChip';
import AttachmentViewerModal from '@/components/AttachmentViewerModal';
import Avatar from '@/components/Avatar';
import type { Attachment, InboxItem, Site, UnmatchedEmail } from '@/lib/types';

type EmailPanelProps = {
  item: InboxItem;
  email: UnmatchedEmail;
  linkedSite: Site | null;
  onClose: () => void;
  onOpenReview: () => void;
  onOpenLinkedSite: (siteId: string) => void;
};

export default function EmailPanel({ item, email, linkedSite, onClose, onOpenReview, onOpenLinkedSite }: EmailPanelProps) {
  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null);
  const gmailHref = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email.gmailQuery ?? `${email.from} ${email.subject}`)}`;

  return (
    <>
      <aside
        style={{ width: 'clamp(360px, 30vw, 420px)' }}
        className="absolute right-4 top-4 z-[1200] flex h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[28px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(10,14,21,0.86),rgba(8,11,18,0.82))] text-white shadow-[0_30px_84px_rgba(2,8,20,0.34),0_10px_32px_rgba(2,8,20,0.18)] backdrop-blur-[34px] animate-fadeUp"
      >
        <div className="border-b border-white/[0.08] bg-white/[0.015] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[26px] font-bold tracking-tight text-white">{email.subject}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/58">
                <span>{email.from}</span>
                <span>· {email.date}</span>
                <span>· {item.state === 'link-site' ? 'Link site' : linkedSite ? 'Linked' : email.source === 'gmail' ? 'Gmail' : 'Email view'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-sm text-white/70 transition hover:bg-white/[0.11]"
              aria-label="Close email panel"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-b border-white/[0.08] bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar initials={email.initials} size={30} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">{email.from}</div>
              <div className="truncate text-[12px] text-white/48">{email.senderEmail ?? 'Linked through Gmail'}</div>
            </div>
            <div className="text-[11px] text-white/30">{email.date}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[22px] border border-white/[0.05] bg-white/[0.12] px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
            <div className="flex gap-3">
              <Avatar initials={email.initials} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-white">{email.from}</div>
                    <div className="mt-0.5 text-[11px] text-white/34">{email.date}</div>
                  </div>
                  {item.state === 'link-site' ? <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400/90" /> : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-white/86">{email.body}</p>
                {email.attachments?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {email.attachments.map((attachment, index) => (
                      <AttachmentChip key={`${attachment.name}-${attachment.url ?? index}`} attachment={attachment} onOpen={setViewerAttachment} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-white/[0.08] bg-white/[0.03] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {linkedSite ? (
              <button
                type="button"
                onClick={() => onOpenLinkedSite(linkedSite.id)}
                className="rounded-xl bg-sky-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-float transition hover:bg-sky-400"
              >
                Open linked site
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenReview}
                className="rounded-xl bg-sky-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-float transition hover:bg-sky-400"
              >
                Link site
              </button>
            )}

            <a
              href={gmailHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/[0.08] bg-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white/72 transition hover:bg-white/[0.12]"
            >
              Open in Gmail
            </a>
          </div>
        </div>
      </aside>
      {viewerAttachment ? <AttachmentViewerModal attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} /> : null}
    </>
  );
}
