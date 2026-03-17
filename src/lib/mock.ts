import type { Lesson, Quiz, Recording, Template, AnalyticsSummary } from "@/types";

export const MOCK_USER = {
  id: "u1",
  email: "teacher@school.edu",
  name: "Ms. Sarah Chen",
  role: "teacher" as const,
  avatar_url: "",
  created_at: "2024-09-01T00:00:00Z",
};

export const MOCK_LESSONS: Lesson[] = [
  {
    id: "l1", teacher_id: "u1", title: "Photosynthesis & The Carbon Cycle",
    subject: "Biology", status: "published", ai_generated: true,
    slides: [], updated_at: "2025-03-10T09:00:00Z",
  },
  {
    id: "l2", teacher_id: "u1", title: "Newton's Laws of Motion",
    subject: "Physics", status: "published", ai_generated: false,
    slides: [], updated_at: "2025-03-08T14:00:00Z",
  },
  {
    id: "l3", teacher_id: "u1", title: "The French Revolution",
    subject: "History", status: "draft", ai_generated: true,
    slides: [], updated_at: "2025-03-07T11:00:00Z",
  },
  {
    id: "l4", teacher_id: "u1", title: "Quadratic Equations",
    subject: "Math", status: "published", ai_generated: false,
    slides: [], updated_at: "2025-03-05T10:00:00Z",
  },
  {
    id: "l5", teacher_id: "u1", title: "Shakespeare's Hamlet — Act III",
    subject: "English", status: "draft", ai_generated: false,
    slides: [], updated_at: "2025-03-03T16:00:00Z",
  },
  {
    id: "l6", teacher_id: "u1", title: "Periodic Table & Chemical Bonds",
    subject: "Chemistry", status: "published", ai_generated: true,
    slides: [], updated_at: "2025-03-01T08:00:00Z",
  },
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: "q1", lesson_id: "l1", teacher_id: "u1",
    title: "Photosynthesis Quiz", time_limit_sec: 30,
    ai_generated: true, updated_at: "2025-03-10T09:30:00Z",
    questions: [
      { id: "qq1", quiz_id: "q1", order_index: 0, body: "What is the main pigment in photosynthesis?", type: "mcq", options: ["Chlorophyll", "Carotene", "Melanin", "Keratin"], correct_answer: "Chlorophyll" },
      { id: "qq2", quiz_id: "q1", order_index: 1, body: "Photosynthesis occurs in the mitochondria.", type: "truefalse", options: ["True", "False"], correct_answer: "False" },
    ],
  },
  {
    id: "q2", lesson_id: "l2", teacher_id: "u1",
    title: "Newton's Laws Quiz", time_limit_sec: 45,
    ai_generated: false, updated_at: "2025-03-08T15:00:00Z",
    questions: [],
  },
  {
    id: "q3", lesson_id: "l4", teacher_id: "u1",
    title: "Quadratic Equations — Chapter Test", time_limit_sec: 60,
    ai_generated: false, updated_at: "2025-03-05T11:00:00Z",
    questions: [],
  },
];

export const MOCK_RECORDINGS: Recording[] = [
  {
    id: "r1", lesson_id: "l1", teacher_id: "u1",
    title: "Photosynthesis — March 10",
    status: "ready", duration_sec: 2847, is_public: true,
    video_url: "", thumbnail_url: "",
    recorded_at: "2025-03-10T10:00:00Z",
  },
  {
    id: "r2", lesson_id: "l2", teacher_id: "u1",
    title: "Newton's Laws — March 8",
    status: "ready", duration_sec: 3210, is_public: false,
    video_url: "", thumbnail_url: "",
    recorded_at: "2025-03-08T14:00:00Z",
  },
  {
    id: "r3", lesson_id: "l6", teacher_id: "u1",
    title: "Chemical Bonds — March 1",
    status: "processing", duration_sec: undefined, is_public: false,
    video_url: "", thumbnail_url: "",
    recorded_at: "2025-03-01T09:00:00Z",
  },
];

export const MOCK_TEMPLATES: Template[] = [
  { id: "t1", title: "Cell Biology Introduction", subject: "Biology", grade_level: "Grade 8", type: "lesson", slides: [], is_builtin: true, updated_at: "2025-01-01T00:00:00Z" },
  { id: "t2", title: "Algebra Basics", subject: "Math", grade_level: "Grade 7", type: "lesson", slides: [], is_builtin: true, updated_at: "2025-01-01T00:00:00Z" },
  { id: "t3", title: "World War II Timeline", subject: "History", grade_level: "Grade 10", type: "simulation", slides: [], is_builtin: true, updated_at: "2025-01-01T00:00:00Z" },
  { id: "t4", title: "Periodic Table Explorer", subject: "Chemistry", grade_level: "Grade 9", type: "simulation", slides: [], is_builtin: true, updated_at: "2025-01-01T00:00:00Z" },
  { id: "t5", title: "Shakespeare Vocabulary Quiz", subject: "English", grade_level: "Grade 11", type: "quiz", slides: [], is_builtin: true, updated_at: "2025-01-01T00:00:00Z" },
  { id: "t6", title: "Forces & Motion Lab", subject: "Physics", grade_level: "Grade 9", type: "simulation", slides: [], is_builtin: true, updated_at: "2025-01-01T00:00:00Z" },
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  total_lessons: 6,
  total_quizzes: 3,
  total_recordings: 3,
  avg_quiz_score: 78,
  lessons_this_week: 2,
  active_students: 34,
};

export const MOCK_QUIZ_SCORES = [
  { week: "Feb W1", score: 65 },
  { week: "Feb W2", score: 70 },
  { week: "Feb W3", score: 72 },
  { week: "Feb W4", score: 68 },
  { week: "Mar W1", score: 78 },
  { week: "Mar W2", score: 82 },
];

export const MOCK_SUBJECT_DIST = [
  { subject: "Biology",   count: 2 },
  { subject: "Physics",   count: 1 },
  { subject: "History",   count: 1 },
  { subject: "Math",      count: 1 },
  { subject: "English",   count: 1 },
  { subject: "Chemistry", count: 1 },
];
