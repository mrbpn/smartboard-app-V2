import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-900 flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#1e7a42_0%,_transparent_60%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#f0b224_0%,_transparent_60%)] opacity-10" />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(#f5f2eb 1px, transparent 1px), linear-gradient(90deg, #f5f2eb 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sage-400 flex items-center justify-center">
            <Zap size={16} className="text-ink-900" />
          </div>
          <span className="font-display text-chalk text-xl">DeepBoard</span>
        </div>

        <div className="relative z-10">
          <blockquote className="font-display text-4xl text-chalk leading-tight mb-6">
            "Teaching is the <em>art of</em><br />
            assisted discovery."
          </blockquote>
          <p className="text-ink-300 text-sm">— Mark Van Doren</p>
        </div>

        <div className="relative z-10 flex gap-6">
          {[["1,000+", "Lesson templates"], ["200+", "Students per canvas"], ["4K", "Display quality"]].map(([v, l]) => (
            <div key={l}>
              <p className="font-display text-2xl text-chalk">{v}</p>
              <p className="text-ink-400 text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
