"use client";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Plus, HelpCircle, Save, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { lessonsApi } from "@/lib/api";
import { subjectColor, formatDate } from "@/lib/utils";
import type { Lesson } from "@/types";

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    lessonsApi.get(id)
      .then((res) => setLesson(res.data.data))
      .catch(() => setError("Could not load lesson."))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveSlide() {
    if (!lesson) return;
    setSaving(true);
    try {
      await lessonsApi.update(id, { slides: lesson.slides });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 size={24} className="animate-spin text-ink-400" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-8">
        <Link href="/lessons" className="text-ink-400 hover:text-ink-700 flex items-center gap-1 mb-4 text-sm">
          <ChevronLeft size={14} /> Back to lessons
        </Link>
        <p className="text-coral-500">{error || "Lesson not found."}</p>
      </div>
    );
  }

  const slides: { id: string; title: string; content: string }[] =
    Array.isArray(lesson.slides) && lesson.slides.length > 0
      ? (lesson.slides as unknown as { id: string; title: string; content: string }[])
      : [{ id: "s1", title: "Introduction", content: "Start writing your lesson content here…" }];

  const slide = slides[currentSlide] ?? slides[0];

  function updateSlideField(field: "title" | "content", value: string) {
    if (!lesson) return;
    const updated = slides.map((s, i) =>
      i === currentSlide ? { ...s, [field]: value } : s
    );
    setLesson({ ...lesson, slides: updated });
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/lessons" className="text-ink-400 hover:text-ink-700 transition-colors p-1 rounded-lg hover:bg-ink-100 mt-1">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`tag text-[10px] ${subjectColor(lesson.subject)}`}>{lesson.subject}</span>
            <Badge variant={lesson.status === "published" ? "success" : "draft"}>{lesson.status}</Badge>
            {lesson.ai_generated && <Badge variant="ai"><Sparkles size={9} className="mr-0.5" />AI</Badge>}
          </div>
          <h1 className="font-display text-3xl text-ink-800">{lesson.title}</h1>
          <p className="text-ink-400 text-sm mt-0.5">Last updated {formatDate(lesson.updated_at)}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/quizzes/new?lesson=${lesson.id}`}>
            <Button variant="secondary" icon={<HelpCircle size={14} />}>Create quiz</Button>
          </Link>
          <Button icon={<Save size={14} />} loading={saving} onClick={saveSlide}
            className={saved ? "bg-sage-500 hover:bg-sage-500 border-0" : ""}>
            {saved ? "Saved!" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Slide list */}
        <div className="col-span-1">
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-3">Slides ({slides.length})</p>
          <div className="space-y-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 ${
                  currentSlide === i
                    ? "bg-ink-800 text-chalk"
                    : "bg-white border border-ink-100 text-ink-700 hover:border-ink-300"
                }`}
              >
                <span className={`text-[10px] font-mono flex-shrink-0 ${currentSlide === i ? "text-ink-400" : "text-ink-300"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm truncate">{s.title}</span>
              </button>
            ))}
            <button
              onClick={() => {
                if (!lesson) return;
                const newSlide = { id: `s${Date.now()}`, title: "New Slide", content: "" };
                setLesson({ ...lesson, slides: [...slides, newSlide] });
                setCurrentSlide(slides.length);
              }}
              className="w-full text-left px-3 py-3 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-ink-400 hover:text-ink-600 transition-all flex items-center gap-2 text-sm"
            >
              <Plus size={13} /> Add slide
            </button>
          </div>
        </div>

        {/* Slide editor */}
        <div className="col-span-2">
          <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
            {/* Slide preview */}
            <div className="bg-chalk-warm min-h-64 p-10 relative border-b border-ink-100">
              <div
                className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "radial-gradient(circle, #1e1d18 1px, transparent 1px)", backgroundSize: "24px 24px" }}
              />
              <div className="relative z-10 max-w-lg">
                <p className="text-ink-300 text-xs font-mono mb-3">Slide {currentSlide + 1} / {slides.length}</p>
                <h2 className="font-display text-3xl text-ink-800 mb-4">{slide.title}</h2>
                <p className="text-ink-600 leading-relaxed whitespace-pre-wrap">{slide.content}</p>
              </div>
            </div>

            {/* Edit area */}
            <div className="p-5 space-y-3">
              <input
                value={slide.title}
                onChange={(e) => updateSlideField("title", e.target.value)}
                className="w-full font-display text-xl text-ink-800 bg-transparent border-b border-transparent focus:border-ink-300 focus:outline-none pb-1 transition-all"
                placeholder="Slide title"
              />
              <textarea
                value={slide.content}
                onChange={(e) => updateSlideField("content", e.target.value)}
                rows={5}
                className="w-full text-sm text-ink-600 bg-ink-50 rounded-xl p-4 border border-ink-100 focus:outline-none focus:ring-2 focus:ring-ink-200 resize-none"
                placeholder="Slide content…"
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-5 pb-5">
              <Button
                variant="secondary" size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={currentSlide === 0}
                onClick={() => setCurrentSlide((i) => i - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-ink-400 font-mono">{currentSlide + 1} / {slides.length}</span>
              <Button
                variant="secondary" size="sm"
                disabled={currentSlide === slides.length - 1}
                onClick={() => setCurrentSlide((i) => i + 1)}
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
