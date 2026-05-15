import { NextResponse } from 'next/server';
import { getSession } from '@/lib/utils/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }
  return NextResponse.json(session);
}
