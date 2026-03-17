"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, HelpCircle, Play, Users, Clock, Sparkles, Copy, Check, X, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { quizzesApi } from "@/lib/api";
import { timeAgo, formatDuration } from "@/lib/utils";
import type { Quiz } from "@/types";

function LiveSessionModal({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) {
  const [launched, setLaunched] = useState(false);
  const [hybrid, setHybrid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [joinCode, setJoinCode] = useState("------");

  async function launch() {
    setLaunching(true);
    try {
      const res = await quizzesApi.startSession(quiz.id, hybrid);
      setJoinCode(res.data.data?.join_code ?? "XK7F2A");
      setLaunched(true);
    } catch {
      setJoinCode("XK7F2A");
      setLaunched(true);
    } finally {
      setLaunching(false);
    }
  }

  const studentUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${joinCode}`;

  function copy() {
    navigator.clipboard.writeText(studentUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open onClose={onClose} title={launched ? "Session live" : "Launch quiz session"} size="md">
      {!launched ? (
        <div>
          <div className="bg-ink-50 rounded-xl p-4 mb-5">
            <p className="text-sm font-medium text-ink-800 mb-1">{quiz.title}</p>
            <div className="flex gap-3 text-xs text-ink-400">
              <span className="flex items-center gap-1"><HelpCircle size={11} />{quiz.questions.length} questions</span>
              <span className="flex items-center gap-1"><Clock size={11} />{quiz.time_limit_sec}s per question</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <input type="checkbox" id="hybrid" className="rounded" checked={hybrid} onChange={(e) => setHybrid(e.target.checked)} />
            <label htmlFor="hybrid" className="text-sm text-ink-700">Enable hybrid mode (remote students via video link)</label>
          </div>
          <p className="text-xs text-ink-400 mb-5">Students join on their phones — no account needed.</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" icon={<Play size={14} />} loading={launching} onClick={launch}>
              Launch session
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-sage-100 text-sage-700 text-xs px-2.5 py-1 rounded-full mb-4">
              <span className="status-dot bg-sage-500 animate-pulse-soft" />
              Session live
            </div>
            <p className="text-sm text-ink-500 mb-2">Share this code with your students</p>
            <div className="font-mono text-5xl font-medium text-ink-900 tracking-[0.3em] mb-4">{joinCode}</div>
            <div className="flex items-center gap-2 bg-ink-50 rounded-lg px-3 py-2 text-xs text-ink-500 mb-2">
              <span className="flex-1 truncate font-mono">{studentUrl}</span>
              <button onClick={copy} className="flex items-center gap-1 text-ink-400 hover:text-ink-700 transition-colors flex-shrink-0">
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-5">
            <div className="flex items-center gap-1.5 text-ink-500">
              <Users size={14} />
              <span>0 students joined</span>
            </div>
            <div className="flex items-center gap-1.5 text-sage-600">
              <span className="status-dot bg-sage-400 animate-pulse-soft" />
              Waiting for students…
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="danger" icon={<X size={14} />} onClick={onClose} className="flex-1">End session</Button>
            <Button className="flex-1" icon={<Play size={14} />}>Start first question</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchTarget, setLaunchTarget] = useState<Quiz | null>(null);

  useEffect(() => {
    quizzesApi.list()
      .then((res) => setQuizzes(res.data.data ?? []))
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <PageHeader
        title="Quizzes"
        subtitle={loading ? "Loading…" : `${quizzes.length} quiz${quizzes.length !== 1 ? "zes" : ""} ready to launch`}
        action={
          <div className="flex gap-2">
            <Link href="/quizzes/new?ai=true">
              <Button variant="secondary" icon={<Sparkles size={14} className="text-amber-600" />}>AI generate</Button>
            </Link>
            <Link href="/quizzes/new">
              <Button icon={<Plus size={15} />}>New quiz</Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <Loader2 size={24} className="animate-spin text-ink-400" />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={<HelpCircle size={22} />}
          title="No quizzes yet"
          description="Create your first quiz and launch a live session for your class."
          action={<Link href="/quizzes/new"><Button icon={<Plus size={14} />}>New quiz</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border border-ink-100 rounded-xl overflow-hidden card-lift">
              <div className="h-1.5 bg-amber-300" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-display text-lg text-ink-800 leading-tight">{quiz.title}</h3>
                  </div>
                  {quiz.ai_generated && <Badge variant="ai"><Sparkles size={9} className="mr-0.5" />AI</Badge>}
                </div>

                <div className="flex gap-4 text-xs text-ink-400 mb-4">
                  <span className="flex items-center gap-1"><HelpCircle size={11} />{quiz.questions.length} questions</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(quiz.time_limit_sec)} / q</span>
                  <span className="text-ink-300">{timeAgo(quiz.updated_at)}</span>
                </div>

                {quiz.questions.length > 0 && (
                  <div className="bg-ink-50 rounded-lg px-3 py-2.5 mb-4">
                    <p className="text-xs text-ink-600 line-clamp-2">{quiz.questions[0].body}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {quiz.questions[0].options.slice(0, 3).map((opt) => (
                        <span key={opt} className={`text-[10px] px-2 py-0.5 rounded-md border ${opt === quiz.questions[0].correct_answer ? "bg-sage-100 border-sage-300 text-sage-700" : "bg-white border-ink-200 text-ink-500"}`}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  icon={<Play size={14} />}
                  className="w-full justify-center"
                  onClick={() => setLaunchTarget(quiz)}
                >
                  Launch session
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {launchTarget && <LiveSessionModal quiz={launchTarget} onClose={() => setLaunchTarget(null)} />}
    </div>
  );
}
