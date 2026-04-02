'use client';

import { useEffect, useMemo, useState } from 'react';
import ComposeModal, { type ComposeMode, type ComposePayload } from '@/components/ComposeModal';
import CreateSiteModal from '@/components/CreateSiteModal';
import EmailPanel from '@/components/EmailPanel';
import LeftRail from '@/components/LeftRail';
import MapView from '@/components/MapView';
import ThreadPanel from '@/components/ThreadPanel';
import SendLogPanel, { type ActivityNote, type SendLogEntry } from '@/components/SendLogPanel';
import UnmatchedPanel from '@/components/UnmatchedPanel';
import { SITES, UNMATCHED } from '@/lib/data';
import { sortedSites } from '@/lib/map';
import type { InboxItem, Message, Site, Thread, UnmatchedEmail } from '@/lib/types';
import type { SendApiResponse } from '@/lib/mail';

const APP_STATE_STORAGE_KEY = 'sitethread:app-state';
const SEND_LOG_STORAGE_KEY = 'sitethread:mock-send-log';
const PROMOTED_UNMATCHED_STORAGE_KEY = 'sitethread:promoted-unmatched';
const SITES_STATE_STORAGE_KEY = 'sitethread:sites-state';
const DETACHED_EMAILS_STORAGE_KEY = 'sitethread:detached-emails';
const FEED_WINDOW_DAYS = 180;
const ACTIVITY_NOTE_TIMEOUT_MS = 2200;

type ComposeState = {
  open: boolean;
  mode: ComposeMode;
  siteId: string | null;
  threadId: string | null;
};

type PendingCreateSite = {
  itemId: string;
  lat: number;
  lng: number;
} | null;

type PromotedUnmatchedEntry = {
  emailId: string;
  siteId: string;
  linkedAtLabel: string;
};

function isSendLogEntry(value: unknown): value is SendLogEntry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    (candidate.mode === 'new' || candidate.mode === 'reply') &&
    typeof candidate.siteLabel === 'string' &&
    typeof candidate.to === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.sentAtLabel === 'string'
  );
}

function isPromotedUnmatchedEntry(value: unknown): value is PromotedUnmatchedEntry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.emailId === 'string' && typeof candidate.siteId === 'string' && typeof candidate.linkedAtLabel === 'string';
}


type PersistedAppState = {
  version: 2;
  sendLog: SendLogEntry[];
  promotedUnmatched: PromotedUnmatchedEntry[];
  sitesState: Site[];
  detachedEmails: UnmatchedEmail[];
  selectedSiteId: string | null;
  focusedThreadId: string | null;
  focusedMessageId: string | null;
  selectedInboxId: string | null;
  selectedDetachedEmailId: string | null;
};

function isPersistedAppState(value: unknown): value is PersistedAppState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 2 &&
    Array.isArray(candidate.sendLog) &&
    candidate.sendLog.every(isSendLogEntry) &&
    Array.isArray(candidate.promotedUnmatched) &&
    candidate.promotedUnmatched.every(isPromotedUnmatchedEntry) &&
    Array.isArray(candidate.sitesState) &&
    candidate.sitesState.every(isSite) &&
    Array.isArray(candidate.detachedEmails) &&
    candidate.detachedEmails.every(isUnmatchedEmail)
  );
}


function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.from === 'string' &&
    typeof candidate.initials === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.unread === 'boolean' &&
    typeof candidate.body === 'string'
  );
}

function isThread(value: unknown): value is Thread {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.sender === 'string' &&
    typeof candidate.senderEmail === 'string' &&
    typeof candidate.initials === 'string' &&
    typeof candidate.company === 'string' &&
    typeof candidate.lastDate === 'string' &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(isMessage)
  );
}


function isUnmatchedEmail(value: unknown): value is UnmatchedEmail {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.from === 'string' &&
    typeof candidate.initials === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.preview === 'string' &&
    typeof candidate.body === 'string'
  );
}

