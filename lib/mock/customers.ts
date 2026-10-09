import { customers, invoices, payments } from "./seed";
import { outstanding } from "./invoices";
import type { Invoice, Payment } from "@/lib/types";
export async function getCustomers() { return customers; }
export function customerSummary(id: string, d?: { invoices: Invoice[]; payments: Payment[] }) {
  const invList = d?.invoices ?? invoices;
  const payList = d?.payments ?? payments;
  const history = invList.filter(i => i.customerId === id);
  return {
    invoices: history,
    payments: payList.filter(p => p.customerId === id),
    purchases: history.reduce((s, x) => s + x.total, 0),
    outstanding: history.reduce((s, x) => s + outstanding(x, payList), 0),
    lastPurchase: history.map(x => x.date).sort().at(-1)
  };
}
