/**
 * Setup global dos testes unitários (Fase 12).
 * Define as variáveis mínimas para os módulos que as leem em import/execução,
 * sem tocar em serviços externos.
 */
const defaults: Record<string, string> = {
  APP_ENCRYPTION_KEY: "test-encryption-key-0123456789abcdef",
  IP_HASH_SECRET: "test-ip-hash-secret",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

for (const [k, v] of Object.entries(defaults)) {
  if (!process.env[k]) process.env[k] = v;
}
