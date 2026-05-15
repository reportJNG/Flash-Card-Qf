function required(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return required(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL'
  );
}

export function getSupabaseAnonKey() {
  return required(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY'
  );
}

export function getSupabaseServerKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getSupabaseAnonKey()
  );
}

export function getSessionSecret() {
  return required(process.env.SESSION_SECRET, 'SESSION_SECRET');
}