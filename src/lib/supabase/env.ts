const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

export function isSupabaseEnabled() {
  return Boolean(getSupabaseEnv());
}

export function getSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;

  return { url, secretKey };
}
