import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/service";
import { cached } from "@/lib/cache";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  author_name: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[];
  reading_minutes: number;
  published_at: string | null;
  scheduled_for: string | null;
  updated_at: string;
};

const LIST_COLS =
  "id, slug, title, subtitle, excerpt, cover_image_url, category, tags, author_name, reading_minutes, published_at";
const FULL_COLS =
  "id, slug, title, subtitle, excerpt, content, cover_image_url, category, tags, author_name, status, seo_title, seo_description, keywords, reading_minutes, published_at, scheduled_for, updated_at";

export type BlogCard = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "subtitle"
  | "excerpt"
  | "cover_image_url"
  | "category"
  | "tags"
  | "author_name"
  | "reading_minutes"
  | "published_at"
>;

export async function listPublishedPosts(limit = 30): Promise<BlogCard[]> {
  return cached(`blog:list:${limit}`, 300, async () => {
    try {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("blog_posts")
        .select(LIST_COLS)
        .eq("status", "publicado")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as BlogCard[];
    } catch {
      return [];
    }
  });
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  return cached(`blog:post:${slug}`, 300, async () => {
    try {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("blog_posts")
        .select(FULL_COLS)
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle();
      return (data as BlogPost) ?? null;
    } catch {
      return null;
    }
  });
}

export async function listAllPostsAdmin(): Promise<BlogPost[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(FULL_COLS)
    .order("updated_at", { ascending: false });
  return (data ?? []) as BlogPost[];
}

export async function getPostByIdAdmin(id: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(FULL_COLS)
    .eq("id", id)
    .maybeSingle();
  return (data as BlogPost) ?? null;
}
