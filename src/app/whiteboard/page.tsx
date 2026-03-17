"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen, Eraser, Square, Circle, Minus, Trash2, Download,
  Undo2, Redo2, Save, ZoomIn, ZoomOut, Type, Triangle,
  Sparkles, X, Send, Eye, Hash, ChevronRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

type Tool = "pen" | "marker" | "eraser" | "line" | "rect" | "circle" | "triangle" | "text";
type Stroke = { id: string; tool: Tool; color: string; thickness: number; points: [number, number][]; text?: string; };

const COLORS = ["#1e1d18","#1e7a42","#f0b224","#c12e17","#185FA5","#993556","#9b59b6","#f5f2eb"];
const THICKNESSES: Record<Tool, number> = { pen:2, marker:8, eraser:24, line:2, rect:2, circle:2, triangle:2, text:2 };

// ── AI panel config ───────────────────────────────────────────
const VISION_ACTIONS = [
  { id:"read_board",   label:"Read Board",    emoji:"👁️" },
  { id:"handwriting",  label:"Handwriting",   emoji:"✍️" },
  { id:"solve_math",   label:"Solve Math",    emoji:"➗" },
  { id:"step_by_step", label:"Step-by-Step",  emoji:"🪜" },
  { id:"diagram",      label:"Diagram",       emoji:"📊" },
  { id:"hints",        label:"Hints",         emoji:"💡" },
];
const TEXT_ACTIONS = [
  { id:"summarize",   label:"Summarize",    emoji:"📝" },
  { id:"explain",     label:"Explain",      emoji:"🎓" },
  { id:"quiz",        label:"Quiz",         emoji:"❓" },
  { id:"define",      label:"Define",       emoji:"📖" },
  { id:"concept_map", label:"Concept Map",  emoji:"🗺️" },
  { id:"translate",   label:"Translate",    emoji:"🌐" },
  { id:"actions",     label:"Actions",      emoji:"✅" },
  { id:"lesson",      label:"Lesson",       emoji:"📚" },
  { id:"brainstorm",  label:"Brainstorm",   emoji:"🧠" },
];

