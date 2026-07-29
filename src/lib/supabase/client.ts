export function createClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    const { createBrowserClient } = require("@supabase/ssr");
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return null;
  }
}