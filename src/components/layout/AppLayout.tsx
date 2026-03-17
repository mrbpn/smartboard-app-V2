"use client";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-chalk">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