function isSite(value: unknown): value is Site {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.address === 'string' &&
    typeof candidate.short === 'string' &&
    typeof candidate.city === 'string' &&
    typeof candidate.lat === 'number' &&
    typeof candidate.lng === 'number' &&
    Array.isArray(candidate.threads) &&
    candidate.threads.every(isThread)
  );
}

function cloneBaseSites() {
  return structuredClone(SITES);
}

function cloneDetachedEmails() {
  return structuredClone(UNMATCHED);
}

function timeStamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function messageDateLabel(date = new Date()) {
  return `Today, ${timeStamp(date)}`;
}

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'ME'
  );
}

function deriveContactForNewThread(site: Site, to: string) {
  const knownThread = site.threads.find((thread) => thread.senderEmail.toLowerCase() === to.toLowerCase());
  if (knownThread) {
    return {
      sender: knownThread.sender,
      senderEmail: knownThread.senderEmail,
      initials: knownThread.initials,
      company: knownThread.company,
    };
  }

  const localPart = to.split('@')[0] ?? to;
  const fallbackName = localPart
    .split(/[._-]+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
    .trim();

  return {
    sender: fallbackName || to,
    senderEmail: to,
    initials: initialsFromName(fallbackName || to),
    company: 'New contact',
  };
}

function parseDateLabel(label: string) {
  const now = new Date();
  const normalized = label.trim();
  const lower = normalized.toLowerCase();

  if (lower === 'just now') return now.getTime();

  const hoursMatch = lower.match(/^(\d+)h ago$/);
  if (hoursMatch) return now.getTime() - Number(hoursMatch[1]) * 60 * 60 * 1000;

  const daysMatch = lower.match(/^(\d+)d ago$/);
  if (daysMatch) return now.getTime() - Number(daysMatch[1]) * 24 * 60 * 60 * 1000;

  const weeksMatch = lower.match(/^(\d+)w ago$/);
  if (weeksMatch) return now.getTime() - Number(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1000;

  const todayMatch = normalized.match(/^Today,\s*(.+)$/i);
  if (todayMatch) return new Date(`${now.toDateString()} ${todayMatch[1]}`).getTime();

  const yesterdayMatch = normalized.match(/^Yesterday(?:,\s*(.+))?$/i);
  if (yesterdayMatch) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const timePart = yesterdayMatch[1] ?? '12:00 PM';
    return new Date(`${yesterday.toDateString()} ${timePart}`).getTime();
  }

  const parsed = new Date(`${normalized} 2026`).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function deriveShortLabel(address: string) {
  return address
    .replace(/\bStreet\b/i, 'St')
    .replace(/\bAvenue\b/i, 'Ave')
    .replace(/\bBoulevard\b/i, 'Blvd')
    .replace(/\bDrive\b/i, 'Dr')
    .replace(/\bLane\b/i, 'Ln')
    .replace(/\bCourt\b/i, 'Ct')
    .replace(/\bPlace\b/i, 'Pl')
    .replace(/\bRoad\b/i, 'Rd');
}


function buildPromotedThread(detachedEmails: UnmatchedEmail[], emailId: string) {
  const email = detachedEmails.find((entry) => entry.id === emailId) ?? null;
  if (!email) return null;

  return {
    id: `promoted-${email.id}-thread`,
    subject: email.subject,
    sender: email.from,
    senderEmail: email.senderEmail ?? '',
    initials: email.initials,
    company: 'Linked from inbox',
    lastDate: email.date,
    messages: [
      {
        id: `promoted-${email.id}-message`,
        from: email.from,
        initials: email.initials,
        date: email.date,
        unread: false,
        body: email.body,
        attachments: email.attachments,
      },
    ],
  } as Thread;
}

function applyPromotedUnmatched(baseSites: Site[], detachedEmails: UnmatchedEmail[], promoted: PromotedUnmatchedEntry[]) {
  if (!promoted.length) return baseSites;

  return baseSites.map((site) => {
    const additions = promoted
      .filter((entry) => entry.siteId === site.id)
      .map((entry) => buildPromotedThread(detachedEmails, entry.emailId))
      .filter((thread): thread is Thread => !!thread)
      .filter((thread) => !site.threads.some((existing) => existing.id === thread.id));

    return additions.length ? { ...site, threads: [...additions, ...site.threads] } : site;
  });
}

function moveThreadBetweenSites(sites: Site[], fromSiteId: string, threadId: string, toSiteId: string) {
  if (fromSiteId === toSiteId) return sites;
  let movingThread: Thread | null = null;

  const strippedSites = sites.map((site) => {
    if (site.id !== fromSiteId) return site;
    const thread = site.threads.find((entry) => entry.id === threadId) ?? null;
    if (!thread) return site;
    movingThread = thread;
    return { ...site, threads: site.threads.filter((entry) => entry.id !== threadId) };
  });

  if (!movingThread) return sites;

  return strippedSites.map((site) => (site.id === toSiteId ? { ...site, threads: [movingThread!, ...site.threads] } : site));
}

export default function AppShell() {
  const [promotedUnmatched, setPromotedUnmatched] = useState<PromotedUnmatchedEntry[]>([]);
  const [sitesState, setSitesState] = useState<Site[]>(() => cloneBaseSites());
  const [detachedEmails, setDetachedEmails] = useState<UnmatchedEmail[]>(() => cloneDetachedEmails());
  const orderedSites = useMemo(() => sortedSites(sitesState), [sitesState]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(SITES[0]?.id ?? null);
  const [focusedThreadId, setFocusedThreadId] = useState<string | null>(SITES[0]?.threads[0]?.id ?? null);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>(null);
  const [selectedDetachedEmailId, setSelectedDetachedEmailId] = useState<string | null>(null);
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [draggingInboxItemId, setDraggingInboxItemId] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<ComposeState>({ open: false, mode: 'new', siteId: null, threadId: null });
  const [sendLog, setSendLog] = useState<SendLogEntry[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activityNote, setActivityNote] = useState<ActivityNote | null>(null);
  const [pendingCreateSite, setPendingCreateSite] = useState<PendingCreateSite>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailSyncing, setGmailSyncing] = useState(false);

  const selectedSite = orderedSites.find((site) => site.id === selectedSiteId) ?? null;
  const composeSite = orderedSites.find((site) => site.id === composeState.siteId) ?? null;
  const composeThread = composeSite?.threads.find((thread) => thread.id === composeState.threadId) ?? null;

  const inboxItems = useMemo<InboxItem[]>(() => {
    const promotedIds = new Set(promotedUnmatched.map((entry) => entry.emailId));
    const threshold = Date.now() - FEED_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const messageItems: InboxItem[] = orderedSites.flatMap((site) =>
      site.threads.flatMap((thread) =>
        thread.messages
          .map((message) => ({ message, sortValue: parseDateLabel(message.date) }))
          .filter(({ sortValue }) => sortValue >= threshold)
          .map(({ message, sortValue }) => ({
            id: `message:${message.id}`,
            kind: 'message' as const,
            sender: message.from,
            initials: message.initials,
            subject: thread.subject,
            preview: message.body,
            dateLabel: message.date,
            unread: message.unread ? 1 : 0,
            linkedSiteId: site.id,
            linkedSiteLabel: `${site.short}${site.unit ? ` · ${site.unit}` : ''}`,
            state: 'linked' as const,
            threadId: thread.id,
            siteId: site.id,
            messageId: message.id,
            sortValue,
          })),
      ),
    );

    const unmatchedItems: InboxItem[] = detachedEmails
      .filter((email) => !promotedIds.has(email.id))
      .map((email) => ({
        id: `unmatched:${email.id}`,
        kind: 'unmatched' as const,
        sender: email.from,
        initials: email.initials,
        subject: email.subject,
        preview: email.preview,
        dateLabel: email.date,
        unread: email.unread ? 1 : 0,
        linkedSiteId: null,
        linkedSiteLabel: null,
        state: 'link-site' as const,
        emailId: email.id,
        sortValue: parseDateLabel(email.date),
      }))
      .filter((item) => item.sortValue >= threshold);

    return [...messageItems, ...unmatchedItems].sort((a, b) => b.sortValue - a.sortValue);
  }, [orderedSites, promotedUnmatched, detachedEmails]);

  const unresolvedUnmatchedCount = inboxItems.filter((item) => item.kind === 'unmatched' && item.state === 'link-site').length;
  const selectedDetachedEmail = selectedDetachedEmailId ? detachedEmails.find((entry) => entry.id === selectedDetachedEmailId) ?? null : null;
  const selectedDetachedInboxItem = selectedDetachedEmailId ? inboxItems.find((item) => item.emailId === selectedDetachedEmailId) ?? null : null;
  const selectedDetachedLinkedSite = null;

  useEffect(() => {
    try {
      const rawSnapshot = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
      if (rawSnapshot) {
        const parsed = JSON.parse(rawSnapshot);
        if (isPersistedAppState(parsed)) {
          setSendLog(parsed.sendLog.slice(0, 6));
          setPromotedUnmatched(parsed.promotedUnmatched);
          setSitesState(parsed.sitesState);
          setDetachedEmails(parsed.detachedEmails);
          setSelectedSiteId(parsed.selectedSiteId);
          setFocusedThreadId(parsed.focusedThreadId);
          setFocusedMessageId(parsed.focusedMessageId);
          setSelectedInboxId(parsed.selectedInboxId);
          setSelectedDetachedEmailId(parsed.selectedDetachedEmailId);
          setHydrated(true);
          return;
        }
      }

      const rawSendLog = window.localStorage.getItem(SEND_LOG_STORAGE_KEY);
      if (rawSendLog) {
        const parsed = JSON.parse(rawSendLog);
        if (Array.isArray(parsed)) setSendLog(parsed.filter(isSendLogEntry).slice(0, 6));
      }

      let promotedEntries: PromotedUnmatchedEntry[] = [];
      const rawPromotedUnmatched = window.localStorage.getItem(PROMOTED_UNMATCHED_STORAGE_KEY);
      if (rawPromotedUnmatched) {
        const parsed = JSON.parse(rawPromotedUnmatched);
        if (Array.isArray(parsed)) promotedEntries = parsed.filter(isPromotedUnmatchedEntry);
      } else {
        const legacyLinked = window.localStorage.getItem('sitethread:linked-unmatched');
        if (legacyLinked) {
          const parsed = JSON.parse(legacyLinked);
          if (Array.isArray(parsed)) promotedEntries = parsed.filter(isPromotedUnmatchedEntry);
        }
      }
      if (promotedEntries.length) setPromotedUnmatched(promotedEntries);

      const rawDetachedEmails = window.localStorage.getItem(DETACHED_EMAILS_STORAGE_KEY);
      if (rawDetachedEmails) {
        const parsed = JSON.parse(rawDetachedEmails);
        if (Array.isArray(parsed)) {
          const validEmails = parsed.filter(isUnmatchedEmail);
          if (validEmails.length) setDetachedEmails(validEmails);
        }
      }

      const rawSitesState = window.localStorage.getItem(SITES_STATE_STORAGE_KEY);
      if (rawSitesState) {
        const parsed = JSON.parse(rawSitesState);
        if (Array.isArray(parsed)) {
          const validSites = parsed.filter(isSite);
          if (validSites.length) {
            setSitesState(validSites);
          } else {
            setSitesState(applyPromotedUnmatched(cloneBaseSites(), cloneDetachedEmails(), promotedEntries));
          }
        }
      } else if (promotedEntries.length) {
        setSitesState(applyPromotedUnmatched(cloneBaseSites(), cloneDetachedEmails(), promotedEntries));
      }
    } catch {
      // ignore malformed local storage for the demo
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const snapshot: PersistedAppState = {
      version: 2,
      sendLog,
      promotedUnmatched,
      sitesState,
      detachedEmails,
      selectedSiteId,
      focusedThreadId,
      focusedMessageId,
      selectedInboxId,
      selectedDetachedEmailId,
    };

    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(snapshot));
    window.localStorage.setItem(SEND_LOG_STORAGE_KEY, JSON.stringify(sendLog));
    window.localStorage.setItem(PROMOTED_UNMATCHED_STORAGE_KEY, JSON.stringify(promotedUnmatched));
    window.localStorage.setItem(SITES_STATE_STORAGE_KEY, JSON.stringify(sitesState));
    window.localStorage.setItem(DETACHED_EMAILS_STORAGE_KEY, JSON.stringify(detachedEmails));
  }, [
    sendLog,
    promotedUnmatched,
    sitesState,
    selectedSiteId,
    focusedThreadId,
    focusedMessageId,
    selectedInboxId,
    selectedDetachedEmailId,
    detachedEmails,
    hydrated,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/gmail/status')
      .then((response) => response.json())
      .then((data: { connected?: boolean; email?: string | null }) => {
        if (cancelled) return;
        setGmailConnected(Boolean(data.connected));
        setGmailEmail(data.email ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setGmailConnected(false);
        setGmailEmail(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pushActivityNote = (text: string) => setActivityNote({ id: `note-${Date.now()}`, text });

  useEffect(() => {
    if (!activityNote) return;
    const timeout = window.setTimeout(() => setActivityNote(null), ACTIVITY_NOTE_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [activityNote]);

  const handleConnectGmail = () => {
    window.location.href = '/api/gmail/start';
  };

  const handleDisconnectGmail = async () => {
    await fetch('/api/gmail/disconnect', { method: 'POST' });
    setGmailConnected(false);
    setGmailEmail(null);
    setDetachedEmails((current) => current.filter((email) => email.source !== 'gmail'));
    setSelectedDetachedEmailId(null);
    pushActivityNote('Disconnected Gmail');
  };

  const handleSyncGmail = async () => {
    setGmailSyncing(true);
    try {
      const response = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        pushActivityNote(data.message ?? 'Gmail sync failed');
        return;
      }
      const emails = Array.isArray(data.emails) ? (data.emails as UnmatchedEmail[]) : [];
      setDetachedEmails((current) => {
        const withoutOldGmail = current.filter((email) => email.source !== 'gmail');
        return [...emails, ...withoutOldGmail];
      });
      pushActivityNote(`Synced ${emails.length} Gmail emails`);
    } catch {
      pushActivityNote('Gmail sync failed');
    } finally {
      setGmailSyncing(false);
    }
  };

  const handleSelectSite = (siteId: string) => {
    setSelectedDetachedEmailId(null);
    setSelectedSiteId((current) => {
      if (current === siteId) {
        setFocusedThreadId(null);
        setFocusedMessageId(null);
        return null;
      }

      const site = orderedSites.find((entry) => entry.id === siteId) ?? null;
      setFocusedThreadId(site?.threads[0]?.id ?? null);
      setFocusedMessageId(null);
      setSelectedInboxId(null);
      return siteId;
    });
  };

  const handleSelectInboxItem = (itemId: string) => {
    const item = inboxItems.find((entry) => entry.id === itemId);
    if (!item) return;

    setSelectedInboxId(item.id);

    if (item.kind === 'message' && item.siteId && item.threadId) {
      if (item.messageId) {
        setSitesState((current) =>
          current.map((site) =>
            site.id !== item.siteId
              ? site
              : {
                  ...site,
                  threads: site.threads.map((thread) =>
                    thread.id !== item.threadId
                      ? thread
                      : {
                          ...thread,
                          messages: thread.messages.map((message) =>
                            message.id === item.messageId ? { ...message, unread: false } : message,
                          ),
                        },
                  ),
                },
          ),
        );
      }

      setSelectedDetachedEmailId(null);
      setSelectedSiteId(item.siteId);
      setFocusedThreadId(item.threadId);
      setFocusedMessageId(item.messageId ?? null);
      return;
    }

    if (item.kind === 'unmatched') {
      if (item.emailId) {
        setDetachedEmails((current) =>
          current.map((email) => (email.id === item.emailId ? { ...email, unread: false } : email)),
        );
      }
      setSelectedDetachedEmailId(item.emailId ?? null);
      setFocusedMessageId(null);
      if (item.linkedSiteId) setSelectedSiteId(item.linkedSiteId);
    }
  };

  const handleOpenCompose = (siteId: string | null) => {
    setComposeState({ open: true, mode: 'new', siteId, threadId: null });
  };

  const handleOpenReply = (siteId: string, threadId: string) => {
    setComposeState({ open: true, mode: 'reply', siteId, threadId });
  };

  const closeCompose = () => setComposeState((current) => ({ ...current, open: false }));

  const handleSend = async (payload: ComposePayload) => {
    const route = composeState.mode === 'reply' ? '/api/send/reply' : '/api/send/new';
    const body = composeState.mode === 'reply'
      ? { siteId: payload.siteId, threadId: payload.threadId, to: payload.to, subject: payload.subject, body: payload.body, attachments: payload.attachments }
      : { siteId: payload.siteId, to: payload.to, subject: payload.subject, body: payload.body, attachments: payload.attachments };

    const response = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Partial<SendApiResponse> & { message?: string };
    if (!response.ok || !data.ok) throw new Error(data.message ?? 'The mock send route returned an error.');

    const resolvedSite = orderedSites.find((site) => site.id === payload.siteId) ?? null;
    const now = new Date();

    setSendLog((current) => [
      {
        id: data.id ?? `${composeState.mode}-${Date.now()}`,
        mode: composeState.mode,
        siteLabel: resolvedSite ? `${resolvedSite.short}${resolvedSite.unit ? ` · ${resolvedSite.unit}` : ''}` : 'No site context',
        to: payload.to,
        subject: payload.subject,
        sentAtLabel: timeStamp(now),
      },
      ...current,
    ].slice(0, 6));

    if (!payload.siteId) return;

    let createdThreadId: string | null = null;
    let createdMessageId: string | null = null;

    const nextSites = sitesState.map((site) => {
      if (site.id !== payload.siteId) return site;

      const nextMessage: Message = {
        id: `sent-${Date.now()}`,
        from: 'You',
        initials: 'ME',
        date: messageDateLabel(now),
        unread: false,
        body: payload.body,
        attachments: payload.attachments,
      };
      createdMessageId = nextMessage.id;

      if (composeState.mode === 'reply' && payload.threadId) {
        const existingThread = site.threads.find((thread) => thread.id === payload.threadId);
        if (!existingThread) return site;
        const updatedThread: Thread = {
          ...existingThread,
          lastDate: 'Just now',
          messages: [nextMessage, ...existingThread.messages],
        };
        createdThreadId = updatedThread.id;
        return {
          ...site,
          threads: [updatedThread, ...site.threads.filter((thread) => thread.id !== payload.threadId)],
        };
      }

      const contact = deriveContactForNewThread(site, payload.to);
      const nextThread: Thread = {
        id: `thread-${Date.now()}`,
        subject: payload.subject,
        sender: contact.sender,
        senderEmail: contact.senderEmail,
        initials: contact.initials,
        company: contact.company,
        lastDate: 'Just now',
        messages: [nextMessage],
      };
      createdThreadId = nextThread.id;
      return { ...site, threads: [nextThread, ...site.threads] };
    });

    setSitesState(nextSites);
    setSelectedDetachedEmailId(null);
    setSelectedSiteId(payload.siteId);
    setFocusedThreadId(createdThreadId);
    setFocusedMessageId(createdMessageId);
    setSelectedInboxId(createdMessageId ? `message:${createdMessageId}` : null);
  };

  const handleAssignInboxItemToSite = (itemId: string, siteId: string) => {
    const item = inboxItems.find((entry) => entry.id === itemId);
    const targetSite = orderedSites.find((entry) => entry.id === siteId) ?? null;
    if (!item || !targetSite) return;

    if (item.kind === 'unmatched' && item.emailId) {
      const promotedThread = buildPromotedThread(detachedEmails, item.emailId);
      if (!promotedThread) return;

      setSitesState((current) =>
        current.map((site) =>
          site.id === siteId
            ? {
                ...site,
                threads: site.threads.some((thread) => thread.id === promotedThread.id)
                  ? site.threads
                  : [promotedThread, ...site.threads],
              }
            : site,
        ),
      );
      setPromotedUnmatched((current) => {
        const withoutExisting = current.filter((entry) => entry.emailId !== item.emailId);
        return [{ emailId: item.emailId, siteId, linkedAtLabel: timeStamp() }, ...withoutExisting];
      });
      setSelectedDetachedEmailId(null);
      setSelectedSiteId(siteId);
      setFocusedThreadId(promotedThread.id);
      setFocusedMessageId(promotedThread.messages[0]?.id ?? null);
      setSelectedInboxId(`message:${promotedThread.messages[0]?.id ?? item.emailId}`);
      pushActivityNote(`Linked to ${targetSite.short}${targetSite.unit ? ` · ${targetSite.unit}` : ''}`);
      return;
    }

    if (item.kind === 'message' && item.siteId && item.threadId) {
      if (item.siteId === siteId) {
        pushActivityNote(`Already linked to ${targetSite.short}`);
        return;
      }
      setSitesState((current) => moveThreadBetweenSites(current, item.siteId!, item.threadId!, siteId));
      setSelectedDetachedEmailId(null);
      setSelectedSiteId(siteId);
      setFocusedThreadId(item.threadId ?? null);
      setFocusedMessageId(item.messageId ?? null);
      setSelectedInboxId(item.id);
      pushActivityNote(`Moved thread to ${targetSite.short}${targetSite.unit ? ` · ${targetSite.unit}` : ''}`);
    }
  };

  const handleDropInboxItemOnSite = (itemId: string, siteId: string) => {
    handleAssignInboxItemToSite(itemId, siteId);
    setDraggingInboxItemId(null);
  };

  const handleDropInboxItemOnMap = (itemId: string, lat: number, lng: number) => {
    setDraggingInboxItemId(null);
    setPendingCreateSite({ itemId, lat, lng });
  };

  const handleCreateSite = ({ address, city, unit }: { address: string; city: string; unit: string }) => {
    if (!pendingCreateSite) return;
    const { itemId, lat, lng } = pendingCreateSite;
    const newSiteId = `site-${Date.now()}`;
    const item = inboxItems.find((entry) => entry.id === itemId);
    if (!item) {
      setPendingCreateSite(null);
      return;
    }

    let movedThread: Thread | null = null;

    setSitesState((current) => {
      const newSiteBase: Site = {
        id: newSiteId,
        address,
        short: deriveShortLabel(address),
        city,
        lat,
        lng,
        unit: unit || null,
        threads: [],
      };

      if (item.kind === 'message' && item.siteId && item.threadId) {
        const stripped = current.map((site) => {
          if (site.id !== item.siteId) return site;
          const thread = site.threads.find((entry) => entry.id === item.threadId) ?? null;
          if (thread) movedThread = thread;
          return { ...site, threads: site.threads.filter((entry) => entry.id !== item.threadId) };
        });
        const newSite = { ...newSiteBase, threads: movedThread ? [movedThread] : [] };
        return [...stripped, newSite];
      }

      return [...current, newSiteBase];
    });

    if (item.kind === 'unmatched' && item.emailId) {
      const promotedThread = buildPromotedThread(detachedEmails, item.emailId);
      if (promotedThread) {
        setSitesState((current) =>
          current.map((site) =>
            site.id === newSiteId ? { ...site, threads: [promotedThread, ...site.threads] } : site,
          ),
        );
        setPromotedUnmatched((current) => [{ emailId: item.emailId!, siteId: newSiteId, linkedAtLabel: timeStamp() }, ...current.filter((entry) => entry.emailId !== item.emailId)]);
        setSelectedDetachedEmailId(null);
        setFocusedThreadId(promotedThread.id);
        setFocusedMessageId(promotedThread.messages[0]?.id ?? null);
        setSelectedInboxId(`message:${promotedThread.messages[0]?.id ?? item.emailId}`);
      }
    } else {
      setSelectedDetachedEmailId(null);
      setFocusedThreadId(item.threadId ?? null);
      setFocusedMessageId(item.messageId ?? null);
      setSelectedInboxId(item.id);
    }

    setSelectedSiteId(newSiteId);
    pushActivityNote(`Created ${deriveShortLabel(address)}`);
    setPendingCreateSite(null);
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#ece8e0] text-ink">
      <LeftRail
        inboxItems={inboxItems}
        selectedInboxId={selectedInboxId}
        reviewCount={unresolvedUnmatchedCount}
        reviewOpen={reviewOpen}
        gmailConnected={gmailConnected}
        gmailEmail={gmailEmail}
        gmailSyncing={gmailSyncing}
        onSelectInboxItem={handleSelectInboxItem}
        onOpenCompose={handleOpenCompose}
        onToggleReview={() => setReviewOpen((current) => !current)}
        onDragStartItem={setDraggingInboxItemId}
        onDragEndItem={() => setDraggingInboxItemId(null)}
        onConnectGmail={handleConnectGmail}
        onSyncGmail={handleSyncGmail}
        onDisconnectGmail={handleDisconnectGmail}
      />

      <section className="relative isolate flex-1 overflow-hidden">
        <MapView
          sites={orderedSites}
          selectedSiteId={selectedSiteId}
          hoveredSiteId={hoveredSiteId}
          draggingInboxItemId={draggingInboxItemId}
          onSelectSite={handleSelectSite}
          onDropInboxItemOnSite={handleDropInboxItemOnSite}
          onDropInboxItemOnMap={handleDropInboxItemOnMap}
        />

        {selectedDetachedEmail && selectedDetachedInboxItem ? (
          <EmailPanel
            item={selectedDetachedInboxItem}
            email={selectedDetachedEmail}
            linkedSite={selectedDetachedLinkedSite}
            onClose={() => setSelectedDetachedEmailId(null)}
            onOpenReview={() => setReviewOpen(true)}
            onOpenLinkedSite={(siteId) => {
              const site = orderedSites.find((entry) => entry.id === siteId) ?? null;
              setSelectedDetachedEmailId(null);
              setSelectedSiteId(siteId);
              setFocusedThreadId(site?.threads[0]?.id ?? null);
              setFocusedMessageId(null);
            }}
          />
        ) : selectedSite ? (
          <ThreadPanel
            site={selectedSite}
            focusedThreadId={focusedThreadId}
            focusedMessageId={focusedMessageId}
            onClose={() => {
              setSelectedSiteId(null);
              setFocusedThreadId(null);
              setFocusedMessageId(null);
              setSelectedInboxId(null);
            }}
            onOpenCompose={handleOpenCompose}
            onOpenReply={handleOpenReply}
          />
        ) : null}

        <div className="absolute bottom-24 left-5 z-[1150]">
          {reviewOpen ? (
            <UnmatchedPanel
              items={inboxItems}
              sites={orderedSites}
              selectedSiteId={selectedSiteId}
              onClose={() => setReviewOpen(false)}
              onAssign={handleAssignInboxItemToSite}
              onOpenInboxItem={handleSelectInboxItem}
            />
          ) : (
            <SendLogPanel entries={sendLog} activityNote={activityNote} onClear={() => setSendLog([])} />
          )}
        </div>
      </section>

      {composeState.open ? <ComposeModal mode={composeState.mode} site={composeSite} thread={composeThread} sites={orderedSites} onClose={closeCompose} onSend={handleSend} /> : null}
      <CreateSiteModal open={!!pendingCreateSite} onClose={() => setPendingCreateSite(null)} onCreate={handleCreateSite} />
    </main>
  );
}
