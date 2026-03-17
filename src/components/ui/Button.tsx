import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  variant = "primary", size = "md", loading, icon, children, className, disabled, ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-body font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:   "bg-ink-800 text-chalk hover:bg-ink-700 focus:ring-ink-400",
    secondary: "bg-chalk-warm border border-ink-200 text-ink-700 hover:bg-ink-50 focus:ring-ink-300",
    ghost:     "text-ink-500 hover:bg-ink-100 hover:text-ink-800 focus:ring-ink-300",
    danger:    "bg-coral-500 text-white hover:bg-coral-600 focus:ring-coral-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