export default function WhiteboardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool]             = useState<Tool>("pen");
  const [color, setColor]           = useState("#1e1d18");
  const [thickness, setThickness]   = useState(2);
  const [strokes, setStrokes]       = useState<Stroke[]>([]);
  const [redoStack, setRedoStack]   = useState<Stroke[]>([]);
  const [drawing, setDrawing]       = useState(false);
  const [current, setCurrent]       = useState<Stroke | null>(null);
  const [zoom, setZoom]             = useState(100);

  // AI panel state
  const [aiOpen, setAiOpen]         = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult, setAiResult]     = useState("");
  const [pastedText, setPastedText] = useState("");
  const [question, setQuestion]     = useState("");

  // ── Canvas redraw ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#faf8f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ede8dd"; ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
    [...strokes, ...(current ? [current] : [])].forEach((s) => drawStroke(ctx, s));
  }, [strokes, current]);

  function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    if (s.points.length < 1) return;
    ctx.save();
    ctx.strokeStyle = s.tool === "eraser" ? "#faf8f3" : s.color;
    ctx.fillStyle   = s.color;
    ctx.lineWidth   = s.thickness;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (s.tool === "marker") ctx.globalAlpha = 0.6;

    if (s.tool === "line") {
      ctx.beginPath(); ctx.moveTo(s.points[0][0], s.points[0][1]);
      ctx.lineTo(s.points[s.points.length-1][0], s.points[s.points.length-1][1]); ctx.stroke();
    } else if (s.tool === "rect") {
      const [x0,y0] = s.points[0]; const [x1,y1] = s.points[s.points.length-1];
      ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    } else if (s.tool === "circle") {
      const [x0,y0] = s.points[0]; const [x1,y1] = s.points[s.points.length-1];
      ctx.beginPath(); ctx.ellipse(x0+(x1-x0)/2,y0+(y1-y0)/2,Math.abs(x1-x0)/2,Math.abs(y1-y0)/2,0,0,Math.PI*2); ctx.stroke();
    } else if (s.tool === "triangle") {
      const [x0,y0] = s.points[0]; const [x1,y1] = s.points[s.points.length-1];
      ctx.beginPath(); ctx.moveTo((x0+x1)/2, y0); ctx.lineTo(x1,y1); ctx.lineTo(x0,y1); ctx.closePath(); ctx.stroke();
    } else if (s.tool === "text" && s.text) {
      ctx.font = `${s.thickness * 8}px sans-serif`;
      ctx.fillText(s.text, s.points[0][0], s.points[0][1]);
    } else {
      ctx.beginPath(); ctx.moveTo(s.points[0][0], s.points[0][1]);
      s.points.slice(1).forEach(([x,y]) => ctx.lineTo(x,y)); ctx.stroke();
    }
    ctx.restore();
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): [number,number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width; const sy = canvas.height / rect.height;
    if ("touches" in e) return [(e.touches[0].clientX-rect.left)*sx, (e.touches[0].clientY-rect.top)*sy];
    return [(e.clientX-rect.left)*sx, (e.clientY-rect.top)*sy];
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (tool === "text") {
      const pos = getPos(e);
      const t = window.prompt("Enter text:");
      if (t) setStrokes((s) => [...s, { id:`s-${Date.now()}`, tool:"text", color, thickness, points:[pos], text:t }]);
      return;
    }
    setDrawing(true); setRedoStack([]);
    setCurrent({ id:`s-${Date.now()}`, tool, color, thickness: tool==="eraser"?24:thickness, points:[getPos(e)] });
  }
  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || !current) return; e.preventDefault();
    setCurrent((p) => p ? {...p, points:[...p.points, getPos(e)]} : p);
  }
  function onUp() {
    if (!drawing || !current) return;
    setDrawing(false);
    if (current.points.length > 1) setStrokes((s) => [...s, current]);
    setCurrent(null);
  }
  const undo = useCallback(() => setStrokes((s) => { if (!s.length) return s; setRedoStack((r)=>[...r,s[s.length-1]]); return s.slice(0,-1); }), []);
  const redo = useCallback(() => setRedoStack((r) => { if (!r.length) return r; setStrokes((s)=>[...s,r[r.length-1]]); return r.slice(0,-1); }), []);
  function clear() { setStrokes([]); setRedoStack([]); }
  function download() {
    const canvas = canvasRef.current; if (!canvas) return;
    const a = document.createElement("a"); a.download="whiteboard.png"; a.href=canvas.toDataURL(); a.click();
  }

  // ── AI helpers ────────────────────────────────────────────
  // Resize canvas to max 800x450 before sending to Gemini (reduces payload)
  function getCanvasImage() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const offscreen = document.createElement("canvas");
    offscreen.width  = 800;
    offscreen.height = 450;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/jpeg", 0.8);
    ctx.drawImage(canvas, 0, 0, 800, 450);
    return offscreen.toDataURL("image/jpeg", 0.8); // JPEG at 80% quality — much smaller
  }

  async function callAI(action: string, opts: { useImage?: boolean; useText?: boolean; q?: string } = {}) {
    setAiLoading(true); setAiResult("");
    try {
      const body: Record<string,unknown> = { action };
      if (opts.useImage) body.image = getCanvasImage();
      if (opts.useText)  body.text  = pastedText;
      if (opts.q)        body.question = opts.q;

      const res  = await fetch("/api/whiteboard/ai", {
        method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body),
      });
      const data = await res.json();
      setAiResult(data.data?.result ?? "No response.");
    } catch {
      setAiResult("Request failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id:"pen",      icon:<Pen size={15}/>,      label:"Pen" },
    { id:"marker",   icon:<Pen size={18}/>,      label:"Marker" },
    { id:"eraser",   icon:<Eraser size={15}/>,   label:"Eraser" },
    { id:"text",     icon:<Type size={15}/>,      label:"Text" },
    { id:"line",     icon:<Minus size={15}/>,    label:"Line" },
    { id:"rect",     icon:<Square size={15}/>,   label:"Rectangle" },
    { id:"circle",   icon:<Circle size={15}/>,   label:"Circle" },
    { id:"triangle", icon:<Triangle size={15}/>, label:"Triangle" },
  ];

  return (
    <div className="flex flex-col h-screen bg-ink-900">
      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-800 border-b border-ink-700 flex-shrink-0 flex-wrap">
        <h1 className="font-display text-chalk text-base mr-1">Whiteboard</h1>

        {/* Tools */}
        <div className="flex gap-0.5 bg-ink-700 p-1 rounded-lg">
          {TOOLS.map(({id,icon,label}) => (
            <button key={id} title={label} onClick={() => { setTool(id); setThickness(THICKNESSES[id]); }}
              className={cn("p-2 rounded-md transition-all", tool===id?"bg-chalk text-ink-900":"text-ink-300 hover:bg-ink-600 hover:text-chalk")}>
              {icon}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-1 items-center">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{background:c}}
              className={cn("w-5 h-5 rounded-full border-2 transition-all", color===c?"border-chalk scale-110":"border-transparent hover:scale-105")} />
          ))}
        </div>

        {/* Size */}
        <div className="flex items-center gap-1.5">
          <span className="text-ink-400 text-xs">Size</span>
          <input type="range" min={1} max={20} value={thickness} onChange={(e)=>setThickness(Number(e.target.value))} className="w-16 accent-sage-400"/>
          <span className="text-ink-400 text-xs w-4">{thickness}</span>
        </div>

        <div className="flex-1"/>

        {/* Actions */}
        <div className="flex gap-0.5">
          <button onClick={undo} disabled={!strokes.length} title="Undo" className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all disabled:opacity-30"><Undo2 size={15}/></button>
          <button onClick={redo} disabled={!redoStack.length} title="Redo" className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all disabled:opacity-30"><Redo2 size={15}/></button>
          <button onClick={()=>setZoom((z)=>Math.min(200,z+25))} title="Zoom in"  className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all"><ZoomIn size={15}/></button>
          <button onClick={()=>setZoom((z)=>Math.max(50,z-25))}  title="Zoom out" className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all"><ZoomOut size={15}/></button>
          <button onClick={clear}    title="Clear"    className="p-2 rounded-lg text-coral-400 hover:bg-ink-700 transition-all"><Trash2 size={15}/></button>
          <button onClick={download} title="Download" className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all"><Download size={15}/></button>
          <button onClick={()=>setAiOpen(true)} title="Save" className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all"><Save size={15}/></button>
        </div>

        {/* AI toggle */}
        <button onClick={()=>setAiOpen((o)=>!o)}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
            aiOpen ? "bg-violet-600 text-white border-violet-500" : "bg-ink-700 text-chalk border-ink-600 hover:bg-violet-700 hover:border-violet-500")}>
          <Sparkles size={13} className="text-amber-300"/>AI
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-ink-900">
          <canvas
            ref={canvasRef} width={1600} height={900}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            style={{ transform:`scale(${zoom/100})`, transformOrigin:"center",
              cursor: tool==="eraser"?"cell": tool==="text"?"text":"crosshair" }}
            className="rounded-xl shadow-2xl max-w-full"
          />
        </div>

        {/* ── AI Assistant panel ── */}
        {aiOpen && (
          <div className="w-72 bg-ink-800 border-l border-ink-700 flex flex-col flex-shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-violet-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-300"/>
                <span className="text-white font-semibold text-sm">AI Assistant</span>
              </div>
              <button onClick={()=>setAiOpen(false)} className="text-white/60 hover:text-white transition-colors"><X size={15}/></button>
            </div>

            <div className="flex-1 flex flex-col gap-4 p-3 overflow-y-auto">

              {/* VISION */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye size={12} className="text-violet-400"/>
                  <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Vision</span>
                  <span className="text-[10px] text-ink-500 ml-auto">reads canvas</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {VISION_ACTIONS.map(({id,label,emoji}) => (
                    <button key={id} disabled={aiLoading} onClick={()=>callAI(id,{useImage:true})}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-ink-700 hover:bg-violet-700 text-ink-200 hover:text-white text-xs font-medium transition-all disabled:opacity-50 text-left">
                      <span>{emoji}</span>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TEXT */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Hash size={12} className="text-amber-400"/>
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Text</span>
                  <span className="text-[10px] text-ink-500 ml-auto">paste content below</span>
                </div>
                <textarea
                  value={pastedText} onChange={(e)=>setPastedText(e.target.value)}
                  placeholder="Type or paste whiteboard content…"
                  rows={3}
                  className="w-full bg-ink-700 border border-ink-600 rounded-lg p-2.5 text-xs text-ink-200 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none mb-2"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  {TEXT_ACTIONS.map(({id,label,emoji}) => (
                    <button key={id} disabled={aiLoading || !pastedText.trim()} onClick={()=>callAI(id,{useText:true})}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-ink-700 hover:bg-amber-600 text-ink-200 hover:text-white text-xs font-medium transition-all disabled:opacity-40 text-left">
                      <span>{emoji}</span>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ASK ANYTHING */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ChevronRight size={12} className="text-sage-400"/>
                  <span className="text-[10px] font-semibold text-sage-400 uppercase tracking-wider">Ask Anything</span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={question} onChange={(e)=>setQuestion(e.target.value)}
                    onKeyDown={(e)=>e.key==="Enter"&&question.trim()&&callAI("ask",{useImage:true,q:question})}
                    placeholder="Ask a question…"
                    className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-2.5 py-2 text-xs text-ink-200 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-sage-400"
                  />
                  <button disabled={aiLoading||!question.trim()} onClick={()=>callAI("ask",{useImage:true,q:question})}
                    className="px-2.5 py-2 rounded-lg bg-sage-600 hover:bg-sage-500 text-white text-xs font-medium transition-all disabled:opacity-40">
                    <Send size={12}/>
                  </button>
                </div>
              </div>

              {/* Result */}
              {(aiLoading || aiResult) && (
                <div className="bg-ink-900 rounded-xl border border-ink-600 p-3">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-ink-400 text-xs">
                      <Loader2 size={13} className="animate-spin text-violet-400"/>
                      <span>Thinking…</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Result</span>
                        <button onClick={()=>setAiResult("")} className="text-ink-500 hover:text-chalk text-xs transition-colors"><X size={11}/></button>
                      </div>
                      <p className="text-xs text-ink-200 leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                      <button
                        onClick={()=>navigator.clipboard.writeText(aiResult).catch(()=>{})}
                        className="mt-2 text-[10px] text-ink-500 hover:text-chalk transition-colors">
                        Copy to clipboard
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1 bg-ink-900 border-t border-ink-700 text-xs text-ink-500 flex-shrink-0">
        <span className="capitalize">{tool}</span>
        <span>·</span><span>{strokes.length} strokes</span>
        <span>·</span><span>{zoom}%</span>
        <div className="flex-1"/>
        <span className="flex items-center gap-1"><span className="status-dot bg-sage-500 animate-pulse-soft"/>Connected</span>
      </div>
    </div>
  );
}
