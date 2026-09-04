import { createClient as createSbClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente com a SERVICE ROLE KEY — ignora RLS. USO ESTRITO NO SERVIDOR:
 * webhooks e rotinas administrativas. Nunca importe isto em Client Components.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return createSbClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente anônimo SEM cookies — respeita RLS como visitante. Usado em rotas que
 * precisam ficar estáticas/ISR (blog público, sitemap): não lê a sessão.
 */
export function createAnonClient() {
  return createSbClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
