"use client";

import { useState, useRef, useEffect } from "react";
import {
  Landmark,
  QrCode,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Send,
  Loader2,
  ChevronRight,
  Info,
  Building2,
  Sparkles,
  HelpCircle,
  FileText,
} from "lucide-react";
import { useApp } from "@/components/app-provider";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  MetricCard,
  PageHeading,
} from "@/components/ui";
import {
  VERIFIED_UPI_GUIDES,
  VERIFIED_CURRENT_ACCOUNTS,
  VERIFIED_CREDIT_CARDS,
  matchCurrentAccounts,
  matchCreditCards,
  LAST_VERIFIED_DATE,
  type CurrentAccountFilter,
  type CreditCardFilter,
} from "@/lib/domain/banking-agent";
import type {
  CurrentAccountOption,
  BusinessCreditCardOption,
  UpiOnboardingGuide,
} from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; url: string; lastChecked: string }>;
  suggestedFollowups?: string[];
}

export function BankingPage() {
  const { t, lang } = useApp();
  const [activeTab, setActiveTab] = useState<"advisor" | "upi" | "accounts" | "cards">("advisor");

  // Conversational Agent state
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      role: "assistant",
      content:
        lang === "hi"
          ? "नमस्ते! मैं VyaparAI का **बैंकिंग और वित्तीय सेटअप सहायक** हूँ।\n\nमैं आपकी दुकान के लिए वास्तविक और सत्यापित जानकारी प्रदान करता हूँ:\n• **मर्चेंट यूपीआई और क्यूआर सेटअप** (0% शुल्क और दैनिक सीमाएं)\n• **चालू खाता (Current Account) तुलना** (एसबीआई, एचडीएफसी और आईसीआईसीआई)\n• **व्यापारिक क्रेडिट कार्ड** (खर्चों पर बचत और शुल्क माफ़ी की शर्तें)\n\nआप किस विषय में सहायता चाहते हैं?"
          : lang === "hinglish"
          ? "Namaste! Main VyaparAI ka **Banking & Financial Setup Agent** hoon.\n\nMain aapki shop ke liye verified aur authoritative information provide karta hoon:\n• **Merchant UPI & QR Setup** (0% MDR aur higher limits)\n• **Current Account Comparison** (SBI, HDFC aur ICICI)\n• **Business Credit Cards** (Rewards, cash credit aur fee waivers)\n\nAap kis baare mein jaanna chahte hain?"
          : "Welcome to the **VyaparAI Banking & Financial Setup Agent**.\n\nI provide genuine, source-backed guidance for Indian MSMEs and retail merchants:\n• **Merchant UPI QR Onboarding** (0% MDR, settlement terms, soundbox)\n• **Current Account Selection** (Real MAB, cash deposit slabs for SBI, HDFC, ICICI)\n• **Business Credit Cards** (Verified reward rates, spend waivers, eligibility)\n\nAsk me any question below or choose an option to get started.",
      sources: [
        {
          title: "NPCI Official UPI Product Specifications",
          url: "https://www.npci.org.in/what-we-do/upi/product-overview",
          lastChecked: LAST_VERIFIED_DATE,
        },
        {
          title: "RBI Consumer Information on Commercial Banking",
          url: "https://www.rbi.org.in/commonman/English/Scripts/PressReleases.aspx",
          lastChecked: LAST_VERIFIED_DATE,
        },
      ],
      suggestedFollowups: [
        lang === "hi"
          ? "दुकान के लिए मर्चेंट यूपीआई कैसे शुरू करें?"
          : lang === "hinglish"
          ? "Shop par UPI QR kaise lagayein?"
          : "I want to start accepting UPI payments for my shop",
        lang === "hi"
          ? "मेरी दुकान के लिए कौन सा चालू खाता सही है?"
          : lang === "hinglish"
          ? "Meri shop ke liye kaun sa current account best hai?"
          : "Which current account fits my business requirements?",
        lang === "hi"
          ? "व्यापारिक क्रेडिट कार्ड सुझाव दें"
          : lang === "hinglish"
          ? "Business credit card recommend karein"
          : "Which credit card is best for my business expenses?",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filters for current accounts & credit cards
  const [caFilter, setCaFilter] = useState<CurrentAccountFilter>({});
  const [ccFilter, setCcFilter] = useState<CreditCardFilter>({});

  // Active Detail Drawer
  const [selectedCA, setSelectedCA] = useState<CurrentAccountOption | null>(null);
  const [selectedCC, setSelectedCC] = useState<BusinessCreditCardOption | null>(null);
  const [selectedUpi, setSelectedUpi] = useState<UpiOnboardingGuide | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSend(textToSend?: string) {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language: lang,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        sources: data.sources || [],
        suggestedFollowups: data.suggestedFollowups || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Banking agent error:", err);
      const fallbackMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          lang === "hi"
            ? "क्षमा करें, नेटवर्क कनेक्शन में समस्या है। कृपया नीचे दिए गए टैब से सत्यापित जानकारी देखें या पुनः प्रयास करें।"
            : lang === "hinglish"
            ? "Network connectivity issue aayi hai. Kripya niche diye gaye tabs se verified banking terms check karein ya retry karein."
            : "Connection error. Please review the verified product tables below or retry your query.",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  const filteredAccounts = matchCurrentAccounts(caFilter);
  const filteredCards = matchCreditCards(ccFilter);

  return (
    <div className="banking-workspace">
      {/* 1. Header */}
      <PageHeading title={t("banking")} subtitle={t("bankingSubtitle")}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            variant={activeTab === "advisor" ? "primary" : "secondary"}
            onClick={() => setActiveTab("advisor")}
          >
            <Sparkles size={15} />
            {t("financialCopilot")}
          </Button>
          <Button
            variant={activeTab === "upi" ? "primary" : "secondary"}
            onClick={() => setActiveTab("upi")}
          >
            <QrCode size={15} />
            {t("upiOnboarding")}
          </Button>
          <Button
            variant={activeTab === "accounts" ? "primary" : "secondary"}
            onClick={() => setActiveTab("accounts")}
          >
            <Building2 size={15} />
            {t("currentAccounts")}
          </Button>
          <Button
            variant={activeTab === "cards" ? "primary" : "secondary"}
            onClick={() => setActiveTab("cards")}
          >
            <CreditCard size={15} />
            {t("businessCreditCards")}
          </Button>
        </div>
      </PageHeading>

      {/* 2. Security & Compliance Banner */}
      <div className="security-notice-banner" style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.85rem 1.25rem",
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        borderRadius: "8px",
        marginBottom: "1.25rem",
        fontSize: "0.875rem",
      }}>
        <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div style={{ flex: 1 }}>
          <strong style={{ color: "var(--foreground)" }}>{t("securityNotice")}</strong>
          <span className="muted block" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
            All comparisons are sourced strictly from official NPCI circulars and bank tariff sheets. Last verified: {LAST_VERIFIED_DATE}.
          </span>
        </div>
      </div>

      {/* 3. Tab Content */}

      {/* TAB A: Conversational Advisor */}
      {activeTab === "advisor" && (
        <div className="banking-advisor-container" style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.25rem",
          alignItems: "start",
        }}>
          <Card className="chat-card" style={{ display: "flex", flexDirection: "column", height: "650px", padding: 0 }}>
            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    backgroundColor: m.role === "user" ? "var(--accent-mint, #10b981)" : "var(--bg-subtle, rgba(0,0,0,0.03))",
                    color: m.role === "user" ? "#ffffff" : "var(--foreground)",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    border: m.role === "user" ? "none" : "1px solid var(--border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    {m.role === "assistant" ? <Sparkles size={14} className="text-emerald-600" /> : null}
                    <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>
                      {m.role === "assistant" ? "VyaparAI Financial Advisor" : "You"}
                    </strong>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", lineHeight: "1.55" }}>
                    {m.content}
                  </div>

                  {/* Sources if present */}
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed rgba(0,0,0,0.15)", fontSize: "0.75rem" }}>
                      <span className="muted block" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                        {t("verifiedSources")}:
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {m.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "2px 8px",
                              backgroundColor: "rgba(16, 185, 129, 0.12)",
                              borderRadius: "4px",
                              color: "var(--accent-mint, #059669)",
                              textDecoration: "none",
                              fontSize: "0.75rem",
                            }}
                          >
                            <span>{s.title}</span>
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested followups */}
                  {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {m.suggestedFollowups.map((f, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => handleSend(f)}
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "16px",
                            backgroundColor: "var(--bg-card, #fff)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {f} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", color: "var(--muted)" }}>
                  <Loader2 size={16} className="spin text-emerald-600" />
                  <span style={{ fontSize: "0.85rem" }}>Verifying authoritative sources…</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                display: "flex",
                gap: "0.5rem",
                padding: "1rem",
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.01))",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("askBankingQuestion")}
                disabled={isTyping}
                style={{
                  flex: 1,
                  padding: "0.65rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-card, #fff)",
                  color: "var(--foreground)",
                  fontSize: "0.9rem",
                }}
              />
              <Button type="submit" variant="primary" disabled={isTyping || !input.trim()}>
                <Send size={15} />
              </Button>
            </form>
          </Card>

          {/* Quick Setup Cards Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <QrCode size={18} className="text-emerald-600" />
                <strong>UPI Setup Fast-Track</strong>
              </div>
              <p className="small muted" style={{ marginBottom: "0.75rem" }}>
                Accept QR payments with 0% MDR directly to your bank account with voice alerts.
              </p>
              <Button
                variant="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                onClick={() => setActiveTab("upi")}
              >
                <span>{t("viewGuide")}</span>
                <ChevronRight size={14} />
              </Button>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Building2 size={18} className="text-emerald-600" />
                <strong>Current Accounts</strong>
              </div>
              <p className="small muted" style={{ marginBottom: "0.75rem" }}>
                Compare verified MAB & cash deposit slabs for SBI, HDFC & ICICI.
              </p>
              <Button
                variant="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                onClick={() => setActiveTab("accounts")}
              >
                <span>{t("compareAccounts")}</span>
                <ChevronRight size={14} />
              </Button>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <CreditCard size={18} className="text-emerald-600" />
                <strong>Business Credit Cards</strong>
              </div>
              <p className="small muted" style={{ marginBottom: "0.75rem" }}>
                Compare annual fees, spend waivers, and rewards for retailers.
              </p>
              <Button
                variant="secondary"
                style={{ width: "100%", justifyContent: "space-between" }}
                onClick={() => setActiveTab("cards")}
              >
                <span>{t("compareCards")}</span>
                <ChevronRight size={14} />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB B: UPI Onboarding */}
      {activeTab === "upi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="metrics-strip three">
            <MetricCard
              label="Standard UPI MDR"
              value="0%"
              detail="Zero fee on bank-to-bank UPI"
              icon={CheckCircle2}
            />
            <MetricCard
              label="Merchant Settlement"
              value="₹5,00,000 / day"
              detail="Highest tier for retail MCCs"
              icon={QrCode}
            />
            <MetricCard
              label="NPCI RuPay Waiver"
              value="Up to ₹2,000"
              detail="Zero interchange on small UPI"
              icon={ShieldCheck}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {VERIFIED_UPI_GUIDES.map((guide) => (
              <Card key={guide.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <Badge status="active">{guide.category}</Badge>
                    <span className="small muted">Verified {guide.officialSource.lastChecked}</span>
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    {guide.title[lang] || guide.title.en}
                  </h3>
                  <p className="small muted" style={{ marginBottom: "1rem" }}>
                    {guide.summary[lang] || guide.summary.en}
                  </p>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                      Step-by-Step Instructions:
                    </strong>
                    <ol style={{ paddingLeft: "1.2rem", marginTop: "0.4rem", fontSize: "0.85rem", lineHeight: "1.5" }}>
                      {guide.steps.map((step, sIdx) => (
                        <li key={sIdx} style={{ marginBottom: "0.35rem" }}>
                          {step[lang] || step.en}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.8rem", marginBottom: "0.75rem", color: "var(--foreground)" }}>
                    <strong>Charges & Rules: </strong>
                    <span className="muted">{guide.limitsAndCharges[lang] || guide.limitsAndCharges.en}</span>
                  </div>
                  <a
                    href={guide.officialSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button secondary"
                    style={{ width: "100%", justifyContent: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                  >
                    <span>{guide.officialSource.title}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: Current Accounts */}
      {activeTab === "accounts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Filter Bar */}
          <Card style={{ padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button
                  variant={!caFilter.preferLowMab && !caFilter.expectedCashDeposit && !caFilter.needsVideoKyc ? "primary" : "ghost"}
                  onClick={() => setCaFilter({})}
                >
                  All Accounts
                </Button>
                <Button
                  variant={caFilter.preferLowMab ? "primary" : "ghost"}
                  onClick={() => setCaFilter((prev) => ({ ...prev, preferLowMab: !prev.preferLowMab }))}
                >
                  Low MAB (₹10,000)
                </Button>
                <Button
                  variant={caFilter.expectedCashDeposit === 200000 ? "primary" : "ghost"}
                  onClick={() => setCaFilter((prev) => ({ ...prev, expectedCashDeposit: prev.expectedCashDeposit ? undefined : 200000 }))}
                >
                  High Cash Deposits (&gt; ₹1L)
                </Button>
                <Button
                  variant={caFilter.needsVideoKyc ? "primary" : "ghost"}
                  onClick={() => setCaFilter((prev) => ({ ...prev, needsVideoKyc: !prev.needsVideoKyc }))}
                >
                  Instant Video-KYC
                </Button>
              </div>
              <span className="small muted">Showing {filteredAccounts.length} verified options</span>
            </div>
          </Card>

          {/* Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {filteredAccounts.map((acc) => (
              <Card key={acc.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-mint, #10b981)" }}>
                      {acc.bankName}
                    </span>
                    <Badge status="completed">{acc.openingMode}</Badge>
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                    {acc.accountName}
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", margin: "1rem 0" }}>
                    <div style={{ backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.02))", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                      <span className="small muted block">{t("mabRequirement")}</span>
                      <strong style={{ fontSize: "0.95rem" }}>{acc.mabRequirement}</strong>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.02))", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                      <span className="small muted block">{t("cashDeposit")}</span>
                      <strong style={{ fontSize: "0.85rem", lineHeight: "1.2" }}>{acc.cashDepositLimit.slice(0, 35)}…</strong>
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                      Why this fits:
                    </strong>
                    <ul style={{ paddingLeft: "1.2rem", marginTop: "0.3rem", fontSize: "0.825rem" }}>
                      {acc.tradeoffs.pros.slice(0, 2).map((pro, pIdx) => (
                        <li key={pIdx} style={{ color: "var(--foreground)", marginBottom: "0.2rem" }}>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                      Trade-offs to note:
                    </strong>
                    <ul style={{ paddingLeft: "1.2rem", marginTop: "0.3rem", fontSize: "0.825rem" }}>
                      {acc.tradeoffs.cons.map((con, cIdx) => (
                        <li key={cIdx} className="muted" style={{ marginBottom: "0.2rem" }}>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setSelectedCA(acc)}
                  >
                    View Details
                  </Button>
                  <a
                    href={acc.verification.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>{t("openOfficialSite")}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB D: Business Credit Cards */}
      {activeTab === "cards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Filter Bar */}
          <Card style={{ padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button
                  variant={!ccFilter.preferLowFee && !ccFilter.primaryCategory ? "primary" : "ghost"}
                  onClick={() => setCcFilter({})}
                >
                  All Cards
                </Button>
                <Button
                  variant={ccFilter.preferLowFee ? "primary" : "ghost"}
                  onClick={() => setCcFilter((prev) => ({ ...prev, preferLowFee: !prev.preferLowFee }))}
                >
                  Low Fee (₹500)
                </Button>
                <Button
                  variant={ccFilter.primaryCategory === "online" ? "primary" : "ghost"}
                  onClick={() => setCcFilter((prev) => ({ ...prev, primaryCategory: prev.primaryCategory === "online" ? undefined : "online" }))}
                >
                  Online Spends & Taxes
                </Button>
                <Button
                  variant={ccFilter.primaryCategory === "travel" ? "primary" : "ghost"}
                  onClick={() => setCcFilter((prev) => ({ ...prev, primaryCategory: prev.primaryCategory === "travel" ? undefined : "travel" }))}
                >
                  Airport Lounges & Travel
                </Button>
                <Button
                  variant={ccFilter.primaryCategory === "advertising" ? "primary" : "ghost"}
                  onClick={() => setCcFilter((prev) => ({ ...prev, primaryCategory: prev.primaryCategory === "advertising" ? undefined : "advertising" }))}
                >
                  Vendor Bills & Digital Ads
                </Button>
              </div>
              <span className="small muted">Showing {filteredCards.length} verified options</span>
            </div>
          </Card>

          {/* Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {filteredCards.map((card) => (
              <Card key={card.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-mint, #10b981)" }}>
                      {card.bankName}
                    </span>
                    <Badge status="completed">ITR Min ₹3L+</Badge>
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                    {card.cardName}
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", margin: "1rem 0" }}>
                    <div style={{ backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.02))", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                      <span className="small muted block">{t("annualFee")}</span>
                      <strong style={{ fontSize: "0.95rem" }}>₹{card.annualFee} + GST</strong>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.02))", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                      <span className="small muted block">{t("waiverCondition")}</span>
                      <strong style={{ fontSize: "0.85rem", lineHeight: "1.2" }}>{card.feeWaiverCondition}</strong>
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                      {t("rewardStructure")}:
                    </strong>
                    <p style={{ fontSize: "0.825rem", marginTop: "0.25rem", color: "var(--foreground)" }}>
                      {card.rewardRate}
                    </p>
                  </div>

                  {card.estimatedAnnualValue && (
                    <div style={{
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      marginBottom: "1rem",
                      fontSize: "0.8rem",
                    }}>
                      <strong style={{ color: "var(--accent-mint, #059669)" }}>Estimated Net Value: </strong>
                      <span style={{ color: "var(--foreground)" }}>{card.estimatedAnnualValue}</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setSelectedCC(card)}
                  >
                    View Terms
                  </Button>
                  <a
                    href={card.verification.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>{t("openOfficialSite")}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL DRAWER: Current Account */}
      {selectedCA && (
        <Drawer
          title={`${selectedCA.bankName} - ${selectedCA.accountName}`}
          onClose={() => setSelectedCA(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "0.5rem" }}>
            <div>
              <span className="small muted block">Minimum Average Balance</span>
              <strong style={{ fontSize: "1.1rem" }}>{selectedCA.mabRequirement}</strong>
            </div>

            <div>
              <span className="small muted block">Cash Deposit Terms</span>
              <p style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{selectedCA.cashDepositLimit}</p>
            </div>

            <div>
              <span className="small muted block">Digital Transaction Facility</span>
              <p style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{selectedCA.digitalTxnTerms}</p>
            </div>

            <div>
              <span className="small muted block">Required KYC & Business Documents</span>
              <ul style={{ paddingLeft: "1.2rem", marginTop: "0.35rem", fontSize: "0.875rem" }}>
                {selectedCA.requiredDocuments.map((doc, idx) => (
                  <li key={idx} style={{ marginBottom: "0.3rem" }}>{doc}</li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.02))", padding: "0.75rem", borderRadius: "8px" }}>
              <span className="small muted block">Official Source Verification</span>
              <strong style={{ fontSize: "0.85rem" }}>{selectedCA.verification.sourceName}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                <a
                  href={selectedCA.verification.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                >
                  <span>Open Bank Portal</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* DETAIL DRAWER: Credit Card */}
      {selectedCC && (
        <Drawer
          title={`${selectedCC.bankName} - ${selectedCC.cardName}`}
          onClose={() => setSelectedCC(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "0.5rem" }}>
            <div>
              <span className="small muted block">Annual Fee & Reversal</span>
              <strong style={{ fontSize: "1.1rem" }}>₹{selectedCC.annualFee} + GST</strong>
              <p className="small muted" style={{ marginTop: "0.2rem" }}>{selectedCC.feeWaiverCondition}</p>
            </div>

            <div>
              <span className="small muted block">Reward Rate</span>
              <p style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{selectedCC.rewardRate}</p>
            </div>

            <div>
              <span className="small muted block">Exclusions & Limits</span>
              <ul style={{ paddingLeft: "1.2rem", marginTop: "0.35rem", fontSize: "0.875rem" }}>
                {selectedCC.exclusionsAndCaps.map((ex, idx) => (
                  <li key={idx} className="muted" style={{ marginBottom: "0.25rem" }}>{ex}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="small muted block">Eligibility Conditions</span>
              <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>{selectedCC.eligibilityCriteria}</p>
            </div>

            <div style={{ backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.02))", padding: "0.75rem", borderRadius: "8px" }}>
              <span className="small muted block">Official Source Verification</span>
              <strong style={{ fontSize: "0.85rem" }}>{selectedCC.verification.sourceName}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                <a
                  href={selectedCC.verification.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                >
                  <span>Open Card Portal</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
