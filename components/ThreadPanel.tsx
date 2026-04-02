'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AttachmentChip from '@/components/AttachmentChip';
import AttachmentViewerModal from '@/components/AttachmentViewerModal';
import Avatar from '@/components/Avatar';
import type { Message, Site, Thread, Attachment } from '@/lib/types';

type ThreadPanelProps = {
  site: Site;
  focusedThreadId?: string | null;
  focusedMessageId?: string | null;
  onClose: () => void;
  onOpenCompose: (siteId: string | null) => void;
  onOpenReply: (siteId: string, threadId: string) => void;
};

function ThreadSelector({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  const unread = thread.messages.filter((message) => message.unread).length;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[160px] max-w-[196px] rounded-2xl border px-3.5 py-2.5 text-left transition ${
        active
          ? 'border-white/[0.06] bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.14)]'
          : 'border-white/[0.02] bg-white/[0.05] text-white/58 hover:bg-white/[0.075]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-[12px] font-semibold tracking-tight">{thread.subject}</div>
        {unread > 0 ? (
          <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff453a] px-1.5 text-[10px] font-bold text-white">
            {unread}
          </div>
        ) : null}
      </div>
      <div className="mt-1 truncate text-[11px] text-white/38">{thread.lastDate}</div>
    </button>
  );
}

function toChronological(messages: Message[]) {
  return [...messages].reverse();
}

