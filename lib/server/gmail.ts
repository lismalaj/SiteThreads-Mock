import { cookies } from 'next/headers';
import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import type { Attachment, UnmatchedEmail } from '@/lib/types';

export const GMAIL_ACCESS_COOKIE = 'sitethread_gmail_access_token';
export const GMAIL_REFRESH_COOKIE = 'sitethread_gmail_refresh_token';
export const GMAIL_EMAIL_COOKIE = 'sitethread_gmail_email';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getOAuthClient() {
  const clientId = requiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = requiredEnv('GOOGLE_CLIENT_SECRET');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback';
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GMAIL_SCOPE],
  });
}

export function getAuthorizedClientFromCookies() {
  const store = cookies();
  const accessToken = store.get(GMAIL_ACCESS_COOKIE)?.value;
  const refreshToken = store.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

export function buildCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function clearGmailCookies() {
  const store = cookies();
  store.delete(GMAIL_ACCESS_COOKIE);
  store.delete(GMAIL_REFRESH_COOKIE);
  store.delete(GMAIL_EMAIL_COOKIE);
}

function decodeBase64Url(value?: string | null) {
  if (!value) return '';
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function extractHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string) {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function collectParts(part?: gmail_v1.Schema$MessagePart | null, out: gmail_v1.Schema$MessagePart[] = []) {
  if (!part) return out;
  out.push(part);
  part.parts?.forEach((child) => collectParts(child, out));
  return out;
}

function extractBody(payload?: gmail_v1.Schema$MessagePart | null) {
  if (!payload) return '';
  const parts = collectParts(payload);
  const textPart = parts.find((part) => part.mimeType === 'text/plain' && part.body?.data);
  if (textPart?.body?.data) return decodeBase64Url(textPart.body.data).trim();
  const htmlPart = parts.find((part) => part.mimeType === 'text/html' && part.body?.data);
  if (htmlPart?.body?.data) return stripHtml(decodeBase64Url(htmlPart.body.data));
  if (payload.body?.data) return stripHtml(decodeBase64Url(payload.body.data));
  return '';
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function mapAttachment(part: gmail_v1.Schema$MessagePart): Attachment | null {
  const filename = part.filename?.trim();
  if (!filename) return null;
  const mimeType = part.mimeType ?? '';
  const type: Attachment['type'] = mimeType.startsWith('image/') ? 'image' : mimeType === 'application/pdf' ? 'pdf' : 'other';
  return {
    name: filename,
    type,
    size: formatBytes(part.body?.size ?? 0),
    mimeType,
  };
}

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'EM'
  );
}

function parseFromHeader(fromHeader: string) {
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    const name = match[1].replace(/^"|"$/g, '').trim() || match[2];
    return { name, email: match[2].trim() };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim() };
}

function formatDateLabel(internalDate?: string | null, dateHeader?: string) {
  const date = internalDate ? new Date(Number(internalDate)) : dateHeader ? new Date(dateHeader) : new Date();
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function buildPreview(body: string, snippet?: string | null) {
  const source = body || snippet || '';
  return source.replace(/\s+/g, ' ').trim().slice(0, 160);
}

export async function fetchRecentGmailEmails(days = 180, maxResults = 40): Promise<UnmatchedEmail[]> {
  const auth = getAuthorizedClientFromCookies();
  if (!auth) throw new Error('Not connected to Gmail.');
  const gmail = google.gmail({ version: 'v1', auth });

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: `newer_than:${days}d -in:drafts`,
  });

  const messageIds = listResponse.data.messages?.map((message) => message.id).filter(Boolean) as string[] | undefined;
  if (!messageIds?.length) return [];

  const messages = await Promise.all(
    messageIds.map(async (id) => {
      const message = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      return message.data;
    }),
  );

  return messages.map((message) => {
    const payload = message.payload;
    const fromHeader = extractHeader(payload?.headers, 'From');
    const subject = extractHeader(payload?.headers, 'Subject') || '(No subject)';
    const dateHeader = extractHeader(payload?.headers, 'Date');
    const { name, email } = parseFromHeader(fromHeader || 'Unknown sender');
    const body = extractBody(payload) || message.snippet || '';
    const attachments = collectParts(payload)
      .map(mapAttachment)
      .filter((attachment): attachment is Attachment => Boolean(attachment));
    const query = `${name} ${subject}`.trim();

    return {
      id: `gmail-${message.id}`,
      from: name,
      initials: initialsFromName(name),
      subject,
      date: formatDateLabel(message.internalDate, dateHeader),
      preview: buildPreview(body, message.snippet),
      body: body || '(No body preview available.)',
      senderEmail: email,
      attachments,
      source: 'gmail',
      unread: message.labelIds?.includes('UNREAD') ?? false,
      gmailThreadId: message.threadId ?? undefined,
      gmailMessageId: message.id ?? undefined,
      gmailQuery: query,
    } satisfies UnmatchedEmail;
  });
}
