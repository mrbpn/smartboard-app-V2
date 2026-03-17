"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Rehydrate zustand store from localStorage only on the client,
    // after the initial render matches the server output.
    useAuthStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
