import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-ink-100 rounded-xl p-5",
        hover && "card-lift cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 stagger", className)}>
      {children}
    </div>
  );
}
