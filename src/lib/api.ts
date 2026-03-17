import axios from "axios";

// Use relative path so it works on localhost AND Vercel without any env var needed
const BASE_URL = "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }),
  logout:   () => api.post("/auth/logout"),
  me:       () => api.get("/auth/me"),
};

// ── Lessons ──────────────────────────────────────────────────
export const lessonsApi = {
  list:   (params?: Record<string, string>) => api.get("/lessons", { params }),
  get:    (id: string) => api.get(`/lessons/${id}`),
  create: (data: Record<string, unknown>) => api.post("/lessons", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/lessons/${id}`, data),
  delete: (id: string) => api.delete(`/lessons/${id}`),
  uploadMedia: (id: string, file: FormData) =>
    api.post(`/lessons/${id}/media`, file, { headers: { "Content-Type": "multipart/form-data" } }),
};

// ── Quizzes ──────────────────────────────────────────────────
export const quizzesApi = {
  list:         (params?: Record<string, string>) => api.get("/quizzes", { params }),
  get:          (id: string) => api.get(`/quizzes/${id}`),
  create:       (data: Record<string, unknown>) => api.post("/quizzes", data),
  update:       (id: string, data: Record<string, unknown>) => api.patch(`/quizzes/${id}`, data),
  startSession: (id: string, hybrid = false) =>
    api.post(`/quizzes/${id}/sessions`, { is_hybrid: hybrid }),
  getResults:   (sessionId: string) => api.get(`/sessions/${sessionId}/results`),
};

// ── Whiteboard ───────────────────────────────────────────────
export const whiteboardApi = {
  saveSnapshot: (data: Record<string, unknown>) => api.post("/whiteboard/snapshots", data),
  listSnapshots:(lessonId: string) => api.get("/whiteboard/snapshots", { params: { lesson_id: lessonId } }),
  ocrCloud:     (imageBase64: string) => api.post("/whiteboard/ocr", { image_base64: imageBase64 }),
};

// ── Recordings ───────────────────────────────────────────────
export const recordingsApi = {
  list:  (params?: Record<string, string>) => api.get("/recordings", { params }),
  start: (lessonId: string, title: string) =>
    api.post("/recordings/start", { lesson_id: lessonId, title }),
  stop:  (id: string) => api.patch(`/recordings/${id}/stop`),
};

// ── Templates ────────────────────────────────────────────────
export const templatesApi = {
  list:   (params?: Record<string, string>) => api.get("/templates", { params }),
  import: (id: string) => api.post(`/templates/${id}/import`),
};

// ── AI ───────────────────────────────────────────────────────
export const aiApi = {
  generateLesson: (topic: string, grade: string, numSlides = 6) =>
    api.post("/ai/generate-lesson", { topic, grade, num_slides: numSlides }),
  generateQuiz: (lessonId: string, numQuestions = 5, type = "mcq") =>
    api.post("/ai/generate-quiz", { lesson_id: lessonId, num_questions: numQuestions, type }),
};
