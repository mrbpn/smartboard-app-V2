"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Users, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface Question {
  id: string;
  body: string;
  type: string;
  options: string[];
  correct: string;
}

interface SessionData {
  session_id: string;
  quiz_title: string;
  time_limit_sec: number;
  questions: Question[];
}

type Phase = "join" | "loading" | "waiting" | "question" | "result" | "finished" | "error";

export default function JoinPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const [phase, setPhase]       = useState<Phase>("join");
  const [alias, setAlias]       = useState("");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [qIndex, setQIndex]     = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timer, setTimer]       = useState(30);
  const [score, setScore]       = useState(0);
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");

  // Timer countdown during question
  useEffect(() => {
    if (phase !== "question") return;
    if (timer <= 0) { handleNext(); return; }
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timer]);

  async function handleJoin() {
    if (!alias.trim()) return;
    setPhase("loading");
    try {
      const res = await fetch(`/api/join?code=${code.toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Session not found or has ended.");
        setPhase("error");
        return;
      }
      setSessionData(data.data);
      setPhase("waiting");
      setTimeout(() => {
        setPhase("question");
        setTimer(data.data.time_limit_sec ?? 30);
      }, 1500);
    } catch {
      setErrorMsg("Could not connect. Please check your internet and try again.");
      setPhase("error");
    }
  }

  async function handleAnswer(opt: string) {
    if (selected || !sessionData) return;
    setSelected(opt);
    const q = sessionData.questions[qIndex];
    const correct = opt === q.correct;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => ({ ...a, [q.id]: opt }));

    // Submit answer to server
    fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionData.session_id,
        question_id: q.id,
        student_alias: alias,
        answer: opt,
        is_correct: correct,
      }),
    }).catch(() => {});

    setTimeout(() => handleNext(), 1200);
  }

  function handleNext() {
    if (!sessionData) return;
    if (qIndex + 1 >= sessionData.questions.length) {
      setPhase("finished");
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
      setTimer(sessionData.time_limit_sec ?? 30);
      setPhase("question");
    }
  }

  const questions = sessionData?.questions ?? [];
  const q = questions[qIndex];
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {phase === "join" && (
          <div className="bg-white rounded-2xl p-8 animate-fade-up text-center">
            <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-sage-600" />
            </div>
            <h1 className="font-display text-2xl text-ink-800 mb-1">Join Quiz</h1>
            <p className="text-ink-400 text-sm mb-6">Code: <span className="font-mono font-medium text-ink-700">{code.toUpperCase()}</span></p>
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Your name"
              className="w-full border border-ink-200 rounded-xl py-3 px-4 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-sage-400 mb-4"
              autoFocus
            />
            <Button onClick={handleJoin} className="w-full py-3 text-base">Join session</Button>
          </div>
        )}

        {phase === "loading" && (
          <div className="text-center animate-fade-up">
            <Loader2 size={32} className="animate-spin text-sage-400 mx-auto mb-4" />
            <p className="text-chalk text-lg font-display">Connecting…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
            <p className="text-coral-500 font-medium mb-4">{errorMsg}</p>
            <Button onClick={() => setPhase("join")} variant="secondary">Try again</Button>
          </div>
        )}

        {phase === "waiting" && (
          <div className="text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full border-4 border-sage-500/30 border-t-sage-500 animate-spin mx-auto mb-4" />
            <p className="text-chalk text-lg font-display">
              {sessionData?.quiz_title ?? "Quiz"}
            </p>
            <p className="text-ink-400 text-sm mt-1">Hi, {alias}! Get ready.</p>
          </div>
        )}

        {phase === "question" && q && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <span className="text-ink-400 text-sm">{qIndex + 1} / {questions.length}</span>
              <div className={`flex items-center gap-1.5 text-sm font-mono ${timer <= 10 ? "text-coral-400" : "text-chalk"}`}>
                <Clock size={14} />
                {timer}s
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 mb-4">
              <p className="text-ink-800 font-medium text-lg leading-snug">{q.body}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt) => {
                const isCorrect = selected && opt === q.correct;
                const isWrong   = selected === opt && opt !== q.correct;
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selected}
                    className={`w-full py-4 px-5 rounded-xl text-left font-medium transition-all border-2 ${
                      isCorrect ? "bg-sage-500 border-sage-500 text-white" :
                      isWrong   ? "bg-coral-500 border-coral-500 text-white" :
                      selected  ? "bg-white/10 border-white/10 text-ink-400" :
                      "bg-white border-white text-ink-800 hover:border-sage-400 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {opt}
                      {isCorrect && <CheckCircle2 size={18} />}
                      {isWrong   && <XCircle size={18} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "finished" && (
          <div className="bg-white rounded-2xl p-8 text-center animate-fade-up">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${pct >= 70 ? "bg-sage-100" : "bg-amber-100"}`}>
              <span className="font-display text-3xl">{pct >= 70 ? "🎉" : "📚"}</span>
            </div>
            <h2 className="font-display text-2xl text-ink-800 mb-1">
              {pct >= 70 ? "Well done!" : "Good effort!"}
            </h2>
            <p className="text-ink-500 text-sm mb-6">{alias}</p>
            <div className="bg-ink-50 rounded-xl p-5 mb-4">
              <p className="font-display text-5xl text-ink-800 mb-1">{pct}%</p>
              <p className="text-ink-400 text-sm">{score} of {questions.length} correct</p>
            </div>
            <div className="space-y-2 text-left">
              {questions.map((mq) => {
                const ans = answers[mq.id];
                const ok  = ans === mq.correct;
                return (
                  <div key={mq.id} className={`flex items-start gap-2 text-sm rounded-lg p-2.5 ${ok ? "bg-sage-50" : "bg-coral-50"}`}>
                    {ok ? <CheckCircle2 size={14} className="text-sage-600 flex-shrink-0 mt-0.5" /> : <XCircle size={14} className="text-coral-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-ink-700 text-xs line-clamp-1">{mq.body}</p>
                      <p className={`text-[11px] mt-0.5 ${ok ? "text-sage-600" : "text-coral-500"}`}>
                        {ok ? "Correct" : `Your answer: ${ans ?? "—"} · Correct: ${mq.correct}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
