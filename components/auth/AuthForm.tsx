"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

type Mode = "login" | "cadastro" | "recuperar" | "redefinir";

/**
 * Login social só aparece quando o provedor está de fato configurado no Supabase.
 * Ative definindo, na Vercel, NEXT_PUBLIC_OAUTH_PROVIDERS="google" (ou "google,apple")
 * DEPOIS de habilitar o provedor em Supabase → Authentication → Providers.
 */
const OAUTH_PROVIDERS = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is "google" | "apple" => p === "google" || p === "apple");

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: "Entrar",
    subtitle: "Acesse sua conta para continuar estudando.",
    cta: "Entrar",
  },
  cadastro: {
    title: "Criar conta",
    subtitle: "Comece grátis. Leva menos de um minuto.",
    cta: "Criar conta",
  },
  recuperar: {
    title: "Recuperar senha",
    subtitle: "Enviaremos um link para você redefinir sua senha.",
    cta: "Enviar link",
  },
  redefinir: {
    title: "Nova senha",
    subtitle: "Defina uma nova senha para a sua conta.",
    cta: "Salvar senha",
  },
};

function translateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered")) return "Já existe uma conta com esse e-mail.";
  if (m.includes("password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("auth session missing") || m.includes("session_not_found"))
    return "Link inválido ou expirado. Solicite um novo.";
  if (m.includes("for security purposes") || m.includes("rate limit"))
    return "Muitas tentativas. Aguarde alguns instantes e tente de novo.";
  if (m.includes("provider is not enabled"))
    return "Este login social ainda não foi configurado no Supabase.";
  return msg || "Algo deu errado. Tente novamente.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";
  // Novos cadastros vão para o onboarding (a página redireciona se já concluído).
  const signupRedirect = params.get("redirect") || "/bem-vindo";
  const urlError = params.get("error");

  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [done, setDone] = useState<string | null>(null);

  const copy = COPY[mode];
  const showOAuth =
    (mode === "login" || mode === "cadastro") && OAUTH_PROVIDERS.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
        return;
      }

      if (mode === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
              signupRedirect
            )}`,
          },
        });
        if (error) throw error;
        // Confirmação de e-mail desligada → já vem com sessão: vai ao onboarding.
        if (data.session) {
          router.push(signupRedirect);
          router.refresh();
          return;
        }
        setDone(
          "Conta criada! Confira seu e-mail e clique no link para confirmar o cadastro."
        );
        return;
      }

      if (mode === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/redefinir-senha`,
        });
        if (error) throw error;
        setDone(
          "Se existir uma conta com esse e-mail, você receberá um link de redefinição."
        );
        return;
      }

      if (mode === "redefinir") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setDone("Senha alterada com sucesso. Você já pode entrar com a nova senha.");
        return;
      }
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          redirectTo
        )}`,
      },
    });
    if (error) setError(translateError(error));
  }

  return (
    <Card className="animate-fade-in">
      <CardBody className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              {done}
            </div>
            <Button href="/login" variant="outline" className="w-full">
              Ir para o login
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            {showOAuth && (
              <>
                <div className="space-y-2">
                  {OAUTH_PROVIDERS.includes("google") && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuth("google")}
                    >
                      Continuar com Google
                    </Button>
                  )}
                  {OAUTH_PROVIDERS.includes("apple") && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuth("apple")}
                    >
                      Continuar com Apple
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted">ou</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
              {mode === "cadastro" && (
                <Field
                  label="Nome"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              )}

              {(mode === "login" ||
                mode === "cadastro" ||
                mode === "recuperar") && (
                <Field
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              )}

              {(mode === "login" ||
                mode === "cadastro" ||
                mode === "redefinir") && (
                <Field
                  label="Senha"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              )}

              {mode === "login" && (
                <div className="text-right">
                  <Link
                    href="/esqueci-senha"
                    className="text-xs text-secondary hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Aguarde..." : copy.cta}
              </Button>
            </form>
          </>
        )}

        {(mode === "login" || mode === "cadastro") && !done && (
          <p className="text-center text-sm text-muted">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <Link href="/cadastro" className="text-secondary hover:underline">
                  Criar conta
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <Link href="/login" className="text-secondary hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
        {...props}
      />
    </label>
  );
}
