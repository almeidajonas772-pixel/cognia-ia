import Link from "next/link";
import { SITE } from "@/lib/nav";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";
import { LaunchBanner } from "@/components/launch/LaunchBanner";
import { OrgJsonLd } from "@/components/seo/JsonLd";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <OrgJsonLd />
      <LaunchBanner />
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label={SITE.name}>
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Button href="/blog" variant="ghost" size="sm">
              Blog
            </Button>
            <Button href="/precos" variant="ghost" size="sm">
              Planos
            </Button>
            <Button href="/login" variant="ghost" size="sm">
              Entrar
            </Button>
            <Button href="/cadastro" size="sm">
              Criar conta
            </Button>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} {SITE.name}. Todos os direitos
            reservados.
          </span>
          <nav className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
