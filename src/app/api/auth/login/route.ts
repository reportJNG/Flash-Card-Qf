import { NextResponse } from 'next/server';
import { loginProfile } from '@/lib/actions/profile';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await loginProfile(body);
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  
  return NextResponse.json(result.data);
}
