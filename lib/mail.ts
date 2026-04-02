import type { Attachment } from '@/lib/types';

export type NewEmailRequest = {
  siteId?: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
};

export type ReplyEmailRequest = {
  siteId: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
};

export type SendApiResponse = {
  ok: boolean;
  mode: 'new' | 'reply';
  message: string;
  id: string;
  receivedAt: string;
};
