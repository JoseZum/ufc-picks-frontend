import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showRing?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function UserAvatar({ src, name, size = "md", className, showRing }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        showRing && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className
      )}
    >
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
