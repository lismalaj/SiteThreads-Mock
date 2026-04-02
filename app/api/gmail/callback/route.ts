import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { buildCookieOptions, GMAIL_ACCESS_COOKIE, GMAIL_EMAIL_COOKIE, GMAIL_REFRESH_COOKIE, getOAuthClient } from '@/lib/server/gmail';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${origin}/?gmail=missing-code`);
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const response = NextResponse.redirect(`${origin}/?gmail=connected`);
    const cookieOptions = buildCookieOptions();

    if (tokens.access_token) response.cookies.set(GMAIL_ACCESS_COOKIE, tokens.access_token, cookieOptions);
    if (tokens.refresh_token) response.cookies.set(GMAIL_REFRESH_COOKIE, tokens.refresh_token, cookieOptions);
    if (profile.data.emailAddress) response.cookies.set(GMAIL_EMAIL_COOKIE, profile.data.emailAddress, cookieOptions);

    return response;
  } catch (error) {
    console.error('[sitethread][gmail][callback] failed', error);
    return NextResponse.redirect(`${origin}/?gmail=error`);
  }
}
