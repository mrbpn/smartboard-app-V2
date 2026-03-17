"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Button from "@/components/ui/Button";

const schema = z.object({
  name:     z.string().min(2, "At least 2 characters"),
  email:    z.string().email("Valid email required"),
  password: z.string().min(6, "At least 6 characters"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });
type FormData = z.infer<typeof schema>;
const cls = "w-full bg-ink-800 border border-ink-600 rounded-lg py-2.5 pl-9 pr-3 text-sm text-chalk placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-sage-400 transition-all";

export default function RegisterPage() {
  const router = useRouter();
  const loadUser = useAuthStore((s) => s.loadUser);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await authApi.register(data.name, data.email, data.password);
      await loadUser();
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError("root", { message: err instanceof Error ? err.message : "Registration failed" });
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-chalk mb-2">Create your account</h1>
        <p className="text-ink-400 text-sm">Start teaching smarter today</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-1.5">Full name</label>
          <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input {...register("name")} placeholder="Ms. Sarah Chen" className={cls} /></div>
          {errors.name && <p className="text-coral-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-1.5">Email</label>
          <div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input {...register("email")} type="email" placeholder="teacher@school.edu" className={cls} /></div>
          {errors.email && <p className="text-coral-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-1.5">Password</label>
          <div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input {...register("password")} type="password" placeholder="••••••••" className={cls} /></div>
          {errors.password && <p className="text-coral-400 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-1.5">Confirm password</label>
          <div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input {...register("confirm")} type="password" placeholder="••••••••" className={cls} /></div>
          {errors.confirm && <p className="text-coral-400 text-xs mt-1">{errors.confirm.message}</p>}
        </div>
        {errors.root && <div className="bg-coral-900/30 border border-coral-700 rounded-lg px-3 py-2 text-coral-300 text-sm">{errors.root.message}</div>}
        <Button type="submit" loading={isSubmitting} className="w-full bg-sage-500 hover:bg-sage-400 text-white border-0 py-2.5 mt-2">Create account</Button>
      </form>
      <p className="text-ink-500 text-sm text-center mt-6">Already have an account? <Link href="/login" className="text-sage-400 hover:text-sage-300">Sign in</Link></p>
    </div>
  );
}
