import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/server/gmail';

export async function GET() {
  return NextResponse.redirect(getAuthUrl());
}
