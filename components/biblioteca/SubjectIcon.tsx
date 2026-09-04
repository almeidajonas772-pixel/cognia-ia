import {
  BookOpen,
  Languages,
  Sigma,
  Leaf,
  Landmark,
  Globe2,
  PenLine,
  Library,
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
