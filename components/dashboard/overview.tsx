"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  TrendingUp,
  Clock,
  ArrowDownRight,
  Box,
  AlertCircle,
  FilePlus,
  Banknote,
  UploadCloud,
  Sparkles,
  ExternalLink,
  Zap,
  Mic,
  Send,
  Plus
} from "lucide-react";
import { useApp } from "@/components/app-provider";
import { businessTotals } from "@/lib/mock/business";
import { money } from "@/lib/utils/format";

export function Overview() {
  const { data, open } = useApp();
  const router = useRouter();
  const [aiQuery, setAiQuery] = useState("");

  if (!data) return null;
  const totals = businessTotals(data);

  const handleAskAI = (prompt?: string) => {
    const q = prompt || aiQuery;
    if (q && q.trim()) {
      router.push(`/assistant?q=${encodeURIComponent(q.trim())}`);
    } else {
      router.push("/assistant");
    }
  };

  return (
    <div className="space-y-8">
      {/* Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-purple font-bold text-[10px] uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
            Live Demo • 5 OCT 2026
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white clash-font tracking-tight">
            Good morning, <span className="text-brand-purple">Sharma Electronics</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Your business dashboard snapshot for today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Calendar size={14} />
            <span>September 2026</span>
            <ChevronDown size={12} />
          </button>
          <button
            type="button"
            onClick={() => open({ kind: "createInvoice" })}
            className="px-6 py-2 bg-brand-purple text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-brand-purple/90 transition-all"
          >
            <Plus size={14} />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* ⭐ FLAGSHIP AI COPILOT HERO COMMAND CENTER (MAIN THING IN THE APP) */}
      <div className="relative rounded-2xl bg-gradient-to-r from-purple-900/10 via-slate-900/5 to-teal-900/10 dark:from-brand-purple/20 dark:via-slate-900/80 dark:to-brand-teal/20 border-2 border-brand-purple/40 dark:border-brand-purple/50 p-6 sm:p-8 custom-shadow overflow-hidden group">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 dark:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple text-xs font-extrabold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sarvam 105B + Groq 120B Dual Engine • Zero-Fabrication Gate Active</span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-purple" />
              Flagship Financial Copilot
            </div>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white clash-font tracking-tight">
              Ask VyaparAI anything about your business
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Autonomous grounding across 40 invoices, bank settlements, GST, vendor bills, and inventory.
            </p>
          </div>

          {/* Interactive AI Prompt Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAI();
            }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder='Ask in English, Hindi, or Hinglish: "Which payments are overdue and what should I do this week?"'
                className="w-full bg-white dark:bg-slate-950/80 border-2 border-slate-200 dark:border-slate-700/80 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => router.push("/assistant")}
                title="Voice input"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-purple transition-colors p-1"
              >
                <Mic size={18} />
              </button>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/30 transition-all shrink-0 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Ask VyaparAI</span>
              <Send size={14} />
            </button>
          </form>

          {/* 4 Quick Prompt Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              "Which payments are overdue and what should I do this week?",
              "Draft WhatsApp payment reminders for overdue invoices",
              "Why did electricity expense spike 48% in September?",
              "What is our restock plan for Dell 24\" Monitors?",
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => handleAskAI(promptText)}
                className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 shadow-xs text-left cursor-pointer"
              >
                <Sparkles size={12} className="text-brand-purple shrink-0" />
                <span>{promptText}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl custom-shadow transition-theme">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Revenue</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                {money(totals.revenue, true)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">+12.4% vs last month</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl custom-shadow transition-theme">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                {money(totals.outstanding, true)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-brand-purple/5 dark:bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-brand-purple font-bold uppercase tracking-tight">
            4 Invoices pending
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl custom-shadow transition-theme">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expenses</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                {money(totals.expenses, true)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
            Billed in September
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl custom-shadow transition-theme">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                {totals.lowStock} <span className="text-xs text-slate-400 font-bold">Units</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Box size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-amber-600 font-bold uppercase tracking-tight">
            Needs attention
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl custom-shadow transition-theme">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overdue</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                3 <span className="text-xs text-slate-400 font-bold">Bills</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 flex items-center justify-center text-brand-teal">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-brand-teal font-bold uppercase tracking-tight">
            High Priority
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => open({ kind: "createInvoice" })}
          className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 rounded-xl custom-shadow flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <FilePlus size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">
              Create Invoice
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">10 Second Flow</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => open({ kind: "recordPayment" })}
          className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-brand-purple rounded-xl custom-shadow flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-purple/5 dark:bg-brand-purple/10 text-brand-purple flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Banknote size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-brand-purple transition-colors">
              Record Payment
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Inbound Cash</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/documents")}
          className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 rounded-xl custom-shadow flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <UploadCloud size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors">
              Upload OCR
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Scan Bill or PDF</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/assistant")}
          className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-brand-teal rounded-xl custom-shadow flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-teal/5 dark:bg-brand-teal/10 text-brand-teal flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-brand-teal transition-colors">
              Ask AI Copilot
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Voice or Text</p>
          </div>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white clash-font">Daily Priority</h2>
            </div>
            <Link href="/insights" className="text-xs font-bold text-brand-purple hover:underline">
              View all insights
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority 1 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl custom-shadow border border-slate-200 dark:border-slate-800 transition-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-100 dark:border-red-900/30 uppercase tracking-widest">
                    High Priority
                  </span>
                  <span className="text-xs font-bold text-slate-300 dark:text-slate-700">01</span>
                </div>
                <h5 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                  Collect ₹35,000 from ABC Traders
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  12 days overdue • Largest unpaid bill.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => open({ kind: "invoice", id: "INV-1023" })}
                  className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:underline cursor-pointer"
                >
                  INV-1023 <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => open({ kind: "action", id: "insight-1" })}
                  className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded text-[10px] font-bold uppercase tracking-tight transition-all cursor-pointer"
                >
                  Remind
                </button>
              </div>
            </div>

            {/* Priority 2 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl custom-shadow border border-slate-200 dark:border-slate-800 transition-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-100 dark:border-amber-900/30 uppercase tracking-widest">
                    Inventory
                  </span>
                  <span className="text-xs font-bold text-slate-300 dark:text-slate-700">02</span>
                </div>
                <h5 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                  Restock Dell 24&quot; Monitor
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  8 units left • Estimated stockout in 4 days.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => open({ kind: "product", id: "PRD-102" })}
                  className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:underline cursor-pointer"
                >
                  PRD-102 <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => open({ kind: "action", id: "insight-2" })}
                  className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded text-[10px] font-bold uppercase tracking-tight transition-all cursor-pointer"
                >
                  Restock
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Performance Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl custom-shadow border border-slate-200 dark:border-slate-800 transition-theme">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white clash-font">
                  Revenue Performance
                </h3>
                <p className="text-xs text-slate-400">Monthly Spend vs Revenue (₹ Lakhs)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Spend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-brand-purple" />
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">Revenue</span>
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {[
                { month: "Apr", spend: 70, rev: 80, spendL: "₹3.2L", revL: "₹4.1L" },
                { month: "May", spend: 65, rev: 70, spendL: "₹2.9L", revL: "₹3.8L" },
                { month: "Jun", spend: 55, rev: 90, spendL: "₹3.4L", revL: "₹4.5L" },
                { month: "Jul", spend: 75, rev: 60, spendL: "₹3.1L", revL: "₹4.2L" },
                { month: "Aug", spend: 85, rev: 75, spendL: "₹3.6L", revL: "₹4.7L" },
                { month: "Sep", spend: 95, rev: 85, spendL: "₹2.1L", revL: "₹4.8L" },
              ].map((item) => (
                <div
                  key={item.month}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group cursor-pointer"
                  style={{ height: `${item.spend}%` }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-brand-purple rounded-t-lg group-hover:bg-brand-purple/80 transition-all"
                    style={{ height: `${item.rev}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                    Rev: {item.revL} | Spend: {item.spendL}
                  </div>
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400 uppercase">
                    {item.month}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Shop Score Gauge */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl custom-shadow border border-slate-200 dark:border-slate-800 transition-theme">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-tight text-center">
              Shop Score
            </h3>
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    stroke="#8B5CF6"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="314.15"
                    strokeDashoffset="56.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-white">82</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Healthy</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <span className="text-slate-500">Cash Flow</span>
                <span className="text-slate-800 dark:text-slate-200">84%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-brand-purple h-full w-[84%]" />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <span className="text-slate-500">Efficiency</span>
                <span className="text-slate-800 dark:text-slate-200">68%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-brand-teal h-full w-[68%]" />
              </div>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl custom-shadow border border-slate-200 dark:border-slate-800 transition-theme">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
              Recent Logs
            </h3>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Invoice Cleared</p>
                  <p className="text-[10px] text-slate-500">₹12,400 from ABC Traders</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 shrink-0 rounded-full bg-brand-purple mt-1.5" />
                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Stock Updated</p>
                  <p className="text-[10px] text-slate-500">10x Dell Monitors added</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 shrink-0 rounded-full bg-slate-400 mt-1.5" />
                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Backup Sync</p>
                  <p className="text-[10px] text-slate-500">Cloud storage successful</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => open({ kind: "more" })}
              className="w-full py-2.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[9px] font-black uppercase tracking-widest rounded-lg mt-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              View System Logs
            </button>
          </div>

          {/* Vyapar Pro Card */}
          <div className="p-6 rounded-2xl bg-brand-purple text-white relative overflow-hidden group shadow-lg shadow-brand-purple/20">
            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
            <Zap className="text-2xl mb-4" size={28} />
            <h4 className="text-lg font-bold mb-1">Vyapar Pro</h4>
            <p className="text-[10px] text-white/80 mb-6 font-medium uppercase">
              Unlimited AI Analysis &amp; Multi-Model Grounding
            </p>
            <button
              type="button"
              onClick={() => router.push("/assistant")}
              className="w-full py-2.5 bg-white text-brand-purple rounded-lg text-xs font-bold uppercase shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Active Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
