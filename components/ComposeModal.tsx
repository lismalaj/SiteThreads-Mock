'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AttachmentChip from '@/components/AttachmentChip';
import AttachmentViewerModal from '@/components/AttachmentViewerModal';
import Avatar from '@/components/Avatar';
import type { Attachment, Site, Thread } from '@/lib/types';

export type ComposeMode = 'new' | 'reply';

export type ComposePayload = {
  siteId?: string;
  threadId?: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
};

type ComposeModalProps = {
  mode: ComposeMode;
  site: Site | null;
  thread?: Thread | null;
  sites: Site[];
  onClose: () => void;
  onSend: (payload: ComposePayload) => Promise<void>;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the selected file.'));
    };
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function attachmentTypeFromFile(file: File): Attachment['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'other';
}

export default function ComposeModal({ mode, site, thread, sites, onClose, onSend }: ComposeModalProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(site?.id ?? '');
  const [to, setTo] = useState(thread?.senderEmail ?? '');
  const [subject, setSubject] = useState(thread ? `Re: ${thread.subject}` : site ? `Re: ${site.short}` : '');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSite = useMemo(
    () => sites.find((candidate) => candidate.id === selectedSiteId) ?? null,
    [selectedSiteId, sites],
  );

  const knownContacts = useMemo(() => {
    if (!selectedSite) return [];

    const unique = new Map<string, { name: string; email: string; initials: string }>();
    selectedSite.threads.forEach((candidateThread) => {
      if (!unique.has(candidateThread.senderEmail)) {
        unique.set(candidateThread.senderEmail, {
          name: candidateThread.sender,
          email: candidateThread.senderEmail,
          initials: candidateThread.initials,
        });
      }
    });

    return [...unique.values()];
  }, [selectedSite]);

  useEffect(() => {
    if (toInputRef.current) toInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (mode === 'reply' && thread) {
      setSelectedSiteId(site?.id ?? '');
      setTo(thread.senderEmail);
      setSubject(`Re: ${thread.subject}`);
      return;
    }

    if (!to && knownContacts.length > 0) {
      setTo(knownContacts[0].email);
    }
  }, [knownContacts, mode, site?.id, thread, to]);
  const canSend = to.trim().length > 0 && body.trim().length > 0 && !sending;
  const title = mode === 'reply' ? 'Reply to thread' : 'New Email';
  const subtitle =
    mode === 'reply'
      ? 'Send through the selected site thread.'
      : 'Create a new site-aware message from inside SiteThread.';

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);

    try {
      await onSend({
        siteId: selectedSite?.id,
        threadId: mode === 'reply' ? thread?.id : undefined,
        to,
        subject,
        body,
        attachments,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the mock request.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const nextAttachments = await Promise.all(
      [...files].map(async (file) => ({
        name: file.name,
        type: attachmentTypeFromFile(file),
        size: formatFileSize(file.size),
        url: await fileToDataUrl(file),
        mimeType: file.type,
      } satisfies Attachment)),
    );
    setAttachments((current) => [...current, ...nextAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (attachment: Attachment) => {
    setAttachments((current) => current.filter((entry) => !(entry.name === attachment.name && entry.url === attachment.url)));
  };

  const fieldShell =
    'rounded-[18px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 text-[14px] text-white/90 outline-none transition focus-within:border-white/[0.12] focus-within:bg-white/[0.08]';

  return (
    <>
      <div
        className="fixed inset-0 z-[1300] flex items-center justify-center bg-[rgba(3,6,12,0.48)] backdrop-blur-md"
        onClick={(event) => {
          if (event.target === event.currentTarget && !sending) onClose();
        }}
      >
        <div className="w-[500px] max-w-[94vw] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,14,21,0.92),rgba(8,11,18,0.9))] text-white shadow-[0_30px_84px_rgba(2,8,20,0.42),0_10px_32px_rgba(2,8,20,0.24)] backdrop-blur-[34px] animate-fadeUp">
          <div className="flex items-start justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-4">
            <div>
              <h2 className="text-[19px] font-bold tracking-tight text-white">{title}</h2>
              <p className="mt-1 text-[12px] text-white/46">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-sm text-white/48 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close compose modal"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            {selectedSite ? (
              <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-[12px] text-white/78">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Site context</div>
                <div className="mt-2 font-medium text-white">
                  {selectedSite.address}
                  {selectedSite.unit ? ` · ${selectedSite.unit}` : ''}
                </div>
                {mode === 'reply' && thread ? <div className="mt-1 text-white/46">Thread: {thread.subject}</div> : null}
              </div>
            ) : null}

            {mode === 'new' ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">
                  Site context
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(event) => {
                    const nextSiteId = event.target.value;
                    setSelectedSiteId(nextSiteId);
                    const picked = sites.find((candidate) => candidate.id === nextSiteId);
                    if (picked && (!subject || subject === `Re: ${selectedSite?.short ?? ''}`)) {
                      setSubject(`Re: ${picked.short}`);
                    }
                  }}
                  className="w-full rounded-[18px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 text-[14px] text-white outline-none transition focus:border-white/[0.12] focus:bg-white/[0.08]"
                >
                  <option value="" className="text-black">No site selected</option>
                  {sites.map((candidate) => (
                    <option key={candidate.id} value={candidate.id} className="text-black">
                      {candidate.address}
                      {candidate.unit ? ` · ${candidate.unit}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {mode === 'new' && knownContacts.length > 0 ? (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Recent contacts</div>
                <div className="flex flex-wrap gap-2">
                  {knownContacts.map((contact) => (
                    <button
                      key={contact.email}
                      type="button"
                      onClick={() => setTo(contact.email)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-white/78 transition hover:bg-white/[0.1]"
                    >
                      <Avatar initials={contact.initials} size={22} />
                      <span>{contact.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${fieldShell}`}>
                <span className="w-12 shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">To</span>
                <input
                  ref={toInputRef}
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="email@example.com"
                  className="w-full border-none bg-transparent text-[14px] text-white placeholder:text-white/28 outline-none"
                />
              </div>
              <div className={`flex items-center gap-3 ${fieldShell}`}>
                <span className="w-12 shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Subject</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  className="w-full border-none bg-transparent text-[14px] text-white placeholder:text-white/28 outline-none"
                />
              </div>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={mode === 'reply' ? 'Write your reply…' : 'Write your message…'}
                rows={8}
                className="w-full resize-none rounded-[22px] border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-[14px] leading-6 text-white placeholder:text-white/28 outline-none transition focus:border-white/[0.12] focus:bg-white/[0.08]"
              />
            </div>

            <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.05] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Attachments</div>
                  <div className="mt-1 text-[12px] text-white/42">Add files without leaving SiteThread.</div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.08] px-3.5 py-2 text-[12px] font-semibold text-white/76 transition hover:bg-white/[0.12]"
                >
                  + Add attachment
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => handleAttachFiles(event.target.files)}
                />
              </div>
              {attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <AttachmentChip
                      key={`${attachment.name}-${attachment.url ?? index}`}
                      attachment={attachment}
                      onOpen={setViewerAttachment}
                      onRemove={removeAttachment}
                      removable
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[16px] border border-dashed border-white/[0.08] px-3 py-4 text-[12px] text-white/32">
                  No attachments yet.
                </div>
              )}
            </div>

            {error ? <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-3.5 py-3 text-[12px] text-rose-100">{error}</div> : null}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] px-5 py-4">
            <div className="text-[11px] text-white/30">
              {mode === 'reply' ? 'Reply route: /api/send/reply' : 'Compose route: /api/send/new'}
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex min-w-[118px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(14,165,233,0.35)] transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/28 disabled:shadow-none"
            >
              {sending ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  <span>Sending…</span>
                </>
              ) : (
                <span>{mode === 'reply' ? 'Send reply' : 'Send email'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
      {viewerAttachment ? <AttachmentViewerModal attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} /> : null}
    </>
  );
}
