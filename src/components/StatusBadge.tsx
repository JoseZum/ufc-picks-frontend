import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "correct" | "incorrect" | "open" | "locked";
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "status-pending",
  },
  correct: {
    label: "Correct",
    className: "status-correct",
  },
  incorrect: {
    label: "Incorrect",
    className: "status-incorrect",
  },
  open: {
    label: "Open",
    className: "bg-success/20 text-success border-success/30",
  },
  locked: {
    label: "Locked",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
