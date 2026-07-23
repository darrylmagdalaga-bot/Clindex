import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format = "MMM DD, YYYY"): string {
  if (!date) return "—";
  const d = new Date(date);
  const month = d.toLocaleString("default", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return format.replace("MMM", month).replace("DD", day).replace("YYYY", String(year));
}

export function formatDateLong(date: string | Date): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? singular + "s");
}