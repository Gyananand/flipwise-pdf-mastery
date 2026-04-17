import { cn } from "@/lib/utils";

export function TopicTag({ tag, className }: { tag: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary",
        className
      )}
    >
      {tag}
    </span>
  );
}
