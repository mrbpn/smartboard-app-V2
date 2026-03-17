"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Plus, Trash2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MOCK_LESSONS } from "@/lib/mock";

type QType = "mcq" | "truefalse" | "open";
interface Q { id: string; body: string; type: QType; options: string[]; correct: string; }

const EMPTY_Q = (): Q => ({ id: `q-${Date.now()}`, body: "", type: "mcq", options: ["", "", "", ""], correct: "" });

function NewQuizContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lessonId = params.get("lesson") ?? "";

  const [title, setTitle]       = useState("");
  const [lesson, setLesson]     = useState(lessonId);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState<Q[]>([EMPTY_Q()]);
  const [saving, setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!lesson) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1600));
    setTitle("AI-Generated Quiz");
    setQuestions([
      { id: "q1", body: "What is the primary purpose of photosynthesis?", type: "mcq", options: ["Produce oxygen only", "Convert sunlight to glucose", "Absorb water from soil", "Release carbon dioxide"], correct: "Convert sunlight to glucose" },
      { id: "q2", body: "Chlorophyll is found in the chloroplast.", type: "truefalse", options: ["True", "False"], correct: "True" },
      { id: "q3", body: "What is the chemical formula for glucose?", type: "mcq", options: ["CO₂", "H₂O", "C₆H₁₂O₆", "O₂"], correct: "C₆H₁₂O₆" },
    ]);
    setGenerating(false);
  }

  function addQ() { setQuestions((q) => [...q, EMPTY_Q()]); }
  function removeQ(id: string) { setQuestions((q) => q.filter((x) => x.id !== id)); }
  function updateQ(id: string, field: string, val: unknown) {
    setQuestions((q) => q.map((x) => x.id === id ? { ...x, [field]: val } : x));
  }
  function updateOption(id: string, i: number, val: string) {
    setQuestions((q) => q.map((x) => x.id === id ? { ...x, options: x.options.map((o, j) => j === i ? val : o) } : x));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push("/quizzes");
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/quizzes" className="text-ink-400 hover:text-ink-700 transition-colors p-1 rounded-lg hover:bg-ink-100">
          <ChevronLeft size={18} />
        </Link>
        <PageHeader title="New quiz" className="mb-0 flex-1" />
        <Button icon={<Save size={14} />} loading={saving} onClick={handleSave}>Save quiz</Button>
      </div>

      {/* Meta */}
      <div className="bg-white border border-ink-100 rounded-xl p-5 mb-5 space-y-4">
        <h3 className="font-display text-lg text-ink-800">Quiz details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Quiz" />
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1.5">Linked lesson</label>
            <select value={lesson} onChange={(e) => setLesson(e.target.value)}
              className="w-full bg-white border border-ink-200 rounded-lg py-2.5 px-3 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-300">
              <option value="">— None —</option>
              {MOCK_LESSONS.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink-600 mb-1.5">Time per question (seconds)</label>
            <input type="number" min={10} max={300} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full bg-white border border-ink-200 rounded-lg py-2.5 px-3 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-300" />
          </div>
          {lesson && (
            <div className="flex-1 pt-6">
              <Button variant="secondary" icon={<Sparkles size={13} className="text-amber-500" />} loading={generating} onClick={handleGenerate} className="w-full justify-center">
                AI-generate questions
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white border border-ink-100 rounded-xl p-5 group">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-6 rounded-md bg-ink-100 text-ink-500 text-xs font-mono flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="flex gap-2 flex-1">
                {(["mcq", "truefalse", "open"] as QType[]).map((t) => (
                  <button key={t} onClick={() => updateQ(q.id, "type", t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${q.type === t ? "bg-ink-800 text-chalk" : "bg-ink-100 text-ink-500 hover:bg-ink-200"}`}>
                    {t === "mcq" ? "Multiple choice" : t === "truefalse" ? "True / False" : "Open"}
                  </button>
                ))}
              </div>
              <button onClick={() => removeQ(q.id)} className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-coral-500 transition-all">
                <Trash2 size={14} />
              </button>
            </div>

            <textarea value={q.body} onChange={(e) => updateQ(q.id, "body", e.target.value)}
              placeholder="Question text…" rows={2}
              className="w-full text-sm text-ink-700 bg-ink-50 rounded-lg p-3 border border-ink-100 focus:outline-none focus:ring-2 focus:ring-ink-200 resize-none mb-3" />

            {q.type === "mcq" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, j) => (
                  <div key={j} className="relative">
                    <input value={opt} onChange={(e) => updateOption(q.id, j, e.target.value)}
                      placeholder={`Option ${j + 1}`}
                      className="w-full text-sm border border-ink-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ink-200 pr-8" />
                    <input type="radio" name={`correct-${q.id}`} checked={q.correct === opt}
                      onChange={() => updateQ(q.id, "correct", opt)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 accent-sage-500" title="Mark as correct" />
                  </div>
                ))}
              </div>
            )}

            {q.type === "truefalse" && (
              <div className="flex gap-2 mb-3">
                {["True", "False"].map((o) => (
                  <button key={o} onClick={() => updateQ(q.id, "correct", o)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${q.correct === o ? "bg-sage-500 text-white border-sage-500" : "border-ink-200 text-ink-600 hover:border-ink-400"}`}>
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="secondary" icon={<Plus size={14} />} onClick={addQ}>Add question</Button>
    </div>
  );
}

export default function NewQuizPage() {
  return <Suspense fallback={<div className="p-8 text-ink-400">Loading…</div>}><NewQuizContent /></Suspense>;
}
