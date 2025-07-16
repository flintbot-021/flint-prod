import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log('[Supabase] Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[Supabase] Using anon key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
