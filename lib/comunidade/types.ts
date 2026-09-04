export type PostKind =
  | "duvida"
  | "explicacao"
  | "resumo"
  | "material"
  | "noticia"
  | "discussao"
  | "dica";

export type ModerationStatus = "aprovado" | "pendente" | "bloqueado" | "revisao";
export type ReportReason =
  | "spam"
  | "ofensa"
  | "improprio"
  | "falso"
  | "propaganda"
  | "outro";
export type ReportTarget = "post" | "comment" | "material";
export type SubmissionStatus = "pendente" | "aprovado" | "reprovado" | "ajustes";

export type Attachment = {
  type: "pdf" | "image" | "doc" | "link";
  url: string;
  name: string;
};

export type SourceRef = {
  type: "biblioteca" | "chat" | "redacao";
  href: string;
  label: string;
} | null;

export type Group = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  visibility: "publica" | "privada";
  rules: string | null;
  official: boolean;
  member_count: number;
};

export type Author = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type Post = {
  id: string;
  group_id: string;
  group_slug: string;
  group_name: string;
  kind: PostKind;
  title: string;
  content: string;
  attachments: Attachment[];
  source_ref: SourceRef;
  official: boolean;
  pinned: boolean;
  moderation: ModerationStatus;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: Author;
  liked?: boolean;
  saved?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  edited: boolean;
  created_at: string;
  author: Author;
  replies?: Comment[];
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  href: string | null;
  read: boolean;
  created_at: string;
};

export const POST_KIND_LABEL: Record<PostKind, string> = {
  duvida: "Dúvida",
  explicacao: "Explicação",
  resumo: "Resumo",
  material: "Material",
  noticia: "Notícia",
  discussao: "Discussão",
  dica: "Dica de estudos",
};

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  spam: "Spam",
  ofensa: "Ofensa / discurso de ódio",
  improprio: "Conteúdo impróprio",
  falso: "Informação falsa",
  propaganda: "Propaganda indevida",
  outro: "Outro",
};

export const FAVORITE_POST_TYPE = "community_post";
