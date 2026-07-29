import { useEffect, useState } from "react";

export function useSupabase() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setLoading(false);
      return;
    }

    import("@supabase/ssr").then(({ createBrowserClient }) => {
      setClient(createBrowserClient(supabaseUrl, supabaseAnonKey));
      setLoading(false);
    });
  }, []);

  return { client, loading };
}