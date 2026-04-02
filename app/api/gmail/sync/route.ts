import { NextResponse } from 'next/server';
import { fetchRecentGmailEmails } from '@/lib/server/gmail';

export async function POST() {
  try {
    const emails = await fetchRecentGmailEmails(180, 50);
    return NextResponse.json({ ok: true, emails, count: emails.length });
  } catch (error) {
    console.error('[sitethread][gmail][sync] failed', error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Failed to sync Gmail.',
      },
      { status: 500 },
    );
  }
}
