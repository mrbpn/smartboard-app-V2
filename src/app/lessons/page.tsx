"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Sparkles, BookOpen, MoreHorizontal, Pencil, Trash2, Play } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { lessonsApi } from "@/lib/api";
import { timeAgo, subjectColor } from "@/lib/utils";
import type { Lesson } from "@/types";

export default function LessonsPage() {
  const [lessons, setLessons]     = useState<Lesson[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [openMenu, setOpenMenu]   = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await lessonsApi.list();
      setLessons(data.data as Lesson[]);
    } catch { /* empty */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await lessonsApi.delete(deleteTarget.id); setDeleteTarget(null); await load(); }
    catch { /* show toast */ } finally { setDeleting(false); }
  }

  const filtered = lessons.filter(l => {
    const ms = l.title.toLowerCase().includes(search.toLowerCase()) || l.subject.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || l.status === filter || (filter === "ai" && l.ai_generated);
    return ms && mf;
  });

  return (
    <div className="p-8">
      <PageHeader title="Lessons" subtitle={`${lessons.length} lessons in your library`}
        action={<div className="flex gap-2">
          <Link href="/lessons/new?ai=true"><Button variant="secondary" icon={<Sparkles size={14} className="text-amber-600"/>}>AI generate</Button></Link>
          <Link href="/lessons/new"><Button icon={<Plus size={15}/>}>New lesson</Button></Link>
        </div>}
      />
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search lessons…"
            className="w-full bg-white border border-ink-200 rounded-lg py-2 pl-8 pr-3 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-300 transition-all"/>
        </div>
        <div className="flex gap-1">
          {["all","published","draft","ai"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter===f?"bg-ink-800 text-chalk":"bg-white border border-ink-200 text-ink-500 hover:border-ink-400"}`}>
              {f==="ai"?"✦ AI-made":f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-white border border-ink-100 rounded-xl h-48 animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BookOpen size={22}/>} title="No lessons found" description={search?"Try a different search.":"Create your first lesson to get started."}
          action={<Link href="/lessons/new"><Button icon={<Plus size={14}/>}>New lesson</Button></Link>}/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(lesson=>(
            <div key={lesson.id} className="bg-white border border-ink-100 rounded-xl overflow-hidden card-lift group">
              <div className={`h-1.5 w-full ${lesson.status==="published"?"bg-sage-400":"bg-ink-200"}`}/>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/lessons/${lesson.id}`}><h3 className="font-display text-lg text-ink-800 leading-tight hover:text-sage-700 transition-colors line-clamp-2">{lesson.title}</h3></Link>
                    <p className="text-xs text-ink-400 mt-1">{timeAgo(lesson.updated_at)}</p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <button onClick={()=>setOpenMenu(openMenu===lesson.id?null:lesson.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-all opacity-0 group-hover:opacity-100"><MoreHorizontal size={15}/></button>
                    {openMenu===lesson.id&&(
                      <div className="absolute right-0 top-8 bg-white border border-ink-200 rounded-xl shadow-lg z-10 w-40 overflow-hidden animate-fade-in">
                        <Link href={`/lessons/${lesson.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50"><Pencil size={13}/>Edit</Link>
                        <Link href={`/quizzes/new?lesson=${lesson.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50"><Play size={13}/>Create quiz</Link>
                        <button onClick={()=>{setDeleteTarget(lesson);setOpenMenu(null);}} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-coral-500 hover:bg-coral-50"><Trash2 size={13}/>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`tag text-[10px] ${subjectColor(lesson.subject)}`}>{lesson.subject}</span>
                  <Badge variant={lesson.status==="published"?"success":"draft"}>{lesson.status}</Badge>
                  {lesson.ai_generated&&<Badge variant="ai"><Sparkles size={9} className="mr-0.5"/>AI</Badge>}
                </div>
              </div>
              <div className="px-5 pb-4"><Link href={`/lessons/${lesson.id}`}><Button variant="secondary" size="sm" className="w-full">Open lesson</Button></Link></div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete lesson" size="sm">
        <p className="text-sm text-ink-600 mb-5">Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={()=>setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
