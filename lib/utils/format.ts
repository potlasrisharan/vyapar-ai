import type { Language } from "@/lib/types";
export const DEMO_DATE = "2026-10-05";
export function money(value: number, compact = false) {
  if (compact && value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (compact && value >= 1000) return `₹${Number((value / 1000).toFixed(1))}K`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
export function date(value: string, language: Language = "en") { return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(value)); }
export function daysBetween(from: string, to = DEMO_DATE) { return Math.floor((Date.parse(to) - Date.parse(from)) / 86400000); }
export function initials(name: string) { return name.split(" ").slice(0, 2).map(p => p[0]).join(""); }
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
