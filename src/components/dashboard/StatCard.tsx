import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  accent?: "sage" | "amber" | "coral" | "ink";
}

export default function StatCard({ label, value, icon, trend, accent = "ink" }: StatCardProps) {
  const accents = {
    sage:  "bg-sage-50 text-sage-600",
    amber: "bg-amber-50 text-amber-600",
    coral: "bg-coral-50 text-coral-500",
    ink:   "bg-ink-100 text-ink-500",
  };

  return (
    <div className="bg-white border border-ink-100 rounded-xl p-5 animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accents[accent])}>
          {icon}
        </div>
        {trend && <span className="text-xs text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className="font-display text-3xl text-ink-800 leading-none mb-1">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}
