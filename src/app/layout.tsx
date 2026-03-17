import type { Metadata } from "next";
import "@/styles/globals.css";
import StoreProvider from "@/components/providers/StoreProvider";

export const metadata: Metadata = {
  title: "DeepBoard — Smart Classroom Platform",
  description: "AI-powered lesson management for Dahua DeepHub smartboards",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
