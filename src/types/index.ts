// ── Users ────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: "teacher" | "admin";
  avatar_url?: string;
  created_at: string;
}

// ── Lessons ──────────────────────────────────────────────────
export type SlideType = "text" | "image" | "video";

export interface Slide {
  id: string;
  lesson_id: string;
  order_index: number;
  type: SlideType;
  content: Record<string, unknown>;
  media_url?: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  title: string;
  subject: string;
  status: "draft" | "published";
  ai_generated: boolean;
  ai_prompt?: string;
  slides: Slide[];
  template_id?: string;
  updated_at: string;
  deleted_at?: string;
}

// ── Quizzes ──────────────────────────────────────────────────
export type QuestionType = "mcq" | "truefalse" | "open";

export interface Question {
  id: string;
  quiz_id: string;
  order_index: number;
  body: string;
  type: QuestionType;
  options: string[];
  correct_answer: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  teacher_id: string;
  title: string;
  time_limit_sec: number;
  ai_generated: boolean;
  questions: Question[];
  updated_at: string;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  join_code: string;
  status: "waiting" | "live" | "ended";
  live_stream_url?: string;
  recording_id?: string;
  is_hybrid: boolean;
  started_at?: string;
  ended_at?: string;
}

// ── Whiteboard ───────────────────────────────────────────────
export interface WhiteboardSnapshot {
  id: string;
  lesson_id: string;
  teacher_id: string;
  strokes: Stroke[];
  ocr_text?: string;
  thumbnail_url?: string;
  updated_at: string;
}

export interface Stroke {
  id: string;
  points: [number, number][];
  color: string;
  thickness: number;
  tool: "pen" | "marker" | "eraser";
}

// ── Recordings ───────────────────────────────────────────────
export type RecordingStatus = "recording" | "processing" | "ready";

export interface Recording {
  id: string;
  lesson_id: string;
  teacher_id: string;
  title: string;
  status: RecordingStatus;
  video_url?: string;
  thumbnail_url?: string;
  duration_sec?: number;
  is_public: boolean;
  recorded_at: string;
}

// ── Templates ────────────────────────────────────────────────
export interface Template {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  type: "lesson" | "simulation" | "quiz";
  slides: Slide[];
  thumbnail_url?: string;
  is_builtin: boolean;
  updated_at: string;
}

// ── Analytics ────────────────────────────────────────────────
export interface AnalyticsSummary {
  total_lessons: number;
  total_quizzes: number;
  total_recordings: number;
  avg_quiz_score: number;
  lessons_this_week: number;
  active_students: number;
}
