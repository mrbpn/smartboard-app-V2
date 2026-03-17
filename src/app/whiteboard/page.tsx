"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen, Eraser, Square, Circle, Minus, Trash2,
  Download, Undo2, Redo2, Sparkles, Save, Users, ZoomIn, ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

type Tool = "pen" | "marker" | "eraser" | "line" | "rect" | "circle";
type Stroke = {
  id: string; tool: Tool; color: string; thickness: number;
  points: [number, number][];
};

const COLORS = ["#1e1d18", "#1e7a42", "#f0b224", "#c12e17", "#185FA5", "#993556", "#f5f2eb"];
const THICKNESSES: Record<Tool, number> = { pen: 2, marker: 8, eraser: 24, line: 2, rect: 2, circle: 2 };

export default function WhiteboardPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [tool, setTool]           = useState<Tool>("pen");
  const [color, setColor]         = useState("#1e1d18");
  const [thickness, setThickness] = useState(2);
  const [strokes, setStrokes]     = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [drawing, setDrawing]     = useState(false);
  const [current, setCurrent]     = useState<Stroke | null>(null);
  const [ocrText, setOcrText]     = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [zoom, setZoom]           = useState(100);
  const [participants]            = useState(["You", "Student A", "Student B"]);

  // Redraw canvas whenever strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Warm paper background
    ctx.fillStyle = "#faf8f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "#ede8dd";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const allStrokes = current ? [...strokes, current] : strokes;
    allStrokes.forEach((stroke) => drawStroke(ctx, stroke));
  }, [strokes, current]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.tool === "eraser" ? "#faf8f3" : stroke.color;
    ctx.lineWidth   = stroke.thickness;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    if (stroke.tool === "marker") ctx.globalAlpha = 0.6;

    if (stroke.tool === "line") {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
      ctx.lineTo(stroke.points[stroke.points.length - 1][0], stroke.points[stroke.points.length - 1][1]);
      ctx.stroke();
    } else if (stroke.tool === "rect") {
      const [x0, y0] = stroke.points[0];
      const [x1, y1] = stroke.points[stroke.points.length - 1];
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    } else if (stroke.tool === "circle") {
      const [x0, y0] = stroke.points[0];
      const [x1, y1] = stroke.points[stroke.points.length - 1];
      const rx = Math.abs(x1 - x0) / 2;
      const ry = Math.abs(y1 - y0) / 2;
      ctx.beginPath();
      ctx.ellipse(x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
      stroke.points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    }
    ctx.restore();
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): [number, number] {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return [
        (e.touches[0].clientX - rect.left) * scaleX,
        (e.touches[0].clientY - rect.top)  * scaleY,
      ];
    }
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(true);
    setRedoStack([]);
    const pos = getPos(e);
    setCurrent({
      id: `s-${Date.now()}`, tool, color,
      thickness: tool === "eraser" ? 24 : thickness,
      points: [pos],
    });
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || !current) return;
    e.preventDefault();
    setCurrent((prev) => prev ? { ...prev, points: [...prev.points, getPos(e)] } : prev);
  }

  function onUp() {
    if (!drawing || !current) return;
    setDrawing(false);
    if (current.points.length > 1) setStrokes((s) => [...s, current]);
    setCurrent(null);
  }

  function undo() {
    setStrokes((s) => {
      if (!s.length) return s;
      const last = s[s.length - 1];
      setRedoStack((r) => [...r, last]);
      return s.slice(0, -1);
    });
  }

  function redo() {
    setRedoStack((r) => {
      if (!r.length) return r;
      const last = r[r.length - 1];
      setStrokes((s) => [...s, last]);
      return r.slice(0, -1);
    });
  }

  function clear() { setStrokes([]); setRedoStack([]); }

  async function runOCR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setOcrLoading(true);
    try {
      const image = canvas.toDataURL("image/png");
      const res = await fetch("/api/whiteboard/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      setOcrText(data.data?.text ?? "No text detected.");
    } catch {
      setOcrText("OCR failed. Please try again.");
    } finally {
      setOcrLoading(false);
    }
  }

  function downloadCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  }

  const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "pen",    icon: <Pen size={15} />,    label: "Pen" },
    { id: "marker", icon: <Pen size={18} />,    label: "Marker" },
    { id: "eraser", icon: <Eraser size={15} />, label: "Eraser" },
    { id: "line",   icon: <Minus size={15} />,  label: "Line" },
    { id: "rect",   icon: <Square size={15} />, label: "Rectangle" },
    { id: "circle", icon: <Circle size={15} />, label: "Circle" },
  ];

  return (
    <div className="flex flex-col h-screen bg-ink-900">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-ink-800 border-b border-ink-700 flex-shrink-0">
        <h1 className="font-display text-chalk text-lg mr-2">Whiteboard</h1>

        {/* Tools */}
        <div className="flex gap-1 bg-ink-700 p-1 rounded-lg">
          {TOOLS.map(({ id, icon, label }) => (
            <button
              key={id}
              title={label}
              onClick={() => { setTool(id); setThickness(THICKNESSES[id]); }}
              className={cn(
                "p-2 rounded-md transition-all",
                tool === id ? "bg-chalk text-ink-900" : "text-ink-300 hover:bg-ink-600 hover:text-chalk"
              )}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-1.5 items-center ml-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={cn(
                "w-5 h-5 rounded-full transition-all border-2",
                color === c ? "border-chalk scale-110" : "border-transparent hover:scale-105"
              )}
            />
          ))}
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-ink-400 text-xs">Size</span>
          <input
            type="range" min={1} max={20} value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="w-20 accent-sage-400"
          />
          <span className="text-ink-400 text-xs w-4">{thickness}</span>
        </div>

        <div className="flex-1" />

        {/* Participants */}
        <div className="flex items-center gap-1.5 text-ink-300 text-xs mr-2">
          <Users size={13} />
          {participants.length} online
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={undo} disabled={!strokes.length} className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all disabled:opacity-30" title="Undo">
            <Undo2 size={15} />
          </button>
          <button onClick={redo} disabled={!redoStack.length} className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all disabled:opacity-30" title="Redo">
            <Redo2 size={15} />
          </button>
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all" title="Zoom in">
            <ZoomIn size={15} />
          </button>
          <button onClick={() => setZoom((z) => Math.max(50, z - 25))} className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all" title="Zoom out">
            <ZoomOut size={15} />
          </button>
          <button onClick={clear} className="p-2 rounded-lg text-coral-400 hover:bg-ink-700 transition-all" title="Clear">
            <Trash2 size={15} />
          </button>
          <button onClick={downloadCanvas} className="p-2 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-chalk transition-all" title="Download">
            <Download size={15} />
          </button>
        </div>

        <Button
          size="sm"
          icon={<Sparkles size={13} className="text-amber-400" />}
          onClick={runOCR}
          loading={ocrLoading}
          className="bg-ink-700 border-ink-600 text-chalk hover:bg-ink-600 ml-1"
        >
          OCR to text
        </Button>

        <Button size="sm" icon={<Save size={13} />} className="ml-1">Save</Button>
      </div>

      {/* Canvas area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center", cursor: tool === "eraser" ? "cell" : "crosshair" }}
            className="rounded-xl shadow-2xl max-w-full"
          />
        </div>

        {/* OCR sidebar */}
        {ocrText && (
          <div className="w-64 bg-ink-800 border-l border-ink-700 p-4 flex-shrink-0 animate-slide-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span className="text-chalk text-sm font-medium">Recognised text</span>
              </div>
              <button onClick={() => setOcrText("")} className="text-ink-500 hover:text-chalk transition-colors text-xs">✕</button>
            </div>
            <div className="bg-ink-700 rounded-lg p-3 text-xs text-ink-200 leading-relaxed font-mono whitespace-pre-wrap">
              {ocrText}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(ocrText).catch(() => {})}
              className="mt-2 text-xs text-ink-400 hover:text-chalk transition-colors w-full text-center"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-ink-900 border-t border-ink-700 text-xs text-ink-500 flex-shrink-0">
        <span className="capitalize">{tool}</span>
        <span>·</span>
        <span>{strokes.length} strokes</span>
        <span>·</span>
        <span>{zoom}%</span>
        <div className="flex-1" />
        <span className="flex items-center gap-1">
          <span className="status-dot bg-sage-500 animate-pulse-soft" />
          Connected
        </span>
      </div>
    </div>
  );
}
