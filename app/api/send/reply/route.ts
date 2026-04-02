import { NextResponse } from 'next/server';
import type { ReplyEmailRequest, SendApiResponse } from '@/lib/mail';

function isValidPayload(payload: unknown): payload is ReplyEmailRequest {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<ReplyEmailRequest>;
  return (
    !!candidate.siteId?.trim() &&
    !!candidate.threadId?.trim() &&
    !!candidate.to?.trim() &&
    typeof candidate.subject === 'string' &&
    !!candidate.body?.trim()
  );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as unknown;

  if (!isValidPayload(payload)) {
    return NextResponse.json(
      { ok: false, message: 'Missing required fields: siteId, threadId, to, and body are required.' },
      { status: 400 },
    );
  }

  const response: SendApiResponse = {
    ok: true,
    mode: 'reply',
    id: `mock-reply-${Date.now()}`,
    message: `Mock reply queued for thread ${payload.threadId}.`,
    receivedAt: new Date().toISOString(),
  };

  console.log('[sitethread][mock-api][send/reply]', {
    ...payload,
    subjectLength: payload.subject.length,
    bodyLength: payload.body.length,
    receivedAt: response.receivedAt,
  });

  return NextResponse.json(response);
}
