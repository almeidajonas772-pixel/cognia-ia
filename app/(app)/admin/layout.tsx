import { requireAdmin } from "@/lib/admin/guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/** Área administrativa (spec §1, §18) — acesso exclusivo do admin. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="-m-4 flex lg:-m-8">
      <AdminSidebar />
      <div className="min-w-0 flex-1 p-4 lg:p-8">{children}</div>
    </div>
  );
}
