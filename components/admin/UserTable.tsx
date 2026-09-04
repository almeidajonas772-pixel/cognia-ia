"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import {
  searchUsers,
  setUserPlan,
  setUserStatus,
  type AdminUserRow,
} from "@/lib/admin/users";

export function UserTable({ initial }: { initial: AdminUserRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [loading, startSearch] = useTransition();
  const [, startAction] = useTransition();

  function doSearch() {
    startSearch(async () => {
      setRows(await searchUsers(q));
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSearch();
        }}
        className="relative max-w-sm"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por e-mail ou nome"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="p-3">Usuário</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Status</th>
              <th className="p-3">Cadastro</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3">
                    <p className="text-foreground">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        u.plan === "premium"
                          ? "text-amber-400"
                          : "text-muted"
                      }
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        u.status === "ativo"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <MiniBtn
                        onClick={() =>
                          startAction(async () => {
                            await setUserPlan(
                              u.id,
                              u.plan === "premium" ? "free" : "premium"
                            );
                            router.refresh();
                            doSearch();
                          })
                        }
                      >
                        {u.plan === "premium" ? "→ free" : "→ premium"}
                      </MiniBtn>
                      <MiniBtn
                        tone="danger"
                        onClick={() =>
                          startAction(async () => {
                            await setUserStatus(
                              u.id,
                              u.status === "ativo" ? "suspenso" : "ativo"
                            );
                            router.refresh();
                            doSearch();
                          })
                        }
                      >
                        {u.status === "ativo" ? "suspender" : "reativar"}
                      </MiniBtn>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted">
                  Nenhum usuário.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniBtn({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-0.5 text-xs ${
        tone === "danger"
          ? "border-rose-500/40 text-rose-400"
          : "border-border text-foreground"
      } hover:bg-white/5`}
    >
      {children}
    </button>
  );
}
