import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function subjectColor(subject: string): string {
  const map: Record<string, string> = {
    math:       "bg-amber-100 text-amber-700",
    science:    "bg-sage-100 text-sage-700",
    biology:    "bg-sage-100 text-sage-700",
    physics:    "bg-ink-100 text-ink-600",
    chemistry:  "bg-coral-100 text-coral-600",
    history:    "bg-amber-100 text-amber-700",
    english:    "bg-chalk-warm text-ink-600",
    geography:  "bg-sage-100 text-sage-700",
    art:        "bg-coral-100 text-coral-600",
  };
  return map[subject.toLowerCase()] ?? "bg-ink-100 text-ink-600";
}

export const SUBJECTS = [
  "Math", "Science", "Biology", "Physics", "Chemistry",
  "History", "English", "Geography", "Art", "Music", "Other",
];

export const GRADES = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "Grade 11", "Grade 12",
];
