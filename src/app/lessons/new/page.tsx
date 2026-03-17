"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, ChevronLeft, Save, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { SUBJECTS, GRADES } from "@/lib/utils";
import { lessonsApi } from "@/lib/api";
import Link from "next/link";

const MOCK_AI_SLIDES = [
  { id: "s1", type: "text", title: "Introduction", content: "Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen." },
  { id: "s2", type: "text", title: "The Chloroplast",  content: "Photosynthesis occurs in the chloroplasts, specifically in the thylakoid membranes and stroma." },
  { id: "s3", type: "text", title: "Light Reactions",  content: "In the light-dependent reactions, solar energy is converted into chemical energy (ATP and NADPH)." },
  { id: "s4", type: "text", title: "Calvin Cycle",     content: "The Calvin cycle uses ATP and NADPH to convert CO₂ into glucose through a series of enzyme-driven reactions." },
  { id: "s5", type: "text", title: "Oxygen Release",   content: "Water molecules are split during the light reactions, releasing oxygen as a byproduct." },
  { id: "s6", type: "text", title: "Summary",          content: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂" },
];

function NewLessonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAI = searchParams.get("ai") === "true";

  const [mode, setMode] = useState<"ai" | "manual">(isAI ? "ai" : "manual");
  const [aiTopic, setAiTopic] = useState("");
  const [aiGrade, setAiGrade] = useState("Grade 8");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle]     = useState("");
  const [subject, setSubject] = useState("Biology");
  const [slides, setSlides]   = useState<typeof MOCK_AI_SLIDES>([]);

  async function handleGenerate() {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    setTitle(`${aiTopic} — ${aiGrade}`);
    setSlides(MOCK_AI_SLIDES);
    setMode("manual");
    setGenerating(false);
  }

  async function handleSave() {
    if (!title.trim() || !subject.trim()) return;
    setSaving(true);
    try {
      await lessonsApi.create({
        title,
        subject,
        status: "draft",
        slides: slides.map((s) => ({
          type: s.type,
          content: { title: s.title, text: s.content },
        })),
      });
      router.push("/lessons");
    } catch {
      setSaving(false);
    }
  }

  function addSlide() {
    setSlides((s) => [...s, { id: `s${Date.now()}`, type: "text", title: "New slide", content: "" }]);
  }

  function updateSlide(id: string, field: string, value: string) {
    setSlides((s) => s.map((sl) => sl.id === id ? { ...sl, [field]: value } : sl));
  }

  function removeSlide(id: string) {
    setSlides((s) => s.filter((sl) => sl.id !== id));
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lessons" className="text-ink-400 hover:text-ink-700 transition-colors p-1 rounded-lg hover:bg-ink-100">
          <ChevronLeft size={18} />
        </Link>
        <PageHeader title="New lesson" className="mb-0 flex-1" />
        <Button icon={<Save size={14} />} loading={saving} onClick={handleSave}>Save lesson</Button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-ink-100 rounded-xl w-fit">
        {(["ai", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${mode === m ? "bg-white text-ink-800 shadow-sm" : "text-ink-500 hover:text-ink-700"}`}
          >
            {m === "ai" && <Sparkles size={13} className="text-amber-500" />}
            {m === "ai" ? "AI generate" : "Build manually"}
          </button>
        ))}
      </div>

      {mode === "ai" && (
        <div className="bg-ink-900 rounded-2xl p-6 mb-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-300" />
            <h2 className="font-display text-xl text-chalk">AI Lesson Generator</h2>
          </div>
          <p className="text-ink-400 text-sm mb-5">Describe your topic and grade level — we'll generate a full lesson with slides in seconds.</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-ink-400 mb-1.5">Topic / subject</label>
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Photosynthesis and the water cycle"
                className="w-full bg-ink-800 border border-ink-600 rounded-lg py-2.5 px-3 text-sm text-chalk placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1.5">Grade level</label>
              <select
                value={aiGrade}
                onChange={(e) => setAiGrade(e.target.value)}
                className="w-full bg-ink-800 border border-ink-600 rounded-lg py-2.5 px-3 text-sm text-chalk focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              >
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            loading={generating}
            icon={<Sparkles size={14} />}
            className="bg-amber-400 hover:bg-amber-300 text-ink-900 border-0 w-full justify-center py-2.5"
          >
            {generating ? "Generating your lesson…" : "Generate lesson"}
          </Button>
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-6 animate-fade-up">
          {/* Lesson meta */}
          <div className="bg-white border border-ink-100 rounded-xl p-5">
            <h3 className="font-display text-lg text-ink-800 mb-4">Lesson details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Lesson title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Photosynthesis & The Carbon Cycle" />
              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-ink-200 rounded-lg py-2.5 px-3 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-300 transition-all"
                >
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Slides */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-ink-800">Slides <span className="text-ink-400 text-sm font-body">({slides.length})</span></h3>
              <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={addSlide}>Add slide</Button>
            </div>

            {slides.length === 0 ? (
              <div className="border-2 border-dashed border-ink-200 rounded-xl p-10 text-center">
                <p className="text-ink-400 text-sm mb-3">No slides yet. Add your first slide or use AI to generate them.</p>
                <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={addSlide}>Add slide</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {slides.map((slide, i) => (
                  <div key={slide.id} className="bg-white border border-ink-100 rounded-xl p-4 group">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-6 h-6 rounded-md bg-ink-100 text-ink-500 text-xs font-mono flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <input
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, "title", e.target.value)}
                        className="flex-1 text-sm font-medium text-ink-800 bg-transparent border-b border-transparent focus:border-ink-300 focus:outline-none pb-0.5 transition-all"
                        placeholder="Slide title"
                      />
                      <button onClick={() => removeSlide(slide.id)} className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-coral-500 transition-all p-1 rounded">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <textarea
                      value={slide.content}
                      onChange={(e) => updateSlide(slide.id, "content", e.target.value)}
                      rows={3}
                      className="w-full text-sm text-ink-600 bg-ink-50 rounded-lg p-3 border border-ink-100 focus:outline-none focus:ring-2 focus:ring-ink-200 resize-none transition-all"
                      placeholder="Slide content…"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewLessonPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-400">Loading…</div>}>
      <NewLessonContent />
    </Suspense>
  );
}
