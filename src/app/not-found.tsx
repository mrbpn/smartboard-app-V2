import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-chalk flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-8xl text-ink-200 mb-4">404</p>
        <h1 className="font-display text-2xl text-ink-700 mb-2">Page not found</h1>
        <p className="text-ink-400 text-sm mb-6">This page doesn't exist or was moved.</p>
        <Link href="/dashboard"><Button>Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
