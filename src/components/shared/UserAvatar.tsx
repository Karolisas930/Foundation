/**
 * UserAvatar — small leaf component that renders a user's avatar image
 * with initials fallback. Pure UI, no data fetching.
 */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "U").trim();
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SIZE_CLASS: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
};

export function UserAvatar({ name, email, src, size = "md", className }: UserAvatarProps) {
  return (
    <Avatar className={cn(SIZE_CLASS[size], "border border-white/15", className)}>
      {src ? <AvatarImage src={src} alt={name ?? email ?? "User avatar"} /> : null}
      <AvatarFallback className="bg-white/10 font-bold text-white">
        {getInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;
