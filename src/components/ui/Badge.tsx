import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "ai" | "draft";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-ink-100 text-ink-600",
    success: "bg-sage-100 text-sage-700",
    warning: "bg-amber-100 text-amber-700",
    danger:  "bg-coral-100 text-coral-600",
    ai:      "bg-amber-100 text-amber-700",
    draft:   "bg-ink-100 text-ink-400",
  };

  return (
    <span className={cn("tag", variants[variant], className)}>
      {children}
    </span>
  );
}
