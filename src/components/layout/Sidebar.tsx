"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, HelpCircle, PenTool,
  Video, Settings, LogOut, Zap, ChevronRight, PanelLeftClose, PanelLeftOpen,
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

export default function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Collapsed tab — visible only when sidebar is hidden */}
      {!open && (
        <button
          onClick={onToggle}
          title="Open menu"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-ink-800 border border-ink-700 border-l-0 rounded-r-lg px-1.5 py-3 text-ink-300 hover:text-chalk hover:bg-ink-700 transition-all shadow-lg"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

    <aside
      className="fixed left-0 top-0 h-screen w-56 bg-ink-900 flex flex-col z-40 border-r border-ink-700 transition-transform duration-300"
      style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
    >
      {/* Logo + collapse toggle */}
      <div className="px-5 py-5 border-b border-ink-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sage-400 flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-ink-900" />
          </div>
          <div className="flex-1">
            <p className="font-display text-chalk text-base leading-none tracking-wide">DeepBoard</p>
            <p className="text-ink-300 text-[10px] mt-0.5 font-mono">Smart Classroom</p>
          </div>
          <button
            onClick={onToggle}
            title="Collapse menu"
            className="text-ink-500 hover:text-chalk transition-colors p-0.5 rounded"
          >
            <PanelLeftClose size={15} />
          </button>
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
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-ink-400 hover:text-coral-300 hover:bg-ink-700 transition-all text-sm mt-0.5"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
