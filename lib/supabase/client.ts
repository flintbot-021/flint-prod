import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Removed logging of Supabase public URL for security
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
