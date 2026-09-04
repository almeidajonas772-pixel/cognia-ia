import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { getGroupBySlug, getGroupPosts } from "@/lib/comunidade/queries";
import { Card, CardBody } from "@/components/ui/Card";
import { JoinButton } from "@/components/comunidade/JoinButton";
import { PostComposer } from "@/components/comunidade/PostComposer";
import { PostCard } from "@/components/comunidade/PostCard";
import { POST_KIND_LABEL, type PostKind } from "@/lib/comunidade/types";
import { cn } from "@/lib/utils";

type Props = {
  params: { slug: string };
  searchParams: { sort?: string; kind?: string; q?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.slug.replace(/-/g, " ") };
}

const SORTS = [
  { id: "recentes", label: "Mais recentes" },
  { id: "curtidos", label: "Mais curtidos" },
  { id: "comentados", label: "Mais comentados" },
] as const;

export default async function GroupPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const group = await getGroupBySlug(params.slug, user.id);
  if (!group) notFound();

  const admin = await isAppAdmin(user.id);
  const sort = (["recentes", "curtidos", "comentados"].includes(
    searchParams.sort ?? ""
  )
    ? searchParams.sort
    : "recentes") as "recentes" | "curtidos" | "comentados";

  const posts = await getGroupPosts(group.id, user.id, {
    sort,
    kind: searchParams.kind,
    q: searchParams.q,
  });

  const mk = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const s = patch.sort ?? searchParams.sort;
    const k = "kind" in patch ? patch.kind : searchParams.kind;
    const q = searchParams.q;
    if (s && s !== "recentes") p.set("sort", s);
    if (k) p.set("kind", k);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `?${qs}` : `/comunidade/g/${params.slug}`;
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-5">
      <Link
        href="/comunidade"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Comunidade
      </Link>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {group.name}
                {group.official && (
                  <span className="ml-2 rounded-full border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary">
                    Oficial
                  </span>
                )}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <Users className="h-3 w-3" />
                {group.member_count} membros · {group.category}
              </p>
            </div>
            <JoinButton groupId={group.id} initialMember={group.isMember} />
          </div>
          {group.description && (
            <p className="text-sm text-muted">{group.description}</p>
          )}
          {group.rules && (
            <details className="text-xs text-muted">
              <summary className="cursor-pointer">Regras do grupo</summary>
              <p className="mt-1 whitespace-pre-wrap">{group.rules}</p>
            </details>
          )}
        </CardBody>
      </Card>

      {group.isMember ? (
        <PostComposer groupId={group.id} />
      ) : (
        <p className="rounded-lg border border-dashed border-border p-3 text-center text-sm text-muted">
          Entre no grupo para publicar e comentar.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link
            key={s.id}
            href={mk({ sort: s.id })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              sort === s.id
                ? "border-primary bg-primary-soft text-secondary"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
        <Link
          href={mk({ kind: undefined })}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            !searchParams.kind
              ? "border-primary bg-primary-soft text-secondary"
              : "border-border text-muted hover:text-foreground"
          )}
        >
          Todos os tipos
        </Link>
        {(Object.keys(POST_KIND_LABEL) as PostKind[]).map((k) => (
          <Link
            key={k}
            href={mk({ kind: k })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              searchParams.kind === k
                ? "border-primary bg-primary-soft text-secondary"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            {POST_KIND_LABEL[k]}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma publicação ainda.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUserId={user.id}
              isAdmin={admin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
