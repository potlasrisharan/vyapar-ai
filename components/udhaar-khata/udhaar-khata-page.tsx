"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  MessageCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  CreditCard,
  History,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CalendarClock,
  CircleDollarSign,
  Users,
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
  SearchField,
} from "@/components/ui";
import {
  calculateCustomerUdhaarSummary,
  calculateUdhaarDashboardSummary,
  UDHAAR_CONFIG,
} from "@/lib/domain/udhaar-engine";
import { DEMO_DATE, date, daysBetween, money, initials } from "@/lib/utils/format";
import type {
  CollectionFollowup,
  UdhaarCustomerSummary,
} from "@/lib/types";

export function UdhaarKhataPage() {
  const { data, local, t, lang, open, recordPaymentPromise, recordFollowup, updatePromiseStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("priorityDesc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Action Dialog states
  const [whatsappModalCustomer, setWhatsappModalCustomer] = useState<UdhaarCustomerSummary | null>(null);
  const [promiseModalCustomer, setPromiseModalCustomer] = useState<UdhaarCustomerSummary | null>(null);
  const [followupModalCustomer, setFollowupModalCustomer] = useState<UdhaarCustomerSummary | null>(null);

  // Form states for Promise modal
  const [promiseDate, setPromiseDate] = useState("2026-10-12");
  const [promiseAmount, setPromiseAmount] = useState<number>(10000);
  const [promiseResponse, setPromiseResponse] = useState("");
  const [promiseNote, setPromiseNote] = useState("");

  // Form states for Follow-up modal
  const [followupChannel, setFollowupChannel] = useState<CollectionFollowup["channel"]>("call");
  const [followupStatus, setFollowupStatus] = useState<CollectionFollowup["status"]>("contacted");
  const [followupNotes, setFollowupNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("2026-10-06");

  // WhatsApp Draft state
  const [draftLanguage, setDraftLanguage] = useState<"en" | "hi" | "hinglish">(lang);
  const [customDraftText, setCustomDraftText] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);

  const customerSummaries = useMemo<UdhaarCustomerSummary[]>(() => {
    if (!data) return [];
    return data.customers.map((c) =>
      calculateCustomerUdhaarSummary(
        c,
        data.invoices,
        data.payments,
        local.paymentPromises ?? [],
        local.collectionFollowups ?? [],
        DEMO_DATE
      )
    );
  }, [data, local.paymentPromises, local.collectionFollowups]);

  const dashboardSummary = useMemo(() => {
    return calculateUdhaarDashboardSummary(customerSummaries, DEMO_DATE);
  }, [customerSummaries]);

  // "Aaj Kise Call Karein?" prioritized list (Urgent or highest priority overdue balances)
  const topPriorityCalls = useMemo(() => {
    return customerSummaries
      .filter((s) => s.totalOutstanding > 0 && (s.priority.band === "urgent" || s.daysOverdue >= 7))
      .sort((a, b) => b.priority.score - a.priority.score)
      .slice(0, 3);
  }, [customerSummaries]);

  // Ledger Filter & Sort
  const filteredLedger = useMemo(() => {
    return customerSummaries
      .filter((s) => {
        // Query match
        const matchesQuery =
          s.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customer.phone.includes(searchQuery) ||
          s.customer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.oldestUnpaidInvoice && s.oldestUnpaidInvoice.id.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;

        // By default, exclude settled zero-balance accounts unless 'settled' filter is explicitly chosen
        if (activeFilter !== "settled" && s.totalOutstanding === 0) {
          return false;
        }

        switch (activeFilter) {
          case "overdue":
            return s.overdueBalance > 0;
          case "dueToday":
            return s.invoices.some((i) => i.dueDate === DEMO_DATE && s.totalOutstanding > 0);
          case "due7Days":
            return s.upcomingBalance > 0 && s.daysOverdue === 0;
          case "highExposure":
            return s.totalOutstanding >= UDHAAR_CONFIG.highExposureThreshold;
          case "urgentPriority":
            return s.priority.band === "urgent";
          case "missedPromises":
            return s.priority.missedPromisesCount > 0;
          case "lowReliability":
            return !s.reliability.isInsufficientHistory && s.reliability.stars <= 2;
          case "insufficientHistory":
            return s.reliability.isInsufficientHistory;
          case "settled":
            return s.totalOutstanding === 0;
          case "all":
          default:
            return s.totalOutstanding > 0;
        }
      })
      .sort((a, b) => {
        switch (sortField) {
          case "outstandingDesc":
            return b.totalOutstanding - a.totalOutstanding;
          case "overdueDesc":
            return b.daysOverdue - a.daysOverdue;
          case "priorityDesc":
            return b.priority.score - a.priority.score;
          case "lastPaymentDesc":
            return (b.lastPayment?.date ?? "").localeCompare(a.lastPayment?.date ?? "");
          case "reliabilityDesc":
            return b.reliability.score - a.reliability.score;
          default:
            return b.priority.score - a.priority.score;
        }
      });
  }, [customerSummaries, searchQuery, activeFilter, sortField]);

  const selectedCustomerSummary = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerSummaries.find((s) => s.customer.id === selectedCustomerId) ?? null;
  }, [customerSummaries, selectedCustomerId]);

  const handleOpenWhatsAppModal = (summary: UdhaarCustomerSummary) => {
    setWhatsappModalCustomer(summary);
    setDraftLanguage(lang);
    setCopyFeedback(false);

    const custName = summary.customer.name;
    const oldestInv = summary.oldestUnpaidInvoice?.id ?? "Invoice";
    const amountStr = money(summary.totalOutstanding);
    const overdueText = summary.daysOverdue > 0 ? `${summary.daysOverdue} days` : "due shortly";

    let draft = "";
    if (lang === "hi") {
      draft = `नमस्ते ${custName}, शर्मा इलेक्ट्रॉनिक्स (कानपुर) से विनम्र अनुस्मारक। आपका बकाया ${amountStr} (${oldestInv}, ${overdueText}) देय है। कृपया यूपीआई या बैंक ट्रांसफर द्वारा भुगतान सुनिश्चित करें। धन्यवाद!`;
    } else if (lang === "hinglish") {
      draft = `Dear ${custName}, Sharma Electronics (Kanpur) se reminder. Aapka ${amountStr} pending hai for ${oldestInv} (${overdueText} overdue). Please UPI ya bank transfer se jaldi clear karein. Thank you!`;
    } else {
      draft = `Dear ${custName}, greetings from Sharma Electronics (Kanpur). This is a gentle reminder that ${amountStr} is currently pending for ${oldestInv} (${overdueText} overdue). Kindly arrange settlement at your earliest convenience. Thank you!`;
    }
    setCustomDraftText(draft);
  };

  const handleLanguageChangeDraft = (newLang: "en" | "hi" | "hinglish") => {
    setDraftLanguage(newLang);
    if (!whatsappModalCustomer) return;
    const custName = whatsappModalCustomer.customer.name;
    const oldestInv = whatsappModalCustomer.oldestUnpaidInvoice?.id ?? "Invoice";
    const amountStr = money(whatsappModalCustomer.totalOutstanding);
    const overdueText = whatsappModalCustomer.daysOverdue > 0 ? `${whatsappModalCustomer.daysOverdue} days` : "due shortly";

    if (newLang === "hi") {
      setCustomDraftText(
        `नमस्ते ${custName}, शर्मा इलेक्ट्रॉनिक्स (कानपुर) से विनम्र अनुस्मारक। आपका बकाया ${amountStr} (${oldestInv}, ${overdueText}) देय है। कृपया यूपीआई या बैंक ट्रांसफर द्वारा भुगतान सुनिश्चित करें। धन्यवाद!`
      );
    } else if (newLang === "hinglish") {
      setCustomDraftText(
        `Dear ${custName}, Sharma Electronics (Kanpur) se reminder. Aapka ${amountStr} pending hai for ${oldestInv} (${overdueText} overdue). Please UPI ya bank transfer se jaldi clear karein. Thank you!`
      );
    } else {
      setCustomDraftText(
        `Dear ${custName}, greetings from Sharma Electronics (Kanpur). This is a gentle reminder that ${amountStr} is currently pending for ${oldestInv} (${overdueText} overdue). Kindly arrange settlement at your earliest convenience. Thank you!`
      );
    }
  };

  const handleCopyDraft = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(customDraftText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleOpenWhatsAppExternal = () => {
    if (!whatsappModalCustomer) return;
    const cleanPhone = whatsappModalCustomer.customer.phone.replace(/[^0-9]/g, "");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customDraftText)}`;
    window.open(url, "_blank");
  };

  const handleSavePromise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promiseModalCustomer) return;
    recordPaymentPromise({
      businessId: "BIZ-1",
      customerId: promiseModalCustomer.customer.id,
      invoiceId: promiseModalCustomer.oldestUnpaidInvoice?.id,
      expectedAmount: Number(promiseAmount),
      expectedDate: promiseDate,
      status: "pending",
      customerResponse: promiseResponse,
      note: promiseNote,
      recordedBy: `Owner (${t("owner")})`,
    });
    setPromiseModalCustomer(null);
  };

  const handleSaveFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupModalCustomer) return;
    recordFollowup({
      businessId: "BIZ-1",
      customerId: followupModalCustomer.customer.id,
      channel: followupChannel,
      status: followupStatus,
      contactNotes: followupNotes,
      scheduledDate: followupDate,
      recordedBy: `Owner (${t("owner")})`,
    });
    setFollowupModalCustomer(null);
  };

  const renderStars = (stars: number, isInsufficient: boolean) => {
    if (isInsufficient) {
      return (
        <span className="insufficient-history-badge" title={t("insufficientHistory")}>
          <AlertCircle size={13} />
          {t("insufficientHistory")}
        </span>
      );
    }
    return (
      <span className="star-rating" aria-label={`${stars} stars out of 5`}>
        {"★".repeat(stars)}
        <span className="empty-stars">{"☆".repeat(5 - stars)}</span>
      </span>
    );
  };

  const renderPriorityBadge = (band: string, score: number) => {
    const bandClass =
      band === "urgent"
        ? "priority-urgent"
        : band === "high"
        ? "priority-high"
        : band === "medium"
        ? "priority-medium"
        : "priority-low";

    const bandLabel =
      band === "urgent"
        ? t("filterUrgentPriority")
        : band === "high"
        ? "High"
        : band === "medium"
        ? "Medium"
        : "Low";

    return (
      <span className={`priority-pill ${bandClass}`}>
        <strong>{score}</strong>/100 · {bandLabel}
      </span>
    );
  };

  return (
    <div className="udhaar-khata-workspace">
      {/* 1. Header */}
      <PageHeading title={t("udhaarKhata")} subtitle={t("udhaarKhataSubtitle")}>
        <Button variant="secondary" onClick={() => open({ kind: "recordPayment" })}>
          <CreditCard size={15} />
          {t("recordPayment")}
        </Button>
        <Button variant="primary" onClick={() => open({ kind: "createInvoice" })}>
          <Plus size={15} />
          {t("createInvoice")}
        </Button>
      </PageHeading>

      {/* 2. Main Dashboard: Collection Position Summary (7 Core Metrics) */}
      <section className="collection-summary-section" aria-label="Collection Position">
        <div className="metrics-strip four mb-3">
          <MetricCard
            label={t("totalReceivables")}
            value={money(dashboardSummary.totalOutstanding)}
            detail={`${dashboardSummary.customersWithBalanceCount} ${t("customersOwing")}`}
            icon={CircleDollarSign}
          />
          <MetricCard
            label={t("totalOverdue")}
            value={<span className="danger-text">{money(dashboardSummary.totalOverdue)}</span>}
            detail={`${dashboardSummary.overdueCustomersCount} ${t("overdueCustomers")}`}
            icon={ShieldAlert}
          />
          <MetricCard
            label={t("dueNext7Days")}
            value={money(dashboardSummary.dueInSevenDays)}
            detail={t("upcomingPayment")}
            icon={CalendarClock}
          />
          <MetricCard
            label={t("totalCollected")}
            value={money(dashboardSummary.totalCollected)}
            detail={t("reporting")}
            icon={CheckCircle2}
          />
        </div>

        <div className="metrics-strip three">
          <MetricCard
            label={t("customersOwing")}
            value={dashboardSummary.customersWithBalanceCount}
            detail={`${dashboardSummary.overdueCustomersCount} ${t("overdue")}`}
            icon={Users}
          />
          <MetricCard
            label={t("overdueCustomers")}
            value={dashboardSummary.overdueCustomersCount}
            detail={t("needsFollowup")}
            icon={Clock}
          />
          <MetricCard
            label={t("urgentFollowups")}
            value={<span className="urgent-count">{dashboardSummary.urgentFollowupCount}</span>}
            detail={t("whoToCallToday")}
            icon={AlertCircle}
          />
        </div>
      </section>

      {/* 3. Prominent Section: "Aaj Kise Call Karein?" / "Who Should You Contact Today?" */}
      <section className="today-panel udhaar-priority-panel" aria-label={t("whoToCallToday")}>
        <div className="today-heading">
          <div className="today-title">
            <div className="sparkle-box">
              <Phone size={18} className="call-icon-pulse text-brand-teal" />
            </div>
            <div>
              <h2>{t("whoToCallToday")}</h2>
              <p>{t("whoToCallSubtitle")}</p>
            </div>
          </div>
          <span className="badge badge-teal">{topPriorityCalls.length} Priority Leads</span>
        </div>

        <div className="call-priorities-grid">
          {topPriorityCalls.map((summary, idx) => (
            <Card key={summary.customer.id} className="priority-call-card">
              <div className="priority-card-top">
                <span className="priority-rank-badge">0{idx + 1}</span>
                {renderPriorityBadge(summary.priority.band, summary.priority.score)}
              </div>

              <div className="priority-card-body">
                <div className="priority-person-header">
                  <div>
                    <h3>{summary.customer.name}</h3>
                    <p className="muted small">
                      {summary.customer.contact} · {summary.customer.city}
                    </p>
                  </div>
                  <div className="priority-balance-box">
                    <span className="overdue-amount">{money(summary.totalOutstanding)}</span>
                    <span className="overdue-tag danger-text">{summary.daysOverdue} {t("daysOverdue")}</span>
                  </div>
                </div>

                <div className="priority-reason-box">
                  <p>{summary.priority.explanation[lang]}</p>
                </div>

                <div className="priority-reliability-row">
                  <span className="muted small">{t("reliabilityRating")}:</span>
                  {renderStars(summary.reliability.stars, summary.reliability.isInsufficientHistory)}
                </div>

                <div className="priority-card-actions">
                  {summary.customer.phone ? (
                    <a
                      href={`tel:${summary.customer.phone}`}
                      className="button primary call-action-btn"
                      aria-label={`${t("callCustomer")} ${summary.customer.name}`}
                    >
                      <Phone size={14} />
                      {t("callCustomer")}
                    </a>
                  ) : (
                    <Button disabled className="button ghost call-action-btn">
                      {t("noPhoneAvailable")}
                    </Button>
                  )}

                  <div className="priority-secondary-actions">
                    <Button variant="secondary" onClick={() => handleOpenWhatsAppModal(summary)}>
                      <MessageCircle size={14} />
                      WhatsApp
                    </Button>

                    <Button variant="secondary" onClick={() => setPromiseModalCustomer(summary)}>
                      <Calendar size={14} />
                      {t("recordPromise")}
                    </Button>

                    <Button variant="ghost" onClick={() => setSelectedCustomerId(summary.customer.id)}>
                      <ChevronRight size={14} />
                      {t("viewRecord")}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Receivables Ledger */}
      <section className="receivables-ledger-section" aria-label={t("receivablesLedger")}>
        <div className="ledger-header-row">
          <div>
            <h2>{t("receivablesLedger")}</h2>
            <p className="muted small">{t("customersSubtitle")}</p>
          </div>
          <div className="ledger-stats-pill">
            {filteredLedger.length} {t("customers")}
          </div>
        </div>

        <Card className="ledger-card">
          <div className="table-toolbar flex-wrap">
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("customerSearch")}
            />

            <div className="filters">
              <label className="filter-select-wrap">
                <span className="sr-only">{t("sortBy")}</span>
                <select
                  aria-label={t("sortBy")}
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                >
                  <option value="priorityDesc">{t("sortPriorityDesc")}</option>
                  <option value="outstandingDesc">{t("sortOutstandingDesc")}</option>
                  <option value="overdueDesc">{t("sortOverdueDesc")}</option>
                  <option value="reliabilityDesc">{t("sortReliabilityDesc")}</option>
                  <option value="lastPaymentDesc">{t("sortLastPaymentDesc")}</option>
                </select>
              </label>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="ledger-filter-chips" role="tablist" aria-label="Filters">
            {[
              { id: "all", label: t("allReceivables") },
              { id: "overdue", label: t("filterOverdue") },
              { id: "dueToday", label: t("filterDueToday") },
              { id: "due7Days", label: t("filterDue7Days") },
              { id: "highExposure", label: t("filterHighExposure") },
              { id: "urgentPriority", label: t("filterUrgentPriority") },
              { id: "missedPromises", label: t("filterMissedPromises") },
              { id: "lowReliability", label: t("filterLowReliability") },
              { id: "insufficientHistory", label: t("filterInsufficientHistory") },
              { id: "settled", label: t("filterSettled") },
            ].map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={activeFilter === f.id}
                className={`filter-chip ${activeFilter === f.id ? "active" : ""}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table / Cards */}
          {filteredLedger.length ? (
            <>
              {/* Desktop View */}
              <div className="ledger-table-desktop">
                <DataTable
                  headers={[
                    t("customer"),
                    t("outstanding"),
                    t("overdue"),
                    t("unpaidInvoices"),
                    t("oldestBill"),
                    t("onTimeRate"),
                    t("priorityScore"),
                    t("reliabilityRating"),
                    t("nextAction"),
                  ]}
                >
                  {filteredLedger.map((s) => (
                    <tr key={s.customer.id}>
                      <td>
                        <button
                          className="person-cell"
                          onClick={() => setSelectedCustomerId(s.customer.id)}
                        >
                          <span className={`avatar square tint-${s.customer.id.slice(-1)}`}>
                            {initials(s.customer.name)}
                          </span>
                          <span>
                            <strong>{s.customer.name}</strong>
                            <small>
                              {s.customer.contact} · {s.customer.phone}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td className="numeric font-semibold">
                        {money(s.totalOutstanding)}
                      </td>
                      <td className={`numeric ${s.overdueBalance > 0 ? "danger-text font-semibold" : "muted"}`}>
                        {money(s.overdueBalance)}
                      </td>
                      <td className="numeric muted">
                        {s.unpaidInvoicesCount}
                      </td>
                      <td className="nowrap">
                        {s.oldestUnpaidInvoice ? (
                          <button
                            className="record-link mono small"
                            onClick={() => open({ kind: "invoice", id: s.oldestUnpaidInvoice!.id })}
                          >
                            {s.oldestUnpaidInvoice.id}
                            <span className="block muted">
                              {s.daysOverdue > 0 ? `${s.daysOverdue} ${t("daysOverdue")}` : date(s.oldestUnpaidInvoice.dueDate, lang)}
                            </span>
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="numeric">
                        {s.reliability.isInsufficientHistory ? (
                          <span className="muted">—</span>
                        ) : (
                          <span>{s.reliability.onTimePaymentRate}%</span>
                        )}
                      </td>
                      <td>
                        {renderPriorityBadge(s.priority.band, s.priority.score)}
                      </td>
                      <td className="nowrap">
                        {renderStars(s.reliability.stars, s.reliability.isInsufficientHistory)}
                      </td>
                      <td>
                        <div className="ledger-row-actions">
                          {s.customer.phone && (
                            <a
                              href={`tel:${s.customer.phone}`}
                              className="icon-action-btn"
                              title={t("callCustomer")}
                            >
                              <Phone size={14} />
                            </a>
                          )}
                          <button
                            className="icon-action-btn"
                            title="WhatsApp"
                            onClick={() => handleOpenWhatsAppModal(s)}
                          >
                            <MessageCircle size={14} />
                          </button>
                          <button
                            className="icon-action-btn"
                            title={t("recordPromise")}
                            onClick={() => setPromiseModalCustomer(s)}
                          >
                            <Calendar size={14} />
                          </button>
                          <button
                            className="icon-action-btn"
                            title={t("viewRecord")}
                            onClick={() => setSelectedCustomerId(s.customer.id)}
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>

              {/* Mobile Cards View */}
              <div className="ledger-cards-mobile">
                {filteredLedger.map((s) => (
                  <div key={s.customer.id} className="mobile-ledger-card">
                    <div className="mobile-card-header">
                      <div>
                        <h4>{s.customer.name}</h4>
                        <span className="small muted">
                          {s.customer.contact} · {s.customer.city}
                        </span>
                      </div>
                      {renderPriorityBadge(s.priority.band, s.priority.score)}
                    </div>

                    <div className="mobile-card-metrics">
                      <div>
                        <span className="small muted">{t("outstanding")}</span>
                        <strong>{money(s.totalOutstanding)}</strong>
                      </div>
                      <div>
                        <span className="small muted">{t("overdue")}</span>
                        <strong className={s.overdueBalance > 0 ? "danger-text" : "muted"}>
                          {money(s.overdueBalance)}
                        </strong>
                      </div>
                      <div>
                        <span className="small muted">{t("reliabilityRating")}</span>
                        {renderStars(s.reliability.stars, s.reliability.isInsufficientHistory)}
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      {s.customer.phone && (
                        <a href={`tel:${s.customer.phone}`} className="button secondary">
                          <Phone size={13} />
                          Call
                        </a>
                      )}
                      <Button variant="secondary" onClick={() => handleOpenWhatsAppModal(s)}>
                        <MessageCircle size={13} />
                        WhatsApp
                      </Button>
                      <Button variant="ghost" onClick={() => setSelectedCustomerId(s.customer.id)}>
                        <ArrowUpRight size={13} />
                        {t("viewRecord")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title={t("noResults")} description={t("trySearch")}>
              <Button onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}>
                {t("clearFilters")}
              </Button>
            </EmptyState>
          )}
        </Card>
      </section>

      {/* 5. Customer Profile Drawer */}
      {selectedCustomerSummary && (
        <Drawer
          title={selectedCustomerSummary.customer.name}
          onClose={() => setSelectedCustomerId(null)}
          wide
        >
          <div className="customer-profile-drawer">
            {/* Header info */}
            <div className="profile-header-strip">
              <div>
                <h2>{selectedCustomerSummary.customer.name}</h2>
                <p className="muted">
                  {selectedCustomerSummary.customer.contact} · {selectedCustomerSummary.customer.city} · {selectedCustomerSummary.customer.phone}
                </p>
              </div>
              <div className="header-badges">
                {renderPriorityBadge(selectedCustomerSummary.priority.band, selectedCustomerSummary.priority.score)}
                {renderStars(selectedCustomerSummary.reliability.stars, selectedCustomerSummary.reliability.isInsufficientHistory)}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="profile-action-bar">
              {selectedCustomerSummary.customer.phone && (
                <a
                  href={`tel:${selectedCustomerSummary.customer.phone}`}
                  className="button primary"
                >
                  <Phone size={14} />
                  {t("callCustomer")}
                </a>
              )}
              <Button variant="secondary" onClick={() => handleOpenWhatsAppModal(selectedCustomerSummary)}>
                <MessageCircle size={14} />
                WhatsApp
              </Button>
              <Button variant="secondary" onClick={() => setPromiseModalCustomer(selectedCustomerSummary)}>
                <Calendar size={14} />
                {t("recordPromise")}
              </Button>
              <Button variant="secondary" onClick={() => setFollowupModalCustomer(selectedCustomerSummary)}>
                <History size={14} />
                {t("trackFollowup")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCustomerId(null);
                  open({ kind: "recordPayment", invoiceId: selectedCustomerSummary.oldestUnpaidInvoice?.id });
                }}
              >
                <CreditCard size={14} />
                {t("recordPayment")}
              </Button>
            </div>

            {/* 1. Financial Overview */}
            <section className="profile-section">
              <h3>{t("financialOverview")}</h3>
              <div className="metrics-strip four">
                <MetricCard
                  label={t("outstanding")}
                  value={money(selectedCustomerSummary.totalOutstanding)}
                  detail={`${selectedCustomerSummary.unpaidInvoicesCount} ${t("unpaidInvoices")}`}
                />
                <MetricCard
                  label={t("totalOverdue")}
                  value={<span className="danger-text">{money(selectedCustomerSummary.overdueBalance)}</span>}
                  detail={selectedCustomerSummary.daysOverdue > 0 ? `${selectedCustomerSummary.daysOverdue} ${t("daysOverdue")}` : "On track"}
                />
                <MetricCard
                  label={t("notYetDue")}
                  value={money(selectedCustomerSummary.upcomingBalance)}
                />
                <MetricCard
                  label={t("lastPayment")}
                  value={selectedCustomerSummary.lastPayment ? money(selectedCustomerSummary.lastPayment.amount) : "—"}
                  detail={selectedCustomerSummary.lastPayment ? date(selectedCustomerSummary.lastPayment.date, lang) : "No payments"}
                />
              </div>
            </section>

            {/* 2. Collection Priority Explanation */}
            <section className="profile-section">
              <h3>{t("priorityExplanation")}</h3>
              <div className="score-explanation-box">
                <p><strong>{selectedCustomerSummary.priority.explanation[lang]}</strong></p>
                <div className="factors-grid">
                  <div className="factor-item">
                    <span>{t("dueDate")} / Overdue (35%)</span>
                    <strong>{selectedCustomerSummary.priority.overdueScore}/100</strong>
                    <small>{selectedCustomerSummary.daysOverdue} {t("daysOverdue")}</small>
                  </div>
                  <div className="factor-item">
                    <span>{t("exposureScore")} (30%)</span>
                    <strong>{selectedCustomerSummary.priority.exposureScore}/100</strong>
                    <small>{money(selectedCustomerSummary.totalOutstanding)}</small>
                  </div>
                  <div className="factor-item">
                    <span>{t("promiseScore")} (20%)</span>
                    <strong>{selectedCustomerSummary.priority.promiseScore}/100</strong>
                    <small>{selectedCustomerSummary.priority.missedPromisesCount} {t("promiseMissed")}</small>
                  </div>
                  <div className="factor-item">
                    <span>{t("trendScore")} (15%)</span>
                    <strong>{selectedCustomerSummary.priority.riskTrendScore}/100</strong>
                    <small>{selectedCustomerSummary.unpaidInvoicesCount} bills</small>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Reliability Analysis */}
            <section className="profile-section">
              <h3>{t("reliabilityAnalysis")}</h3>
              <div className="reliability-analysis-card">
                <div className="d-flex items-center justify-between mb-2">
                  <div className="d-flex items-center gap-2">
                    {renderStars(selectedCustomerSummary.reliability.stars, selectedCustomerSummary.reliability.isInsufficientHistory)}
                    {!selectedCustomerSummary.reliability.isInsufficientHistory && (
                      <span className="font-bold">{selectedCustomerSummary.reliability.score}/100</span>
                    )}
                  </div>
                  <span className="small muted">{selectedCustomerSummary.reliability.evaluationPeriod}</span>
                </div>
                <p className="small muted mb-3">{selectedCustomerSummary.reliability.explanation[lang]}</p>

                <div className="factors-grid">
                  <div className="factor-item">
                    <span>{t("onTimeRate")} (40%)</span>
                    <strong>{selectedCustomerSummary.reliability.onTimePaymentRate}%</strong>
                    <small>Amount-weighted: {selectedCustomerSummary.reliability.amountWeightedOnTimeRate}%</small>
                  </div>
                  <div className="factor-item">
                    <span>Average Delay (25%)</span>
                    <strong>{selectedCustomerSummary.reliability.averageDelayDays} days</strong>
                  </div>
                  <div className="factor-item">
                    <span>Promises Honored (20%)</span>
                    <strong>{selectedCustomerSummary.reliability.promiseScore}/100</strong>
                    <small>{selectedCustomerSummary.reliability.brokenPromisesCount} missed</small>
                  </div>
                  <div className="factor-item">
                    <span>Payment Consistency (15%)</span>
                    <strong>{selectedCustomerSummary.reliability.consistencyScore}/100</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Repayment Timeline & Invoice History */}
            <section className="profile-section">
              <h3>{t("repaymentTimeline")}</h3>
              <div className="timeline-invoices-list">
                {selectedCustomerSummary.invoices.map((inv) => {
                  const invPayments = selectedCustomerSummary.payments.filter((p) => p.invoiceId === inv.id);
                  const paid = invPayments.reduce((s, p) => s + p.amount, 0);
                  const remaining = inv.total - paid;
                  const isOverdue = remaining > 0 && inv.dueDate < DEMO_DATE;

                  return (
                    <div key={inv.id} className="timeline-invoice-card">
                      <div className="invoice-row-header">
                        <div>
                          <button
                            className="record-link mono font-semibold"
                            onClick={() => open({ kind: "invoice", id: inv.id })}
                          >
                            {inv.id}
                            <ArrowUpRight size={12} />
                          </button>
                          <small className="muted block">
                            {t("date")}: {date(inv.date, lang)} · {t("dueDate")}: {date(inv.dueDate, lang)}
                          </small>
                        </div>
                        <div className="text-right">
                          <strong>{money(inv.total)}</strong>
                          <span className={`block small ${isOverdue ? "danger-text font-bold" : "muted"}`}>
                            {remaining === 0 ? t("paid") : `${money(remaining)} due (${isOverdue ? `${daysBetween(inv.dueDate, DEMO_DATE)} days late` : "pending"})`}
                          </span>
                        </div>
                      </div>

                      {invPayments.length > 0 && (
                        <div className="invoice-payments-inline">
                          <span className="small muted">{t("paymentHistory")}:</span>
                          {invPayments.map((p) => (
                            <div key={p.id} className="payment-chip-row">
                              <span>{p.id} · {date(p.date, lang)} via {p.method.toUpperCase()}</span>
                              <strong>{money(p.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Payment Promises History */}
            {selectedCustomerSummary.promises.length > 0 && (
              <section className="profile-section">
                <h3>{t("recordPromise")} History</h3>
                <div className="promises-list">
                  {selectedCustomerSummary.promises.map((p) => (
                    <div key={p.id} className="promise-record-card">
                      <div className="d-flex justify-between items-center">
                        <div>
                          <strong>{money(p.expectedAmount)}</strong> by {date(p.expectedDate, lang)}
                          {p.note && <p className="small muted">{p.note}</p>}
                        </div>
                        <Badge status={p.status === "fulfilled" ? "paid" : p.status === "missed" ? "overdue" : "pending"} />
                      </div>
                      {p.status === "pending" && (
                        <div className="d-flex gap-2 mt-2">
                          <Button variant="ghost" onClick={() => updatePromiseStatus(p.id, "fulfilled")}>
                            Mark Fulfilled
                          </Button>
                          <Button variant="ghost" onClick={() => updatePromiseStatus(p.id, "missed")}>
                            Mark Missed
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Collection Follow-ups History */}
            {selectedCustomerSummary.followups.length > 0 && (
              <section className="profile-section">
                <h3>Follow-up Log</h3>
                <div className="followups-list">
                  {selectedCustomerSummary.followups.map((f) => (
                    <div key={f.id} className="followup-record-card">
                      <div className="d-flex justify-between">
                        <strong>{f.channel.toUpperCase()} · {f.status}</strong>
                        <small className="muted">{date(f.createdAt, lang)}</small>
                      </div>
                      {f.contactNotes && <p className="small muted mt-1">{f.contactNotes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </Drawer>
      )}

      {/* 6. WhatsApp Reminder Modal */}
      {whatsappModalCustomer && (
        <Drawer
          title={t("whatsappDraft")}
          onClose={() => setWhatsappModalCustomer(null)}
        >
          <div className="whatsapp-modal-body">
            <div className="modal-customer-info">
              <div>
                <strong>{whatsappModalCustomer.customer.name}</strong>
                <span className="block small muted">{whatsappModalCustomer.customer.phone}</span>
              </div>
              <strong className="danger-text">{money(whatsappModalCustomer.totalOutstanding)}</strong>
            </div>

            <div className="draft-language-selector">
              <span className="small muted">{t("language")}:</span>
              {(["en", "hi", "hinglish"] as const).map((l) => (
                <button
                  key={l}
                  className={`language-pill ${draftLanguage === l ? "active" : ""}`}
                  onClick={() => handleLanguageChangeDraft(l)}
                >
                  {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "Hinglish"}
                </button>
              ))}
            </div>

            <div className="textarea-wrap">
              <textarea
                rows={5}
                value={customDraftText}
                onChange={(e) => setCustomDraftText(e.target.value)}
                className="whatsapp-editor"
                aria-label={t("whatsappDraft")}
              />
            </div>

            <p className="small muted">
              Notice: Opening WhatsApp will launch your messaging app with this draft. No automated messages are dispatched without your explicit action.
            </p>

            <div className="d-flex gap-2 mt-4">
              <Button variant="primary" onClick={handleOpenWhatsAppExternal}>
                <ExternalLink size={14} />
                {t("openInWhatsApp")}
              </Button>
              <Button variant="secondary" onClick={handleCopyDraft}>
                <Copy size={14} />
                {copyFeedback ? t("copiedToClipboard") : t("copyReminder")}
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* 7. Record Payment Promise Modal */}
      {promiseModalCustomer && (
        <Drawer
          title={t("recordPromise")}
          onClose={() => setPromiseModalCustomer(null)}
        >
          <form onSubmit={handleSavePromise} className="action-form">
            <div className="modal-customer-info mb-3">
              <div>
                <strong>{promiseModalCustomer.customer.name}</strong>
                <span className="block small muted">{t("outstanding")}: {money(promiseModalCustomer.totalOutstanding)}</span>
              </div>
            </div>

            <label className="form-group">
              <span>{t("expectedDate")} *</span>
              <input
                type="date"
                required
                value={promiseDate}
                onChange={(e) => setPromiseDate(e.target.value)}
              />
            </label>

            <label className="form-group">
              <span>{t("expectedAmount")} *</span>
              <input
                type="number"
                required
                min={1}
                max={promiseModalCustomer.totalOutstanding}
                value={promiseAmount}
                onChange={(e) => setPromiseAmount(Number(e.target.value))}
              />
            </label>

            <label className="form-group">
              <span>{t("customerResponse")}</span>
              <textarea
                rows={2}
                placeholder="e.g., Promised to transfer via UPI on Monday after stock delivery"
                value={promiseResponse}
                onChange={(e) => setPromiseResponse(e.target.value)}
              />
            </label>

            <label className="form-group">
              <span>{t("note")}</span>
              <input
                type="text"
                placeholder="Additional notes"
                value={promiseNote}
                onChange={(e) => setPromiseNote(e.target.value)}
              />
            </label>

            <div className="button-row mt-4">
              <Button type="button" onClick={() => setPromiseModalCustomer(null)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="primary">
                {t("save")}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* 8. Record Follow-up Modal */}
      {followupModalCustomer && (
        <Drawer
          title={t("trackFollowup")}
          onClose={() => setFollowupModalCustomer(null)}
        >
          <form onSubmit={handleSaveFollowup} className="action-form">
            <div className="modal-customer-info mb-3">
              <div>
                <strong>{followupModalCustomer.customer.name}</strong>
                <span className="block small muted">{followupModalCustomer.customer.phone}</span>
              </div>
            </div>

            <label className="form-group">
              <span>{t("followupChannel")}</span>
              <select
                value={followupChannel}
                onChange={(e) => setFollowupChannel(e.target.value as CollectionFollowup["channel"])}
              >
                <option value="call">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">In-Person Store Visit</option>
                <option value="in_app">App Note</option>
              </select>
            </label>

            <label className="form-group">
              <span>{t("followupStatus")}</span>
              <select
                value={followupStatus}
                onChange={(e) => setFollowupStatus(e.target.value as CollectionFollowup["status"])}
              >
                <option value="contacted">Customer Contacted</option>
                <option value="attempted">Attempted / Ringing</option>
                <option value="no_response">No Response / Switched Off</option>
                <option value="scheduled">Scheduled Follow-up</option>
                <option value="completed">Resolved / Completed</option>
              </select>
            </label>

            <label className="form-group">
              <span>{t("scheduledDate")}</span>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
              />
            </label>

            <label className="form-group">
              <span>{t("contactNotes")}</span>
              <textarea
                rows={3}
                placeholder="Summary of customer conversation"
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
              />
            </label>

            <div className="button-row mt-4">
              <Button type="button" onClick={() => setFollowupModalCustomer(null)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="primary">
                {t("save")}
              </Button>
            </div>
          </form>
        </Drawer>
      )}
    </div>
  );
}