export default function ThreadPanel({ site, focusedThreadId, focusedMessageId, onClose, onOpenCompose, onOpenReply }: ThreadPanelProps) {
  const [tab, setTab] = useState<'conversation' | 'timeline'>('conversation');
  const [activeThreadId, setActiveThreadId] = useState(site.threads[0]?.id ?? '');
  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null);
  const selectorScrollRef = useRef<HTMLDivElement | null>(null);
  const selectorItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activeThread = useMemo(
    () => site.threads.find((thread) => thread.id === activeThreadId) ?? site.threads[0] ?? null,
    [site.threads, activeThreadId],
  );

  const orderedMessages = useMemo(() => (activeThread ? toChronological(activeThread.messages) : []), [activeThread]);

  useEffect(() => {
    const nextThreadId =
      (focusedThreadId && site.threads.some((thread) => thread.id === focusedThreadId) ? focusedThreadId : null) ??
      site.threads[0]?.id ??
      '';

    setTab('conversation');
    setActiveThreadId(nextThreadId);
  }, [site.id, site.threads, focusedThreadId]);

  useEffect(() => {
    const activeElement = selectorItemRefs.current[activeThreadId];
    activeElement?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeThreadId]);

  useEffect(() => {
    if (!focusedMessageId) return;
    const messageNode = messageRefs.current[focusedMessageId];
    messageNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusedMessageId, activeThreadId]);

  useEffect(() => {
    const el = selectorScrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [site.id, site.threads.length, tab]);

  const scrollSelectors = (direction: 'left' | 'right') => {
    const el = selectorScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'right' ? 220 : -220, behavior: 'smooth' });
  };

  const gmailHref = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(site.address)}`;
  const hasThreads = site.threads.length > 0 && !!activeThread;

  return (
    <>
      <aside
        style={{ width: 'clamp(360px, 30vw, 420px)' }}
        className="absolute right-4 top-4 z-[1200] flex h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[28px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(10,14,21,0.86),rgba(8,11,18,0.82))] text-white shadow-[0_30px_84px_rgba(2,8,20,0.34),0_10px_32px_rgba(2,8,20,0.18)] backdrop-blur-[34px] animate-fadeUp"
      >
        <div className="border-b border-white/[0.08] bg-white/[0.015] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[28px] font-bold tracking-tight text-white">{site.address}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/58">
                <span>{site.city}</span>
                {site.unit ? <span>· {site.unit}</span> : null}
                <span>· {site.threads.length} threads</span>
                <span>· {site.threads.reduce((count, thread) => count + thread.messages.length, 0)} messages</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenCompose(site.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.09] text-white/82 transition hover:bg-white/[0.13]"
                aria-label="Compose for selected site"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-sm text-white/70 transition hover:bg-white/[0.11]"
                aria-label="Close site panel"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 flex min-w-0 rounded-[22px] border border-white/[0.06] bg-white/[0.035] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-2xl">
          {(['conversation', 'timeline'] as const).map((option) => {
            const active = tab === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setTab(option)}
                className={`flex-1 rounded-[16px] px-4 py-3 text-left transition ${
                  active ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-white/46 hover:bg-white/[0.05]'
                }`}
              >
                <div className="text-[13px] font-semibold tracking-tight capitalize">{option}</div>
                <div className="mt-1 text-[11px] text-white/38">
                  {option === 'conversation' ? activeThread?.subject ?? 'No linked thread yet' : `${site.threads.length} threads at this site`}
                </div>
              </button>
            );
          })}
        </div>

        {tab === 'conversation' ? (
          hasThreads ? (
            <>
              <div className="relative border-b border-white/[0.08] bg-white/[0.025] px-4 py-3">
                {canScrollLeft ? (
                  <button
                    type="button"
                    onClick={() => scrollSelectors('left')}
                    className="absolute left-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.05] bg-[rgba(8,11,18,0.78)] text-white/70 backdrop-blur-xl transition hover:bg-[rgba(12,16,24,0.92)]"
                    aria-label="Scroll quick timeline left"
                  >
                    ‹
                  </button>
                ) : null}
                {canScrollRight ? (
                  <button
                    type="button"
                    onClick={() => scrollSelectors('right')}
                    className="absolute right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.05] bg-[rgba(8,11,18,0.78)] text-white/70 backdrop-blur-xl transition hover:bg-[rgba(12,16,24,0.92)]"
                    aria-label="Scroll quick timeline right"
                  >
                    ›
                  </button>
                ) : null}
                <div ref={selectorScrollRef} className="flex gap-2 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {site.threads.map((thread) => (
                    <div
                      key={thread.id}
                      ref={(node) => {
                        selectorItemRefs.current[thread.id] = node;
                      }}
                      className="shrink-0"
                    >
                      <ThreadSelector thread={thread} active={thread.id === activeThread?.id} onClick={() => setActiveThreadId(thread.id)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b border-white/[0.08] bg-white/[0.02] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={activeThread?.initials ?? 'ME'} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white">{activeThread?.sender ?? 'No linked sender'}</div>
                    <div className="truncate text-[12px] text-white/48">{activeThread?.company ?? 'Link a site email to begin'}</div>
                  </div>
                  <div className="text-[11px] text-white/30">{activeThread?.lastDate ?? ''}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-3">
                  {orderedMessages.map((message) => {
                    const fromYou = message.from === 'You';
                    const selectedMessage = focusedMessageId === message.id;
                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          messageRefs.current[message.id] = node;
                        }}
                        className={`rounded-[22px] border px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.14)] transition ${
                          selectedMessage
                            ? 'border-sky-300/40 bg-white/[0.18]'
                            : message.unread && !fromYou
                              ? 'border-white/[0.05] bg-white/[0.14]'
                              : 'border-white/[0.05] bg-white/[0.12]'
                        }`}
                      >
                        <div className="flex gap-3">
                          <Avatar initials={message.initials} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[13px] font-semibold text-white">{fromYou ? 'You' : message.from}</div>
                                <div className="mt-0.5 text-[11px] text-white/34">{message.date}</div>
                              </div>
                              {message.unread && !fromYou ? <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400/90" /> : null}
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-white/86">{message.body}</p>
                            {message.attachments && message.attachments.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.attachments.map((attachment, index) => (
                                  <AttachmentChip key={`${attachment.name}-${attachment.url ?? index}`} attachment={attachment} onOpen={setViewerAttachment} />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-10">
              <div className="max-w-[280px] rounded-[24px] border border-white/[0.05] bg-white/[0.08] px-5 py-6 text-center">
                <div className="text-[16px] font-semibold text-white">No linked thread yet</div>
                <p className="mt-2 text-[12px] leading-5 text-white/50">Link or drag an email into this site to build the first conversation timeline.</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">All threads · oldest to newest</div>
            <div className="relative space-y-3 pl-7">
              <div className="absolute left-[13px] top-1 h-[calc(100%-8px)] w-px bg-white/10" />
              {[...site.threads].reverse().map((thread) => {
                const unread = thread.messages.filter((message) => message.unread).length;
                const active = thread.id === activeThread?.id;
                return (
                  <div key={thread.id} className="relative">
                    <div
                      className={`absolute left-[-24px] top-5 h-3.5 w-3.5 rounded-full border-2 ${
                        active ? 'border-white/50 bg-white/60 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]' : 'border-white/20 bg-white/[0.08]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveThreadId(thread.id);
                        setTab('conversation');
                      }}
                      className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
                        active ? 'border-white/[0.06] bg-white/[0.11]' : 'border-white/[0.05] bg-white/[0.07] hover:bg-white/[0.09]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar initials={thread.initials} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="truncate text-[13px] font-semibold text-white">{thread.subject}</div>
                            <div className="shrink-0 text-[11px] text-white/34">{thread.lastDate}</div>
                          </div>
                          <div className="mt-1 text-[12px] text-white/46">{thread.sender} · {thread.company}</div>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-white/60">{thread.messages[0]?.body}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <div className="text-white/34">{thread.messages.length} messages</div>
                        <div className="flex items-center gap-2">
                          {unread > 0 ? (
                            <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff453a] px-1.5 text-[10px] font-bold text-white">
                              {unread}
                            </div>
                          ) : null}
                          <div className="font-semibold text-white/70">Open →</div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-white/[0.08] bg-white/[0.03] px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => activeThread && onOpenReply(site.id, activeThread.id)}
              className="rounded-xl bg-sky-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-float transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/34"
              disabled={!activeThread}
            >
              Reply to selected thread
            </button>
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
