"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, HelpCircle, Video, Users, TrendingUp, Plus, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { timeAgo, subjectColor } from "@/lib/utils";
import type { Lesson, Quiz } from "@/types";

const PIE_COLORS = ["#1e7a42","#f0b224","#c12e17","#1e1d18","#6faf87","#f5cc6b","#ec7160"];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<{total_lessons:number;total_quizzes:number;total_recordings:number;lessons_this_week:number;avg_quiz_score:number;active_students:number;weekly_trend:{week:string;score:number}[]}|null>(null);
  const [lessons,   setLessons  ] = useState<Lesson[]>([]);
  const [quizzes,   setQuizzes  ] = useState<Quiz[]>([]);
  const [loading,   setLoading  ] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, lRes, qRes] = await Promise.all([
          fetch("/api/analytics"), fetch("/api/lessons"), fetch("/api/quizzes"),
        ]);
        if (aRes.ok) { const { data } = await aRes.json(); setAnalytics(data); }
        if (lRes.ok) { const { data } = await lRes.json(); setLessons(data);   }
        if (qRes.ok) { const { data } = await qRes.json(); setQuizzes(data);   }
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const subjectDist = lessons.reduce<Record<string,number>>((acc, l) => { acc[l.subject]=(acc[l.subject]??0)+1; return acc; }, {});
  const pieData = Object.entries(subjectDist).map(([subject, count]) => ({ subject, count }));

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="flex flex-col items-center gap-3 text-ink-400">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">Loading your classroom…</span>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <PageHeader title={`${greeting}!`} subtitle="Here's what's happening in your classroom today."
        action={<Link href="/lessons/new"><Button icon={<Plus size={15} />}>New lesson</Button></Link>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatCard label="Total lessons"   value={analytics?.total_lessons    ?? 0} icon={<BookOpen size={16} />}   accent="ink"   trend={`+${analytics?.lessons_this_week ?? 0} this week`} />
        <StatCard label="Quizzes created" value={analytics?.total_quizzes    ?? 0} icon={<HelpCircle size={16} />} accent="amber" />
        <StatCard label="Recordings"      value={analytics?.total_recordings ?? 0} icon={<Video size={16} />}      accent="coral" />
        <StatCard label="Active students" value={analytics?.active_students  ?? 0} icon={<Users size={16} />}      accent="sage"  />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-display text-lg text-ink-800">Quiz performance</h3><p className="text-xs text-ink-400">Average class score</p></div>
            {(analytics?.avg_quiz_score??0)>0 && <div className="flex items-center gap-1.5 text-sage-600 bg-sage-50 px-2.5 py-1 rounded-full text-xs"><TrendingUp size={12}/>{analytics?.avg_quiz_score}% avg</div>}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={analytics?.weekly_trend??[]} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e7a42" stopOpacity={0.15}/><stop offset="95%" stopColor="#1e7a42" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="week" tick={{fontSize:10,fill:"#88877e"}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#88877e"}} tickLine={false} axisLine={false} domain={[50,100]}/>
              <Tooltip contentStyle={{background:"#1e1d18",border:"none",borderRadius:8,fontSize:12,color:"#f5f2eb"}}/>
              <Area type="monotone" dataKey="score" stroke="#1e7a42" strokeWidth={2} fill="url(#sg)" dot={{r:3,fill:"#1e7a42",strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-display text-lg text-ink-800 mb-1">Subjects</h3>
          <p className="text-xs text-ink-400 mb-4">Lesson distribution</p>
          {pieData.length>0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart><Pie data={pieData} dataKey="count" nameKey="subject" cx="50%" cy="50%" outerRadius={50} innerRadius={28} paddingAngle={3}>
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie><Tooltip contentStyle={{background:"#1e1d18",border:"none",borderRadius:8,fontSize:11,color:"#f5f2eb"}}/></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">{pieData.slice(0,4).map((d,i)=>(
                <div key={d.subject} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:PIE_COLORS[i]}}/>
                  <span className="text-ink-600 flex-1">{d.subject}</span>
                  <span className="text-ink-400">{d.count}</span>
                </div>
              ))}</div>
            </>
          ) : <div className="text-center py-8 text-ink-300 text-sm">No lessons yet</div>}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-ink-800">Recent lessons</h3>
            <Link href="/lessons" className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1 transition-colors">View all <ArrowRight size={12}/></Link>
          </div>
          {lessons.length===0 ? (
            <div className="bg-white border-2 border-dashed border-ink-200 rounded-xl p-8 text-center">
              <BookOpen size={20} className="text-ink-300 mx-auto mb-2"/>
              <p className="text-ink-400 text-sm mb-3">No lessons yet — create your first one!</p>
              <Link href="/lessons/new"><Button size="sm" icon={<Plus size={13}/>}>Create lesson</Button></Link>
            </div>
          ) : (
            <div className="space-y-2 stagger">
              {lessons.slice(0,4).map((lesson)=>(
                <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                  <div className="bg-white border border-ink-100 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-ink-300 transition-all card-lift">
                    <div className="w-8 h-8 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0"><BookOpen size={14} className="text-ink-500"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{lesson.title}</p>
                      <p className="text-xs text-ink-400">{timeAgo(lesson.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`tag text-[10px] ${subjectColor(lesson.subject)}`}>{lesson.subject}</span>
                      <Badge variant={lesson.status==="published"?"success":"draft"}>{lesson.status}</Badge>
                      {lesson.ai_generated && <Badge variant="ai"><Sparkles size={9} className="mr-0.5"/>AI</Badge>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-lg text-ink-800 mb-3">Quick actions</h3>
          <Link href="/lessons/new?ai=true">
            <div className="bg-ink-900 rounded-xl p-4 cursor-pointer hover:bg-ink-800 transition-all card-lift">
              <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-amber-300"/><span className="text-chalk text-sm font-medium">AI lesson generator</span></div>
              <p className="text-ink-400 text-xs leading-relaxed">Type a topic and get a full lesson in seconds.</p>
            </div>
          </Link>
          <Link href="/quizzes/new">
            <div className="bg-white border border-ink-100 rounded-xl p-4 cursor-pointer hover:border-ink-300 transition-all card-lift">
              <div className="flex items-center gap-2 mb-2"><HelpCircle size={14} className="text-ink-500"/><span className="text-ink-800 text-sm font-medium">Create a quiz</span></div>
              <p className="text-ink-400 text-xs leading-relaxed">Build a quiz with live polling.</p>
            </div>
          </Link>
          <Link href="/whiteboard">
            <div className="bg-white border border-ink-100 rounded-xl p-4 cursor-pointer hover:border-ink-300 transition-all card-lift">
              <div className="flex items-center gap-2 mb-2"><span className="text-sm">✏️</span><span className="text-ink-800 text-sm font-medium">Open whiteboard</span></div>
              <p className="text-ink-400 text-xs leading-relaxed">Draw, annotate, and collaborate.</p>
            </div>
          </Link>
          {quizzes[0] && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-700 text-xs font-medium mb-1">Ready to launch</p>
              <p className="text-ink-800 text-sm font-medium">{quizzes[0].title}</p>
              <p className="text-ink-400 text-xs mb-3">{(quizzes[0] as Quiz & {questions?: unknown[]}).questions?.length ?? 0} questions</p>
              <Link href={`/quizzes/${quizzes[0].id}`}><Button size="sm" variant="secondary" className="w-full">Start session</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
