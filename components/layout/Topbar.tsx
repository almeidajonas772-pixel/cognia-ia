import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { UserMenu } from "@/components/auth/UserMenu";

export function Topbar({
  name,
  email,
  avatarUrl,
  unread = 0,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  unread?: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <MobileNav />

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Buscar conteúdos, temas..."
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/comunidade/notificacoes"
          aria-label="Notificações"
          className="relative grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Link>
        <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
