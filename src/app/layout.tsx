import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import StoreProvider from "@/components/providers/StoreProvider";
import PWAProvider from "@/components/providers/PWAProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e1d18",
};

export const metadata: Metadata = {
  title: "DeepBoard — Smart Classroom Platform",
  description: "AI-powered lesson management for Dahua DeepHub smartboards",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DeepBoard",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        <StoreProvider>{children}</StoreProvider>
        <PWAProvider />
      </body>
    </html>
  );
}
