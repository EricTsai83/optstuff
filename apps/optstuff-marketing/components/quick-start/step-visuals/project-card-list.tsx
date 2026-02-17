import { cn } from "@workspace/ui/lib/utils";
import { FolderOpen } from "lucide-react";

const PROJECTS = [
  { name: "my-website", keyCount: "3 keys" },
  { name: "blog-images", keyCount: "1 key" },
] as const;

const VARIANT_STYLES = {
  regular: {
    list: "space-y-1.5 sm:space-y-2",
    card: "gap-2 p-1.5 sm:gap-2.5 sm:p-2",
    icon: "h-3 w-3 sm:h-3.5 sm:w-3.5",
    name: "text-[8px] sm:text-[10px]",
    meta: "text-[7px] sm:text-[9px]",
  },
  compact: {
    list: "space-y-1 sm:space-y-1.5",
    card: "gap-1.5 p-1 sm:gap-2 sm:p-1.5",
    icon: "h-2.5 w-2.5 sm:h-3 sm:w-3",
    name: "text-[7px] sm:text-[9px]",
    meta: "text-[6px] sm:text-[8px]",
  },
} as const;

type ProjectCardListVariant = keyof typeof VARIANT_STYLES;

type ProjectCardListProps = {
  readonly variant?: ProjectCardListVariant;
};

/** Renders a list of fake mini project cards used in quick-start step visuals. */
export function ProjectCardList({
  variant = "regular",
}: ProjectCardListProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={styles.list}>
      {PROJECTS.map((project) => (
        <div
          key={project.name}
          className={cn(
            "border-border/50 flex items-center rounded-md border sm:rounded-lg",
            styles.card,
          )}
        >
          <FolderOpen
            className={cn("text-muted-foreground shrink-0", styles.icon)}
          />
          <span className={cn("text-foreground font-medium", styles.name)}>
            {project.name}
          </span>
          <span className={cn("text-muted-foreground ml-auto", styles.meta)}>
            {project.keyCount}
          </span>
        </div>
      ))}
    </div>
  );
}
