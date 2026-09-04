import { PageSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return <PageSkeleton cards={8} maxWidth="max-w-4xl" />;
}
