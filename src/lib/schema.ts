import {
  pgTable, uuid, varchar, text, boolean, integer,
  timestamp, jsonb, pgEnum, index,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────
export const roleEnum          = pgEnum("role",           ["teacher", "admin"]);
export const lessonStatusEnum  = pgEnum("lesson_status",  ["draft", "published"]);
export const slideTypeEnum     = pgEnum("slide_type",     ["text", "image", "video"]);
export const questionTypeEnum  = pgEnum("question_type",  ["mcq", "truefalse", "open"]);
export const sessionStatusEnum = pgEnum("session_status", ["waiting", "live", "ended"]);
export const recordingStatusEnum = pgEnum("recording_status", ["recording", "processing", "ready"]);
export const templateTypeEnum  = pgEnum("template_type",  ["lesson", "simulation", "quiz"]);
export const syncOpEnum        = pgEnum("sync_op",        ["create", "update", "delete"]);
export const canvasStatusEnum  = pgEnum("canvas_status",  ["open", "closed"]);
export const castStatusEnum    = pgEnum("cast_status",    ["pending", "live", "ended"]);

// ── 1. users ─────────────────────────────────────────────────
export const users = pgTable("users", {
  id:            uuid("id").primaryKey().defaultRandom(),
  email:         varchar("email", { length: 255 }).notNull().unique(),
  name:          varchar("name",  { length: 255 }).notNull(),
  role:          roleEnum("role").notNull().default("teacher"),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  avatar_url:    varchar("avatar_url",    { length: 500 }),
  created_at:    timestamp("created_at").notNull().defaultNow(),
  updated_at:    timestamp("updated_at").notNull().defaultNow(),
});

// ── 2. templates ─────────────────────────────────────────────
export const templates = pgTable("templates", {
  id:          uuid("id").primaryKey().defaultRandom(),
  title:       varchar("title",   { length: 255 }).notNull(),
  subject:     varchar("subject", { length: 100 }).notNull(),
  grade_level: varchar("grade_level", { length: 50 }).notNull(),
  type:        templateTypeEnum("type").notNull(),
  slides:      jsonb("slides").notNull().default([]),
  thumbnail_url: varchar("thumbnail_url", { length: 500 }),
  is_builtin:  boolean("is_builtin").notNull().default(false),
  updated_at:  timestamp("updated_at").notNull().defaultNow(),
});

// ── 3. lessons ───────────────────────────────────────────────
export const lessons = pgTable("lessons", {
  id:           uuid("id").primaryKey().defaultRandom(),
  teacher_id:   uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  template_id:  uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
  title:        varchar("title",   { length: 255 }).notNull(),
  subject:      varchar("subject", { length: 100 }).notNull(),
  status:       lessonStatusEnum("status").notNull().default("draft"),
  ai_generated: boolean("ai_generated").notNull().default(false),
  ai_prompt:    text("ai_prompt"),
  updated_at:   timestamp("updated_at").notNull().defaultNow(),
  deleted_at:   timestamp("deleted_at"),
}, (t) => ({
  teacherIdx: index("lessons_teacher_idx").on(t.teacher_id),
}));

// ── 4. slides ────────────────────────────────────────────────
export const slides = pgTable("slides", {
  id:          uuid("id").primaryKey().defaultRandom(),
  lesson_id:   uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  order_index: integer("order_index").notNull().default(0),
  type:        slideTypeEnum("type").notNull().default("text"),
  content:     jsonb("content").notNull().default({}),
  media_url:   varchar("media_url", { length: 500 }),
  updated_at:  timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  lessonIdx: index("slides_lesson_idx").on(t.lesson_id),
}));

// ── 5. quizzes ───────────────────────────────────────────────
export const quizzes = pgTable("quizzes", {
  id:             uuid("id").primaryKey().defaultRandom(),
  lesson_id:      uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  teacher_id:     uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:          varchar("title", { length: 255 }).notNull(),
  time_limit_sec: integer("time_limit_sec").notNull().default(30),
  ai_generated:   boolean("ai_generated").notNull().default(false),
  updated_at:     timestamp("updated_at").notNull().defaultNow(),
});

// ── 6. questions ─────────────────────────────────────────────
export const questions = pgTable("questions", {
  id:             uuid("id").primaryKey().defaultRandom(),
  quiz_id:        uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  order_index:    integer("order_index").notNull().default(0),
  body:           text("body").notNull(),
  type:           questionTypeEnum("type").notNull().default("mcq"),
  options:        jsonb("options").notNull().default([]),
  correct_answer: varchar("correct_answer", { length: 255 }).notNull(),
}, (t) => ({
  quizIdx: index("questions_quiz_idx").on(t.quiz_id),
}));

// ── 7. quiz_sessions ─────────────────────────────────────────
export const quiz_sessions = pgTable("quiz_sessions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  quiz_id:         uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  join_code:       varchar("join_code", { length: 6 }).notNull().unique(),
  status:          sessionStatusEnum("status").notNull().default("waiting"),
  live_stream_url: varchar("live_stream_url", { length: 500 }),
  recording_id:    uuid("recording_id"),
  is_hybrid:       boolean("is_hybrid").notNull().default(false),
  started_at:      timestamp("started_at"),
  ended_at:        timestamp("ended_at"),
});

