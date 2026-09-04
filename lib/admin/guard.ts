import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";

/** Garante que o usuário logado é administrador da plataforma (spec §18). */
export async function requireAdmin() {
  const user = await requireUser();
  if (!(await isAppAdmin(user.id))) redirect("/dashboard");
  return user;
}

export { isAppAdmin };
