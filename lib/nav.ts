import {
  LayoutDashboard,
  Library,
  MessageSquareText,
  PenLine,
  Users,
  Star,
  History,
  User,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Fase do roadmap em que a funcionalidade real entra. */
  phase: number;
};

/** Navegação principal do app (sidebar). */
export const APP_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: 1 },
  { label: "Biblioteca", href: "/biblioteca", icon: Library, phase: 3 },
  { label: "Chat IA", href: "/chat", icon: MessageSquareText, phase: 4 },
  { label: "Redação", href: "/redacao", icon: PenLine, phase: 6 },
  { label: "Comunidade", href: "/comunidade", icon: Users, phase: 7 },
  { label: "Conquistas", href: "/conquistas", icon: Trophy, phase: 14 },
  { label: "Favoritos", href: "/favoritos", icon: Star, phase: 5 },
  { label: "Histórico", href: "/historico", icon: History, phase: 5 },
  { label: "Perfil", href: "/perfil", icon: User, phase: 2 },
];

export const SITE = {
  name: BRAND.name,
  tagline: "Estude para o ENEM e vestibulares com inteligência artificial.",
  description:
    "Do conhecimento complexo à clareza: biblioteca curada, tutor de IA que explica passo a passo, correção de redação e um plano de estudos que se adapta ao seu ritmo.",
};