// ── 8. responses ─────────────────────────────────────────────
export const responses = pgTable("responses", {
  id:             uuid("id").primaryKey().defaultRandom(),
  session_id:     uuid("session_id").notNull().references(() => quiz_sessions.id, { onDelete: "cascade" }),
  question_id:    uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  student_alias:  varchar("student_alias", { length: 100 }).notNull(),
  answer:         varchar("answer", { length: 255 }).notNull(),
  is_correct:     boolean("is_correct").notNull().default(false),
  answered_at:    timestamp("answered_at").notNull().defaultNow(),
}, (t) => ({
  sessionIdx: index("responses_session_idx").on(t.session_id),
}));

// ── 9. whiteboard_snapshots ───────────────────────────────────
export const whiteboard_snapshots = pgTable("whiteboard_snapshots", {
  id:            uuid("id").primaryKey().defaultRandom(),
  lesson_id:     uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  teacher_id:    uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  strokes:       jsonb("strokes").notNull().default([]),
  ocr_text:      text("ocr_text"),
  thumbnail_url: varchar("thumbnail_url", { length: 500 }),
  updated_at:    timestamp("updated_at").notNull().defaultNow(),
});

// ── 10. session_recordings ───────────────────────────────────
export const session_recordings = pgTable("session_recordings", {
  id:            uuid("id").primaryKey().defaultRandom(),
  lesson_id:     uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  teacher_id:    uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:         varchar("title", { length: 255 }).notNull(),
  status:        recordingStatusEnum("status").notNull().default("recording"),
  video_url:     varchar("video_url",     { length: 500 }),
  thumbnail_url: varchar("thumbnail_url", { length: 500 }),
  duration_sec:  integer("duration_sec"),
  is_public:     boolean("is_public").notNull().default(false),
  recorded_at:   timestamp("recorded_at").notNull().defaultNow(),
});

// ── 11. canvas_sessions ──────────────────────────────────────
export const canvas_sessions = pgTable("canvas_sessions", {
  id:               uuid("id").primaryKey().defaultRandom(),
  lesson_id:        uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  teacher_id:       uuid("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  join_code:        varchar("join_code", { length: 6 }).notNull().unique(),
  status:           canvasStatusEnum("status").notNull().default("open"),
  max_participants: integer("max_participants").notNull().default(200),
  started_at:       timestamp("started_at").notNull().defaultNow(),
  ended_at:         timestamp("ended_at"),
});

// ── 12. canvas_strokes ───────────────────────────────────────
export const canvas_strokes = pgTable("canvas_strokes", {
  id:                uuid("id").primaryKey().defaultRandom(),
  session_id:        uuid("session_id").notNull().references(() => canvas_sessions.id, { onDelete: "cascade" }),
  participant_alias: varchar("participant_alias", { length: 100 }).notNull(),
  stroke_data:       jsonb("stroke_data").notNull(),
  color:             varchar("color",     { length: 20 }).notNull().default("#1e1d18"),
  thickness:         integer("thickness").notNull().default(2),
  vector_clock:      jsonb("vector_clock").notNull().default({}),
  created_at:        timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  sessionIdx: index("canvas_strokes_session_idx").on(t.session_id),
}));

// ── 13. cast_sessions ────────────────────────────────────────
export const cast_sessions = pgTable("cast_sessions", {
  id:           uuid("id").primaryKey().defaultRandom(),
  lesson_id:    uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  caster_alias: varchar("caster_alias", { length: 100 }).notNull(),
  join_code:    varchar("join_code",    { length: 6  }).notNull(),
  webrtc_offer: text("webrtc_offer"),
  status:       castStatusEnum("status").notNull().default("pending"),
  started_at:   timestamp("started_at").notNull().defaultNow(),
});

// ── 14. sync_log ─────────────────────────────────────────────
export const sync_log = pgTable("sync_log", {
  id:          uuid("id").primaryKey().defaultRandom(),
  user_id:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entity_type: varchar("entity_type", { length: 50  }).notNull(),
  entity_id:   uuid("entity_id").notNull(),
  operation:   syncOpEnum("operation").notNull(),
  device_id:   varchar("device_id",   { length: 100 }),
  synced_at:   timestamp("synced_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("sync_log_user_idx").on(t.user_id),
}));

// ── Type exports ─────────────────────────────────────────────
export type User                = typeof users.$inferSelect;
export type NewUser             = typeof users.$inferInsert;
export type Lesson              = typeof lessons.$inferSelect;
export type NewLesson           = typeof lessons.$inferInsert;
export type Slide               = typeof slides.$inferSelect;
export type NewSlide            = typeof slides.$inferInsert;
export type Quiz                = typeof quizzes.$inferSelect;
export type NewQuiz             = typeof quizzes.$inferInsert;
export type Question            = typeof questions.$inferSelect;
export type QuizSession         = typeof quiz_sessions.$inferSelect;
export type Response            = typeof responses.$inferSelect;
export type WhiteboardSnapshot  = typeof whiteboard_snapshots.$inferSelect;
export type SessionRecording    = typeof session_recordings.$inferSelect;
export type Template            = typeof templates.$inferSelect;
export type CanvasSession       = typeof canvas_sessions.$inferSelect;
export type SyncLog             = typeof sync_log.$inferSelect;
