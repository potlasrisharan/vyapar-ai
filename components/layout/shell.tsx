"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCard, FileText, LayoutGrid, Users, Truck, Package, Receipt, Lightbulb, MessageSquare, Search, ChevronDown, MoreHorizontal, X, Building2, CheckCircle2, LayoutDashboard, Moon, Sun, Sparkles, Languages, MoreVertical, PieChart } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { languages, type TranslationKey } from "@/lib/i18n";
import type { Route, Language } from "@/lib/types";
import { IconButton } from "@/components/ui";
import { DetailPanel } from "@/components/layout/detail-panel";
import { useEffect, type ReactNode } from "react";

export interface NavItem {
  route: Route;
  icon: typeof LayoutGrid;
  count?: number;
  spark?: boolean;
}

export interface NavCategory {
  label: TranslationKey;
  items: NavItem[];
}

export const navCategories: NavCategory[] = [
  {
    label: "workspace",
    items: [
      { route: "overview", icon: LayoutGrid },
      { route: "documents", icon: FileText },
      { route: "invoices", icon: Receipt },
      { route: "payments", icon: CreditCard },
    ],
  },
  {
    label: "operations",
    items: [
      { route: "customers", icon: Users },
      { route: "vendors", icon: Truck },
      { route: "inventory", icon: Package },
      { route: "expenses", icon: Receipt },
    ],
  },
  {
    label: "intelligence",
    items: [
      { route: "insights", icon: Lightbulb, count: 6 },
      { route: "assistant", icon: MessageSquare },
    ],
  },
];


export const navItems = navCategories.flatMap((c) => c.items);
export const routeHref = (route: Route) => (route === "overview" ? "/" : `/${route}`);

export function LanguageSwitcher() {
  const { lang, setLanguage, t } = useApp();
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
      <Languages size={15} className="text-slate-500" />
      <select
        value={lang}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label={t("language")}
        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 border-none outline-none cursor-pointer pr-1"
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
            {l.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="text-slate-400" />
    </div>
  );
}

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center shadow-md shadow-brand-purple/20">
        <LayoutDashboard className="text-white" size={22} />
      </div>
      <span className="text-xl font-extrabold clash-font text-slate-800 dark:text-white">VyaparAI</span>
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between px-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
      <div className="flex items-center gap-2">
        <Sun size={15} className="text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase">Light</span>
      </div>
      <button
        id="theme-toggle"
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark/light mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200 dark:bg-brand-purple"
      >
        <span
          className={`${
            isDark ? "translate-x-5" : "translate-x-0"
          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Dark</span>
        <Moon size={15} className="text-slate-400" />
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, open, toast, clearToast } = useApp();
  const path = usePathname();
  const current = (path.split("/")[1] || "overview") as Route;

  // Global Cmd+K / Ctrl+K listener for instant search & jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open({ kind: "search" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-theme font-sans">
      <a href="#main" className="skip-link">
        {t("skipContent")}
      </a>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex-col z-50 transition-theme sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <Link href="/" aria-label="VyaparAI Overview">
            <Brand />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Workspace</p>
          <Link
            id="nav-overview"
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "overview"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutGrid size={18} />
            <span>Overview</span>
          </Link>
          <Link
            id="nav-docs"
            href="/documents"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "documents"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <FileText size={18} />
            <span>Documents</span>
          </Link>
          <Link
            id="nav-invoices"
            href="/invoices"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "invoices"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Receipt size={18} />
            <span>Invoices</span>
          </Link>
          <Link
            id="nav-payments"
            href="/payments"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "payments"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <CreditCard size={18} />
            <span>Payments</span>
          </Link>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-6">Operations</p>
          <Link
            id="nav-customers"
            href="/customers"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "customers"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Users size={18} />
            <span>Customers</span>
          </Link>
          <Link
            id="nav-vendors"
            href="/vendors"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "vendors"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Truck size={18} />
            <span>Vendors</span>
          </Link>
          <Link
            id="nav-inventory"
            href="/inventory"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "inventory"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Package size={18} />
            <span>Inventory</span>
          </Link>
          <Link
            id="nav-expenses"
            href="/expenses"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "expenses"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <PieChart size={18} />
            <span>Expenses</span>
          </Link>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-6">Intelligence</p>
          <Link
            id="nav-assistant"
            href="/assistant"
            className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "assistant"
                ? "sidebar-active font-semibold"
                : "font-semibold text-brand-purple hover:bg-brand-purple/10 dark:hover:bg-brand-purple/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-brand-purple" />
              <span>AI Copilot</span>
            </div>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/30">
              105B
            </span>
          </Link>
          <Link
            id="nav-insights"
            href="/insights"
            className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
              current === "insights"
                ? "sidebar-active font-semibold"
                : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <Lightbulb size={18} />
              <span>Insights</span>
            </div>
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-500">
              6
            </span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => open({ kind: "help" })}
            className="w-full text-left flex items-center gap-3 p-2 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-brand-purple">
              RS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">Sharma Electronics</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Kanpur, UP</p>
            </div>
            <MoreVertical size={16} className="text-slate-400" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0f172a] transition-theme">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 transition-theme">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" size={16} />
              <input
                type="text"
                readOnly
                onClick={() => open({ kind: "search" })}
                placeholder="Search commands or invoices (⌘K)"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-purple/50 outline-none text-slate-700 dark:text-slate-300 transition-theme cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/assistant"
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles size={14} className="text-brand-purple" />
              <span>Ask AI Copilot</span>
            </Link>

            <LanguageSwitcher />

            <div className="relative">
              <button
                type="button"
                onClick={() => open({ kind: "actions" })}
                className="p-1 text-slate-400 hover:text-brand-purple transition-colors"
                aria-label="3 notifications"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-purple text-[10px] font-bold text-white flex items-center justify-center rounded-full border border-white dark:border-[#0f172a]">
                  3
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => open({ kind: "help" })}
              className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase hover:ring-2 hover:ring-brand-purple transition-all"
            >
              RS
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {children}
        </main>

        {/* Mobile Navigation Island */}
        <nav className="lg:hidden fixed bottom-3 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex items-center justify-around z-50">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold ${
              current === "overview" ? "text-brand-purple" : "text-slate-500"
            }`}
          >
            <LayoutGrid size={18} />
            <span className="text-[10px]">Overview</span>
          </Link>
          <Link
            href="/invoices"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold ${
              current === "invoices" ? "text-brand-purple" : "text-slate-500"
            }`}
          >
            <Receipt size={18} />
            <span className="text-[10px]">Invoices</span>
          </Link>
          <Link
            href="/assistant"
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold text-brand-purple"
          >
            <Sparkles size={18} />
            <span className="text-[10px]">AI Copilot</span>
          </Link>
          <Link
            href="/documents"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold ${
              current === "documents" ? "text-brand-purple" : "text-slate-500"
            }`}
          >
            <FileText size={18} />
            <span className="text-[10px]">OCR</span>
          </Link>
          <button
            type="button"
            onClick={() => open({ kind: "more" })}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold text-slate-500"
          >
            <MoreHorizontal size={18} />
            <span className="text-[10px]">More</span>
          </button>
        </nav>
      </div>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <IconButton icon={X} label={t("close")} onClick={clearToast} />
        </div>
      )}
      <DetailPanel />
    </div>
  );
}

export function BusinessMini() {
  const { t } = useApp();
  return (
    <div className="business-mini">
      <span className="business-icon">
        <Building2 size={22} />
      </span>
      <div>
        <strong>{t("business")}</strong>
        <p>
          {t("retailer")} · {t("location")}
        </p>
      </div>
    </div>
  );
}

