import type { Metadata } from "next";
import { searchUsers } from "@/lib/admin/users";
import { UserTable } from "@/components/admin/UserTable";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsersPage() {
  const initial = await searchUsers("");
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground">
        Gerenciamento de usuários
      </h1>
      <UserTable initial={initial} />
    </div>
  );
}
