import { NextResponse } from 'next/server';
import { logoutProfile } from '@/lib/actions/profile';

export async function POST() {
  await logoutProfile();
  return NextResponse.json({ success: true });
}
