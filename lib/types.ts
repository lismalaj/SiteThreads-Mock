export type AttachmentType = 'pdf' | 'image' | 'other';

export type Attachment = {
  name: string;
  type: AttachmentType;
  size: string;
  url?: string;
  mimeType?: string;
};

export type Message = {
  id: string;
  from: string;
  initials: string;
  date: string;
  unread: boolean;
  body: string;
  attachments?: Attachment[];
};

export type Thread = {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  initials: string;
  company: string;
  lastDate: string;
  messages: Message[]; // stored newest -> oldest internally
};

export type Site = {
  id: string;
  address: string;
  short: string;
  city: string;
  lat: number;
  lng: number;
  unit?: string | null;
  threads: Thread[];
};

export type UnmatchedEmail = {
  id: string;
  from: string;
  initials: string;
  subject: string;
  date: string;
  preview: string;
  body: string;
  senderEmail?: string;
  attachments?: Attachment[];
  source?: 'mock' | 'gmail';
  unread?: boolean;
  gmailThreadId?: string;
  gmailMessageId?: string;
  gmailQuery?: string;
};

export type InboxItem = {
  id: string;
  kind: 'message' | 'unmatched';
  sender: string;
  initials: string;
  subject: string;
  preview: string;
  dateLabel: string;
  unread: number;
  linkedSiteId: string | null;
  linkedSiteLabel: string | null;
  state: 'linked' | 'linked-local' | 'link-site';
  threadId?: string;
  siteId?: string;
  messageId?: string;
  emailId?: string;
  sortValue: number;
};
