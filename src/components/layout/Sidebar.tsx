"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, HelpCircle, PenTool,
  Video, Settings, LogOut, Zap, ChevronRight,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/lessons",    label: "Lessons",    icon: BookOpen },
  { href: "/quizzes",    label: "Quizzes",    icon: HelpCircle },
  { href: "/whiteboard", label: "Whiteboard", icon: PenTool },
  { href: "/recordings", label: "Recordings", icon: Video },
  { href: "/settings",   label: "Settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-ink-900 flex flex-col z-40 border-r border-ink-700">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-ink-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sage-400 flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-ink-900" />
          </div>
          <div>
            <p className="font-display text-chalk text-base leading-none tracking-wide">DeepBoard</p>
            <p className="text-ink-300 text-[10px] mt-0.5 font-mono">Smart Classroom</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active
                  ? "bg-chalk text-ink-900 font-medium"
                  : "text-ink-300 hover:bg-ink-700 hover:text-chalk"
              )}
            >
              <Icon size={16} className={cn(active ? "text-ink-900" : "text-ink-400 group-hover:text-chalk")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="text-ink-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-ink-700">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-sage-400 flex items-center justify-center flex-shrink-0">
            <span className="text-ink-900 text-xs font-medium">{getInitials(user?.name ?? "")}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-chalk text-xs font-medium truncate">{user?.name ?? "—"}</p>
            <p className="text-ink-400 text-[10px] truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-ink-400 hover:text-coral-300 hover:bg-ink-700 transition-all text-sm mt-0.5"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
