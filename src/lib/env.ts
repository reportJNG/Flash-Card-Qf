function readEnv(primary: string, fallback?: string) {
  const value = process.env[primary] || (fallback ? process.env[fallback] : undefined);

  if (!value) {
    throw new Error(
      `Missing environment variable ${primary}${fallback ? ` or ${fallback}` : ''}`
    );
  }

  return value;
}

export function getSupabaseUrl() {
  return readEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
}

export function getSupabaseAnonKey() {
  return readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
}

export function getSupabaseServerKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey();
}

export function getSessionSecret() {
  return readEnv('SESSION_SECRET');
}
