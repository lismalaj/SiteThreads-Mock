'use client';

import { useMemo, useState } from 'react';
import Avatar from '@/components/Avatar';
import type { InboxItem, Site } from '@/lib/types';

type LinkSitePanelProps = {
  items: InboxItem[];
  sites: Site[];
  selectedSiteId: string | null;
  onClose: () => void;
  onAssign: (itemId: string, siteId: string) => void;
  onOpenInboxItem: (itemId: string) => void;
};

export type LinkedUnmatchedEntry = {
  emailId: string;
  siteId: string;
  linkedAtLabel: string;
};

function LinkRow({
  item,
  sites,
  defaultSiteId,
  buttonLabel,
  onAssign,
  onOpen,
}: {
  item: InboxItem;
  sites: Site[];
  defaultSiteId: string;
  buttonLabel: string;
  onAssign: (siteId: string) => void;
  onOpen: () => void;
}) {
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId);

  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.08] px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar initials={item.initials} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={onOpen} className="min-w-0 text-left">
              <div className="truncate text-[13px] font-semibold text-white">{item.sender}</div>
              <div className="mt-1 truncate text-[12px] text-white/42">{item.subject}</div>
            </button>
            <div className="text-[11px] text-white/34">{item.dateLabel}</div>
          </div>
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-white/58">{item.preview}</p>
          {item.linkedSiteLabel ? <div className="mt-2 text-[11px] text-white/38">Current · {item.linkedSiteLabel}</div> : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={selectedSiteId}
          onChange={(event) => setSelectedSiteId(event.target.value)}
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.08] px-3 py-2 text-[12px] text-white outline-none"
        >
          <option value="" className="text-black">Choose a site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id} className="text-black">
              {site.address}
              {site.unit ? ` · ${site.unit}` : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedSiteId}
          onClick={() => selectedSiteId && onAssign(selectedSiteId)}
          className="rounded-xl bg-sky-500 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/34"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default function UnmatchedPanel({ items, sites, selectedSiteId, onClose, onAssign, onOpenInboxItem }: LinkSitePanelProps) {
  const unmatchedItems = useMemo(() => items.filter((item) => item.kind === 'unmatched' && item.state === 'link-site'), [items]);
  const linkedItems = useMemo(() => items.filter((item) => item.kind === 'message' || item.state === 'linked-local'), [items]);

  return (
    <div className="w-[340px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,19,28,0.82),rgba(10,13,20,0.78))] text-white shadow-panel backdrop-blur-[28px] animate-fadeUp">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/55">Link site</div>
          <div className="mt-1 text-[12px] text-white/48">Assign unmatched mail or move linked mail between sites.</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-sm text-white/54 transition hover:bg-white/[0.12]"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[440px] overflow-y-auto px-4 py-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Unmatched · {unmatchedItems.length}</div>
        <div className="space-y-3">
          {unmatchedItems.length ? (
            unmatchedItems.map((item) => (
              <LinkRow
                key={item.id}
                item={item}
                sites={sites}
                defaultSiteId={selectedSiteId ?? ''}
                buttonLabel="Link"
                onAssign={(siteId) => onAssign(item.id, siteId)}
                onOpen={() => onOpenInboxItem(item.id)}
              />
            ))
          ) : (
            <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.05] px-4 py-4 text-[12px] text-white/52">No unmatched emails right now.</div>
          )}
        </div>

        <div className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Linked emails · {linkedItems.length}</div>
        <div className="space-y-3">
          {linkedItems.slice(0, 18).map((item) => (
            <LinkRow
              key={item.id}
              item={item}
              sites={sites}
              defaultSiteId={item.linkedSiteId ?? selectedSiteId ?? ''}
              buttonLabel="Move"
              onAssign={(siteId) => onAssign(item.id, siteId)}
              onOpen={() => onOpenInboxItem(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
