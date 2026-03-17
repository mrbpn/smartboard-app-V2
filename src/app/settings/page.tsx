"use client";
import { useState, useEffect } from "react";
import { User, Bell, Monitor, Shield, Key, ChevronRight, Check } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/utils";

const SECTIONS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "display",       label: "Display",       icon: Monitor },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "api",           label: "API & Integrations", icon: Key },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [section, setSection] = useState("profile");
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");

  const [notifs, setNotifs] = useState({
    quiz_results: true, lesson_sync: true, recording_ready: true, weekly_report: false,
  });

  // Populate from real user once loaded
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  async function save() {
    if (section === "profile") {
      setSaving(true);
      setError("");
      try {
        const res = await api.patch("/auth/me", { name, email });
        // Update the store directly with the response so the sidebar refreshes immediately
        useAuthStore.setState({ user: res.data.data });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError("Failed to save changes. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-8">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  section === id
                    ? "bg-ink-800 text-chalk font-medium"
                    : "text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                }`}
              >
                <Icon size={15} />
                {label}
                {section === id && <ChevronRight size={12} className="ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-xl">

          {section === "profile" && (
            <div className="bg-white border border-ink-100 rounded-xl p-6 space-y-5 animate-fade-up">
              <h2 className="font-display text-xl text-ink-800">Profile</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-sage-400 flex items-center justify-center">
                  <span className="text-ink-900 text-xl font-medium">{getInitials(name)}</span>
                </div>
                <div>
                  <Button variant="secondary" size="sm">Change photo</Button>
                  <p className="text-xs text-ink-400 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>

              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1.5">Role</label>
                <select className="w-full bg-white border border-ink-200 rounded-lg py-2.5 px-3 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-300 transition-all">
                  <option>Teacher</option>
                  <option>Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1.5">School / Institution</label>
                <Input placeholder="e.g. Springfield Elementary" />
              </div>

              {error && <p className="text-coral-500 text-sm">{error}</p>}

              <Button
                icon={saved ? <Check size={14} /> : undefined}
                loading={saving}
                onClick={save}
                className={saved ? "bg-sage-500 hover:bg-sage-500 border-0" : ""}
              >
                {saved ? "Saved!" : "Save changes"}
              </Button>
            </div>
          )}

          {section === "notifications" && (
            <div className="bg-white border border-ink-100 rounded-xl p-6 animate-fade-up">
              <h2 className="font-display text-xl text-ink-800 mb-5">Notifications</h2>
              <div className="space-y-4">
                {Object.entries(notifs).map(([key, val]) => {
                  const labels: Record<string, [string, string]> = {
                    quiz_results:     ["Quiz results",      "Get notified when a quiz session ends and results are in."],
                    lesson_sync:      ["Lesson sync",       "Notify when lessons sync successfully from the smartboard."],
                    recording_ready:  ["Recording ready",   "Alert when a session recording has finished processing."],
                    weekly_report:    ["Weekly report",     "Receive a weekly summary of class performance."],
                  };
                  const [label, desc] = labels[key];
                  return (
                    <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-ink-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-ink-800">{label}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifs((n) => ({ ...n, [key]: !val }))}
                        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${val ? "bg-sage-500" : "bg-ink-200"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <Button className="mt-5" onClick={save} icon={saved ? <Check size={14} /> : undefined}>
                {saved ? "Saved!" : "Save preferences"}
              </Button>
            </div>
          )}

          {section === "display" && (
            <div className="bg-white border border-ink-100 rounded-xl p-6 animate-fade-up">
              <h2 className="font-display text-xl text-ink-800 mb-5">Display</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-600 mb-2">Default grid view</label>
                  <div className="flex gap-2">
                    {["grid", "list"].map((v) => (
                      <button key={v} className="px-4 py-2 rounded-lg border border-ink-200 text-sm text-ink-600 hover:border-ink-400 capitalize transition-all">
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-600 mb-2">Language</label>
                  <select className="w-full bg-white border border-ink-200 rounded-lg py-2.5 px-3 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-300">
                    <option>English</option>
                    <option>Nepali</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
              <Button className="mt-5" onClick={save} icon={saved ? <Check size={14} /> : undefined}>
                {saved ? "Saved!" : "Save preferences"}
              </Button>
            </div>
          )}

          {section === "security" && (
            <div className="bg-white border border-ink-100 rounded-xl p-6 animate-fade-up">
              <h2 className="font-display text-xl text-ink-800 mb-5">Security</h2>
              <div className="space-y-4">
                <Input label="Current password" type="password" placeholder="••••••••" />
                <Input label="New password" type="password" placeholder="••••••••" />
                <Input label="Confirm new password" type="password" placeholder="••••••••" />
              </div>
              <Button className="mt-5" variant="primary" onClick={save}>Update password</Button>

              <div className="mt-6 pt-6 border-t border-ink-100">
                <h3 className="font-medium text-ink-800 mb-1 text-sm">Two-factor authentication</h3>
                <p className="text-xs text-ink-400 mb-3">Add an extra layer of security to your account.</p>
                <Button variant="secondary" size="sm">Enable 2FA</Button>
              </div>

              <div className="mt-6 pt-6 border-t border-ink-100">
                <h3 className="font-medium text-coral-600 mb-1 text-sm">Danger zone</h3>
                <p className="text-xs text-ink-400 mb-3">Permanently delete your account and all data.</p>
                <Button variant="danger" size="sm">Delete account</Button>
              </div>
            </div>
          )}

          {section === "api" && (
            <div className="bg-white border border-ink-100 rounded-xl p-6 animate-fade-up">
              <h2 className="font-display text-xl text-ink-800 mb-2">API & Integrations</h2>
              <p className="text-sm text-ink-400 mb-5">API keys are managed server-side and never exposed to the client.</p>

              <div className="space-y-3">
                {[
                  { name: "Gemini API", desc: "AI lesson + quiz generation", status: true  },
                  { name: "Cloud Vision API", desc: "Handwriting OCR (cloud fallback)", status: true  },
                  { name: "ML Kit (on-device)", desc: "Offline handwriting recognition", status: true  },
                  { name: "Socket.io", desc: "Real-time quiz + canvas sync", status: true  },
                  { name: "Jitsi Meet", desc: "Hybrid class video conferencing", status: false },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg border border-ink-100">
                    <span className={`status-dot ${item.status ? "bg-sage-500" : "bg-ink-300"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">{item.name}</p>
                      <p className="text-xs text-ink-400">{item.desc}</p>
                    </div>
                    <span className={`text-xs ${item.status ? "text-sage-600" : "text-ink-400"}`}>
                      {item.status ? "Connected" : "Not configured"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 rounded-lg bg-ink-50 border border-ink-200">
                <p className="text-xs text-ink-500 font-mono">
                  Configure API keys in your backend <code>.env</code> file.<br />
                  See <span className="text-sage-600">.env.example</span> for required variables.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
