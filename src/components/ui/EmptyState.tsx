import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-4 text-ink-400">
        {icon}
      </div>
      <h3 className="font-display text-xl text-ink-700 mb-1">{title}</h3>
      <p className="text-sm text-ink-400 max-w-xs mb-5">{description}</p>
      {action}
    </div>
  );
}
