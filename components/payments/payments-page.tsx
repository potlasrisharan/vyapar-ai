"use client";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleDollarSign, Landmark, QrCode, Wallet, Plus } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Badge, Button, Card, DataTable, EmptyState, MetricCard, PageHeading, SearchField } from "@/components/ui";
import { date, money } from "@/lib/utils/format";

export function PaymentsPage() {
  const { data, t, lang, open } = useApp();
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<string>("all");

  if (!data) return null;

  const payments = data.payments.filter(p => {
    const customer = data.customers.find(c => c.id === p.customerId)?.name || "";
    const matchesQuery =
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.invoiceId.toLowerCase().includes(query.toLowerCase()) ||
      customer.toLowerCase().includes(query.toLowerCase());
    const matchesMethod = method === "all" || p.method === method;
    return matchesQuery && matchesMethod;
  });

  const totalCollected = data.payments.reduce((s, p) => s + p.amount, 0);
  const upiTotal = data.payments.filter(p => p.method === "upi").reduce((s, p) => s + p.amount, 0);
  const bankTotal = data.payments.filter(p => p.method === "bank").reduce((s, p) => s + p.amount, 0);
  const cashTotal = data.payments.filter(p => p.method === "cash").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeading
        title={t("payments")}
        subtitle={t("paymentsSubtitle")}
      >
        <Button variant="primary" onClick={()=>open({kind:"recordPayment"})}>
          <Plus size={16}/> {t("recordPayment")}
        </Button>
      </PageHeading>

      <div className="metrics-strip four">
        <MetricCard
          label={t("totalCollected")}
          value={money(totalCollected)}
          detail={`${data.payments.length} ${t("transactions")}`}
          icon={CircleDollarSign}
        />
        <MetricCard
          label={t("upi")}
          value={money(upiTotal)}
          detail={`${data.payments.filter(p => p.method === "upi").length} ${t("receipts")}`}
          icon={QrCode}
        />
        <MetricCard
          label={t("bankTransfer")}
          value={money(bankTotal)}
          detail={`${data.payments.filter(p => p.method === "bank").length} ${t("receipts")}`}
          icon={Landmark}
        />
        <MetricCard
          label={t("cash")}
          value={money(cashTotal)}
          detail={`${data.payments.filter(p => p.method === "cash").length} ${t("receipts")}`}
          icon={Wallet}
        />
      </div>

      <div className="inline-notice">
        <CheckCircle2 size={18} />
        <p>{t("paymentsReconciled")}</p>
        <button
          onClick={() => open({ kind: "invoice", id: "INV-1023" })}
          aria-label={t("viewRecord")}
        >
          <ArrowUpRight size={18} />
        </button>
      </div>

      <Card>
        <div className="table-toolbar">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={t("searchPayments")}
          />
          <div className="filters">
            <select
              aria-label={t("method")}
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              <option value="all">{t("allMethods")}</option>
              <option value="upi">{t("upi")}</option>
              <option value="bank">{t("bankTransfer")}</option>
              <option value="cash">{t("cash")}</option>
            </select>
          </div>
        </div>

        {payments.length ? (
          <DataTable
            headers={[
              t("paymentId"),
              t("invoice"),
              t("customer"),
              t("date"),
              t("method"),
              t("amount"),
            ]}
          >
            {payments.map(p => {
              const customer = data.customers.find(c => c.id === p.customerId);
              return (
                <tr key={p.id}>
                  <td className="mono muted">{p.id}</td>
                  <td>
                    <button
                      className="record-link mono"
                      onClick={() => open({ kind: "invoice", id: p.invoiceId })}
                    >
                      {p.invoiceId}
                    </button>
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => open({ kind: "customer", id: p.customerId })}
                    >
                      {customer?.name}
                    </button>
                  </td>
                  <td className="muted nowrap">{date(p.date, lang)}</td>
                  <td>
                    <Badge status="completed">
                      {p.method.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="numeric font-medium">{money(p.amount)}</td>
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <EmptyState
            title={t("noResults")}
            description={t("trySearch")}
          >
            <Button onClick={() => { setQuery(""); setMethod("all"); }}>
              {t("clearFilters")}
            </Button>
          </EmptyState>
        )}
      </Card>
    </>
  );
}
