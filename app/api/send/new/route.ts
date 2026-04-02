import { NextResponse } from 'next/server';
import type { NewEmailRequest, SendApiResponse } from '@/lib/mail';

function isValidPayload(payload: unknown): payload is NewEmailRequest {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<NewEmailRequest>;
  return !!candidate.to?.trim() && typeof candidate.subject === 'string' && !!candidate.body?.trim();
}

export async function POST(request: Request) {
  const payload = (await request.json()) as unknown;

  if (!isValidPayload(payload)) {
    return NextResponse.json(
      { ok: false, message: 'Missing required fields: to and body are required.' },
      { status: 400 },
    );
  }

  const response: SendApiResponse = {
    ok: true,
    mode: 'new',
    id: `mock-new-${Date.now()}`,
    message: `Mock new email queued for ${payload.to}.`,
    receivedAt: new Date().toISOString(),
  };

  console.log('[sitethread][mock-api][send/new]', {
    ...payload,
    subjectLength: payload.subject.length,
    bodyLength: payload.body.length,
    receivedAt: response.receivedAt,
  });

  return NextResponse.json(response);
}
