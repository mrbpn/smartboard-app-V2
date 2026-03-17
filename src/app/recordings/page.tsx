"use client";
import { useState } from "react";
import { Video, Play, Lock, Globe, Clock, Loader2, Download, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { MOCK_RECORDINGS, MOCK_LESSONS } from "@/lib/mock";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Recording } from "@/types";

const STATUS_MAP = {
  ready:      { label: "Ready",      variant: "success"  as const },
  processing: { label: "Processing", variant: "warning"  as const },
  recording:  { label: "Recording",  variant: "danger"   as const },
};

function RecordingCard({ rec, onPlay }: { rec: Recording; onPlay: () => void }) {
  const lesson  = MOCK_LESSONS.find((l) => l.id === rec.lesson_id);
  const status  = STATUS_MAP[rec.status];

  return (
    <div className="bg-white border border-ink-100 rounded-xl overflow-hidden card-lift group">
      {/* Thumbnail */}
      <div
        className="h-36 bg-ink-900 relative flex items-center justify-center cursor-pointer"
        onClick={rec.status === "ready" ? onPlay : undefined}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e7a4222_0%,_transparent_70%)]" />
        {rec.status === "ready" ? (
          <div className="w-12 h-12 rounded-full bg-chalk/10 border border-chalk/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={20} className="text-chalk ml-1" fill="currentColor" />
          </div>
        ) : rec.status === "processing" ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={20} className="text-amber-400 animate-spin" />
            <span className="text-amber-400 text-xs">Processing…</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-coral-400 animate-pulse" />
            <span className="text-coral-400 text-xs font-medium">Recording</span>
          </div>
        )}

        {/* Duration badge */}
        {rec.duration_sec && (
          <div className="absolute bottom-2 right-2 bg-ink-900/70 text-chalk text-[10px] px-1.5 py-0.5 rounded font-mono">
            {formatDuration(rec.duration_sec)}
          </div>
        )}

        {/* Visibility */}
        <div className="absolute top-2 left-2">
          {rec.is_public
            ? <span className="flex items-center gap-1 text-[10px] bg-sage-900/60 text-sage-300 px-2 py-0.5 rounded-full"><Globe size={9} />Public</span>
            : <span className="flex items-center gap-1 text-[10px] bg-ink-700/60 text-ink-300 px-2 py-0.5 rounded-full"><Lock size={9} />Private</span>
          }
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-ink-800 text-sm mb-0.5 truncate">{rec.title}</h3>
        {lesson && <p className="text-xs text-ink-400 mb-2 truncate">{lesson.title}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-ink-400">
            <Clock size={11} />
            {formatDate(rec.recorded_at)}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {rec.status === "ready" && (
            <>
              <Button size="sm" variant="secondary" icon={<Play size={11} />} onClick={onPlay} className="flex-1 justify-center">Play</Button>
              <Button size="sm" variant="ghost" icon={<Download size={11} />} />
            </>
          )}
          <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} className="text-coral-400 hover:bg-coral-50" />
        </div>
      </div>
    </div>
  );
}

export default function RecordingsPage() {
  const [playTarget, setPlayTarget] = useState<Recording | null>(null);

  return (
    <div className="p-8">
      <PageHeader
        title="Recordings"
        subtitle="Your recorded class sessions"
      />

      {MOCK_RECORDINGS.length === 0 ? (
        <EmptyState
          icon={<Video size={22} />}
          title="No recordings yet"
          description="Start a quiz session and enable recording — it will appear here when ready."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {MOCK_RECORDINGS.map((rec) => (
            <RecordingCard key={rec.id} rec={rec} onPlay={() => setPlayTarget(rec)} />
          ))}
        </div>
      )}

      {/* Video player modal */}
      <Modal
        open={!!playTarget}
        onClose={() => setPlayTarget(null)}
        title={playTarget?.title ?? ""}
        size="lg"
      >
        <div className="aspect-video bg-ink-900 rounded-xl flex items-center justify-center mb-4">
          <div className="text-center">
            <Play size={40} className="text-ink-400 mx-auto mb-2" />
            <p className="text-ink-500 text-sm">Video playback</p>
            <p className="text-ink-600 text-xs mt-1 font-mono">
              {playTarget?.duration_sec ? formatDuration(playTarget.duration_sec) : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">
            {playTarget && formatDate(playTarget.recorded_at)}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Download size={13} />}>Download</Button>
            <Button
              variant="secondary"
              size="sm"
              icon={playTarget?.is_public ? <Lock size={13} /> : <Globe size={13} />}
            >
              {playTarget?.is_public ? "Make private" : "Share publicly"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
