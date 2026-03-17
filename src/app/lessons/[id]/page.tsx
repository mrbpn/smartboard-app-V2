"use client";
import { useState, use } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, Plus, BookOpen, HelpCircle, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { MOCK_LESSONS } from "@/lib/mock";
import { subjectColor, formatDate } from "@/lib/utils";

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lesson = MOCK_LESSONS.find((l) => l.id === id) ?? MOCK_LESSONS[0];

  const slides = [
    { id: "s1", title: "Introduction",   content: "Photosynthesis is the process by which plants convert sunlight, water, and CO₂ into glucose and oxygen. It is the foundation of most food chains on Earth." },
    { id: "s2", title: "The Chloroplast",content: "Photosynthesis takes place in the chloroplasts — organelles containing the green pigment chlorophyll, which captures solar energy." },
    { id: "s3", title: "Light Reactions", content: "Solar energy splits water molecules (photolysis), generating ATP, NADPH, and releasing O₂ as a byproduct. This happens in the thylakoid membranes." },
    { id: "s4", title: "Calvin Cycle",   content: "CO₂ is 'fixed' into organic molecules using ATP and NADPH from the light reactions. This happens in the stroma of the chloroplast." },
    { id: "s5", title: "Summary",        content: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nThe energy stored in glucose powers nearly all life on Earth." },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];

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
          <Button icon={<Save size={14} />}>Save changes</Button>
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
                <span className={`text-[10px] font-mono flex-shrink-0 ${currentSlide === i ? "text-ink-400" : "text-ink-300"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm truncate">{s.title}</span>
              </button>
            ))}
            <button className="w-full text-left px-3 py-3 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 hover:border-ink-400 hover:text-ink-600 transition-all flex items-center gap-2 text-sm">
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
                defaultValue={slide.title}
                className="w-full font-display text-xl text-ink-800 bg-transparent border-b border-transparent focus:border-ink-300 focus:outline-none pb-1 transition-all"
                placeholder="Slide title"
              />
              <textarea
                defaultValue={slide.content}
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
