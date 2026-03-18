"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => !pathname.startsWith("/whiteboard"));

  return (
    <div className="flex min-h-screen bg-chalk">
      <Sidebar open={open} onToggle={() => setOpen((o) => !o)} />
      <main
        className="flex-1 min-h-screen overflow-x-hidden transition-all duration-300"
        style={{ marginLeft: open ? "14rem" : "0" }}
      >
        {children}
      </main>
    </div>
  );
}
