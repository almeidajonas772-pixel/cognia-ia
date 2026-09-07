import {
  BookOpen,
  Languages,
  Sigma,
  Leaf,
  Landmark,
  Globe2,
  PenLine,
  Library,
  Atom,
  FlaskConical,
  Brain,
  Users,
  Palette,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  BookOpen,
  Languages,
  Sigma,
  Leaf,
  Landmark,
  Globe2,
  PenLine,
  Atom,
  FlaskConical,
  Brain,
  Users,
  Palette,
  Dumbbell,
};

export function SubjectIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && MAP[name]) || Library;
  return <Icon className={className} />;
}
