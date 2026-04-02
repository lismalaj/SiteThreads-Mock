'use client';

import type { DragEvent } from 'react';
import Avatar from '@/components/Avatar';
import type { InboxItem } from '@/lib/types';

type LeftRailProps = {
  inboxItems: InboxItem[];
  selectedInboxId: string | null;
  reviewCount: number;
  reviewOpen: boolean;
  gmailConnected: boolean;
  gmailEmail: string | null;
  gmailSyncing: boolean;
  onSelectInboxItem: (itemId: string) => void;
  onOpenCompose: (siteId: string | null) => void;
  onToggleReview: () => void;
  onDragStartItem: (itemId: string) => void;
  onDragEndItem: () => void;
  onConnectGmail: () => void;
  onSyncGmail: () => void;
  onDisconnectGmail: () => void;
};

function StateBadge({ item }: { item: InboxItem }) {
  if (item.state === 'link-site') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
        <span>{item.kind === 'unmatched' ? 'Link site' : 'Inbox'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        item.state === 'linked-local'
          ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-700'
          : 'border border-sky-200/80 bg-sky-50 text-sky-700'
      }`}
    >
      <span>{item.state === 'linked-local' ? 'Linked' : 'Site'}</span>
      {item.linkedSiteLabel ? <span className="max-w-[86px] truncate">{item.linkedSiteLabel}</span> : null}
    </span>
  );
}

function attachDragPreview(event: DragEvent<HTMLButtonElement>, item: InboxItem) {
  const preview = document.createElement('div');
  preview.style.position = 'fixed';
  preview.style.top = '-1000px';
  preview.style.left = '-1000px';
  preview.style.padding = '10px 14px';
  preview.style.borderRadius = '18px';
  preview.style.background = 'linear-gradient(180deg, rgba(15,19,28,0.92), rgba(10,13,20,0.9))';
  preview.style.border = '1px solid rgba(255,255,255,0.12)';
  preview.style.backdropFilter = 'blur(18px)';
  preview.style.color = 'white';
  preview.style.boxShadow = '0 18px 40px rgba(2,8,20,0.28)';
  preview.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
  preview.style.maxWidth = '220px';
  preview.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="width:28px;height:28px;border-radius:9999px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:14px;">✉︎</div>
      <div style="min-width:0;">
        <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.subject}</div>
        <div style="margin-top:2px;font-size:11px;color:rgba(255,255,255,0.56);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.sender}</div>
      </div>
    </div>
  `;
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 28, 18);
  window.setTimeout(() => preview.remove(), 0);
}

export default function LeftRail({
  inboxItems,
  selectedInboxId,
  reviewCount,
  reviewOpen,
  gmailConnected,
  gmailEmail,
  gmailSyncing,
  onSelectInboxItem,
  onOpenCompose,
  onToggleReview,
  onDragStartItem,
  onDragEndItem,
  onConnectGmail,
  onSyncGmail,
  onDisconnectGmail,
}: LeftRailProps) {
  return (
    <aside
      style={{ width: 'clamp(244px, 18vw, 292px)' }}
      className="relative flex h-full shrink-0 flex-col border-r border-black/10 bg-white/80 backdrop-blur-2xl"
    >
      <div className="border-b border-black/6 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-xl shadow-[0_16px_36px_rgba(249,115,22,0.24)]">📍</div>
          <div>
            <div className="text-[14px] font-semibold tracking-tight text-[#1c1c1e]">SiteThread</div>
            <div className="mt-1 text-[11px] text-[#8e8e93]">Contractor inbox map</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <button
          type="button"
          onClick={() => onOpenCompose(null)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a9be9] px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_18px_32px_rgba(10,155,233,0.28)] transition hover:bg-[#0991d9]"
        >
          <span>✎</span>
          <span>New Email</span>
        </button>

        <div className="rounded-[20px] border border-black/[0.06] bg-black/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b7b82]">Gmail</div>
              <div className="mt-1 text-[12px] font-medium text-[#1c1c1e]">
                {gmailConnected ? gmailEmail ?? 'Connected' : 'Not connected'}
              </div>
            </div>
            {gmailConnected ? (
              <button
                type="button"
                onClick={onDisconnectGmail}
                className="rounded-full border border-black/[0.06] bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-[#6d6d74] transition hover:bg-white"
              >
                Disconnect
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {gmailConnected ? (
              <button
                type="button"
                onClick={onSyncGmail}
                disabled={gmailSyncing}
                className="flex-1 rounded-xl bg-[#111827] px-3 py-2.5 text-[12px] font-semibold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60"
              >
                {gmailSyncing ? 'Syncing…' : 'Sync Gmail'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectGmail}
                className="flex-1 rounded-xl bg-[#111827] px-3 py-2.5 text-[12px] font-semibold text-white transition hover:bg-black"
              >
                Connect Gmail
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b7b82]">Inbox · {inboxItems.length}</div>
        <button
          type="button"
          onClick={onToggleReview}
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
            reviewOpen
              ? 'border-orange-300/80 bg-orange-50 text-orange-700'
              : 'border-black/8 bg-black/[0.03] text-[#6d6d74] hover:bg-black/[0.05]'
          }`}
        >
          <span>Link site</span>
          {reviewCount > 0 ? <span className="rounded-full bg-orange-500/12 px-1.5 py-0.5 text-[10px] text-orange-600">{reviewCount}</span> : null}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {inboxItems.map((item) => {
          const selected = selectedInboxId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', item.id);
                attachDragPreview(event, item);
                onDragStartItem(item.id);
              }}
              onDragEnd={onDragEndItem}
              onClick={() => onSelectInboxItem(item.id)}
              className={`flex w-full items-start gap-3 border-l-[3px] px-5 py-4 text-left transition ${
                selected ? 'border-[#0a84ff] bg-sky-50/80' : 'border-transparent hover:bg-black/[0.025]'
              }`}
            >
              <Avatar initials={item.initials} size={36} />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold tracking-tight text-[#1c1c1e]">{item.sender}</div>
                    <div className="mt-1 truncate text-[12px] font-medium text-[#3c3c43]">{item.subject}</div>
                  </div>
                  <div className="shrink-0 text-[10.5px] text-[#8e8e93]">{item.dateLabel}</div>
                </div>

                <div className="mt-1 truncate text-[12px] text-[#8e8e93]">{item.preview}</div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <StateBadge item={item} />
                  {item.unread > 0 ? (
                    <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0a84ff] px-1.5 text-[10px] font-bold text-white">
                      {item.unread}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
