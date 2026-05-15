import { NextResponse } from 'next/server';
import { createProfile } from '@/lib/actions/profile';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createProfile(body);
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  
  return NextResponse.json(result.data);
}
