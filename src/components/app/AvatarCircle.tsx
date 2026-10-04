import { useAvatarUrl } from "@/lib/avatar";
import { initials } from "@/lib/platform";
import { cn } from "@/lib/utils";

/** Round avatar that shows the person's picture when set, else their initials. */
export function AvatarCircle({
  name,
  avatarPath,
  className,
}: {
  name: string;
  avatarPath?: string | null | undefined;
  className?: string | undefined;
}) {
  const url = useAvatarUrl(avatarPath);
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-semibold",
        className,
      )}
    >
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}
