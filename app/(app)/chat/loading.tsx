import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatLoading() {
  return (
    <div className="mx-auto flex h-[70vh] max-w-3xl flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="ml-auto h-12 w-2/3" />
        <Skeleton className="h-24 w-4/5" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
