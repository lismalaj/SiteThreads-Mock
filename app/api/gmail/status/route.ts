import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GMAIL_ACCESS_COOKIE, GMAIL_EMAIL_COOKIE, GMAIL_REFRESH_COOKIE } from '@/lib/server/gmail';

export async function GET() {
  const store = cookies();
  const connected = Boolean(store.get(GMAIL_REFRESH_COOKIE)?.value || store.get(GMAIL_ACCESS_COOKIE)?.value);
  const email = store.get(GMAIL_EMAIL_COOKIE)?.value ?? null;
  return NextResponse.json({ connected, email });
}
