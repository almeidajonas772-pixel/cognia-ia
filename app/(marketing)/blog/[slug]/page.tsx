import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/queries";
import { Markdown } from "@/components/biblioteca/Markdown";
import { AdSlot } from "@/components/ads/AdSlot";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://cogniai.com.br";

export async function generateStaticParams() {
  const posts = await listPublishedPosts(50);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  if (!post) return { title: "Artigo não encontrado" };
  const title = post.seo_title || post.title;
  const description =
    post.seo_description || post.excerpt || post.subtitle || undefined;
  return {
    title,
    description,
    keywords: post.keywords.length ? post.keywords : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE}/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogArticle({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.subtitle ?? "",
    author: { "@type": "Organization", name: post.author_name },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    image: post.cover_image_url ?? undefined,
    mainEntityOfPage: `${BASE}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "COGNI IA" },
  };

  const paragraphs = post.content.split(/\n\n+/);
  const mid = Math.floor(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, mid).join("\n\n");
  const secondHalf = paragraphs.slice(mid).join("\n\n");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="flex items-center gap-1 text-xs text-muted">
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{post.category}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold text-foreground">{post.title}</h1>
        {post.subtitle && (
          <p className="mt-2 text-lg text-muted">{post.subtitle}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>{post.author_name}</span>
          {post.published_at && (
            <span>
              {new Date(post.published_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.reading_minutes} min de leitura
          </span>
        </div>
      </header>

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="mt-6 w-full rounded-xl border border-border object-cover"
        />
      )}

      <article className="mt-8">
        <Markdown>{firstHalf}</Markdown>
        {/* Anúncio no meio do artigo (spec §10) */}
        <AdSlot placement="blog_artigo" isPremium={false} />
        <Markdown>{secondHalf}</Markdown>
      </article>

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-primary/30 bg-primary-soft p-5 text-center">
        <p className="text-sm font-medium text-foreground">
          Estude com o COGNI IA
        </p>
        <p className="mt-1 text-xs text-muted">
          Biblioteca, tutor com IA e correção de redação em um só lugar.
        </p>
        <Link
          href="/cadastro"
          className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Criar conta grátis
        </Link>
      </div>
    </main>
  );
}
