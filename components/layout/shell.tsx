"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, CreditCard, FileText, LayoutGrid, Users, Truck, Package, Receipt, Lightbulb, MessageSquare, Settings, Search, ChevronDown, ArrowUpRight, MoreHorizontal, X, Building2, CheckCircle2, LayoutDashboard, Moon, Sun } from "lucide-react";
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
    <label className="language-select">
      <span className="sr-only">{t("selectLanguage")}</span>
      <span aria-hidden="true" className="language-symbol">
        अ<span>A</span>
      </span>
      <select
        value={lang}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label={t("language")}
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="language-arrow" />
    </label>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon-box" aria-hidden="true">
        <LayoutDashboard size={20} />
      </span>
      <span className="brand-name">
        Vyapar<span className="brand-ai">AI</span>
      </span>
    </span>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const isDark = theme === "dark";

  return (
    <div className="theme-toggle-row">
      <span className="theme-toggle-label">
        {isDark ? <Moon size={14} className="text-brand-purple" /> : <Sun size={14} className="text-amber-500" />}
        <span>{isDark ? "Dark" : "Light"}</span>
      </span>
      <button
        id="theme-toggle"
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark/light mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`theme-toggle-switch ${isDark ? "dark-active" : ""}`}
      >
        <span className={`theme-toggle-thumb ${isDark ? "dark-active" : ""}`} />
      </button>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, open, toast, clearToast, local, theme, setTheme } = useApp();
  const path = usePathname();
  const current = (path.split("/")[1] || "overview") as Route;
  const count = local.actions.filter((a) => a.status === "open").length;

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
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {t("skipContent")}
      </a>
      
      <aside className="sidebar">
        <Link href="/" aria-label="VyaparAI overview" className="brand-link">
          <Brand />
        </Link>

        <div className="sidebar-scrollable">
          {navCategories.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="workspace-label">{t(group.label as TranslationKey)}</span>
              <nav aria-label={group.label}>
                {group.items.map(({ route, icon: Icon, count: badgeCount }) => {
                  const isActive = current === route;
                  return (
                    <Link
                      key={route}
                      href={routeHref(route)}
                      className={`nav-link ${isActive ? "active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon size={17} className="nav-icon" />
                      <span className="nav-text">{t(route)}</span>
                      {badgeCount && <span className="nav-count">{badgeCount}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <ThemeToggle />
          <div className="sidebar-tip">
            <span className="tip-icon">
              <Lightbulb size={16} />
            </span>
            <p>{t("brandTag")}</p>
            <Link href="/assistant">
              <span>{t("askCopilot")}</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <Link
            href="/settings"
            className={`nav-link ${current === "settings" ? "active" : ""}`}
          >
            <Settings size={17} className="nav-icon" />
            <span className="nav-text">{t("settings")}</span>
          </Link>
          <button className="business-profile" onClick={() => open({ kind: "help" })}>
            <span className="avatar">RS</span>
            <span className="profile-details">
              <strong>{t("business")}</strong>
              <small>{t("location")}</small>
            </span>
            <ChevronDown size={13} className="profile-chevron" />
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="header">
          <div className="header-left">
            <div className="breadcrumb">
              <span className="desktop-only muted">{t("workspace")}</span>
              <span className="breadcrumb-slash desktop-only">/</span>
              <strong className="breadcrumb-current">{t(current)}</strong>
            </div>

            {/* Quick-Jump Section Pills for frictionless navigation */}
            <nav className="quick-jump-bar desktop-only" aria-label="Quick jump">
              <Link href="/invoices" className={`quick-pill ${current === "invoices" ? "active" : ""}`}>
                <Receipt size={13} />
                <span>Invoices</span>
              </Link>
              <Link href="/payments" className={`quick-pill ${current === "payments" ? "active" : ""}`}>
                <CreditCard size={13} />
                <span>Payments</span>
              </Link>
              <Link href="/assistant" className={`quick-pill ${current === "assistant" ? "active" : ""}`}>
                <MessageSquare size={13} />
                <span>Ask AI</span>
              </Link>
            </nav>
          </div>

          <div className="header-actions">
            <button
              className="global-search desktop-only"
              onClick={() => open({ kind: "search" })}
              aria-label={t("search")}
              title="Press ⌘K to search or jump anywhere"
            >
              <Search size={15} />
              <span>{t("search")}</span>
              <kbd aria-hidden="true">⌘K</kbd>
            </button>
            <span className="mobile-only">
              <IconButton icon={Search} label={t("search")} onClick={() => open({ kind: "search" })} />
            </span>
            <LanguageSwitcher />
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <span className="header-divider" />
            <div className="notification-button">
              <button
                className="action-center-btn"
                onClick={() => open({ kind: "actions" })}
                aria-label={t("actionCenter")}
                title={`${count} Action items need attention`}
              >
                <Bell size={17} />
                {count > 0 && (
                  <span className="action-pill-badge">
                    <span className="action-pulse" />
                    {count}
                  </span>
                )}
              </button>
            </div>
            <Link className="avatar header-avatar" href="/settings" aria-label={t("businessProfile")}>
              RS
            </Link>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className={`main-content ${current === "assistant" ? "assistant-main" : ""}`}
        >
          {children}
        </main>

        <footer className="app-footer">
          <span>
            <span className="status-dot" />
            {t("sampleData")}
          </span>
          <span>{t("demoDate")}</span>
          <button onClick={() => open({ kind: "help" })}>
            <CircleHelp size={14} />
            {t("help")}
          </button>
        </footer>
      </div>

      {/* Floating Glass Bottom Island for Mobile */}
      <nav className="mobile-nav" aria-label={t("workspace")}>
        {(["overview", "documents", "invoices", "assistant"] as Route[]).map((route) => {
          const Icon = navItems.find((n) => n.route === route)!.icon;
          return (
            <Link
              key={route}
              href={routeHref(route)}
              className={current === route ? "active" : ""}
              aria-current={current === route ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{t(route)}</span>
            </Link>
          );
        })}
        <button onClick={() => open({ kind: "more" })}>
          <MoreHorizontal size={20} />
          <span>{t("more")}</span>
        </button>
      </nav>

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

