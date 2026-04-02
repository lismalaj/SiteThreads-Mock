import { NextResponse } from 'next/server';
import { clearGmailCookies } from '@/lib/server/gmail';

export async function POST() {
  clearGmailCookies();
  return NextResponse.json({ ok: true });
}
