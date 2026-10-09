import { customers, invoices, payments } from "./seed";
import { outstanding } from "./invoices";
export async function getCustomers() { return customers; }
export function customerSummary(id: string) { const history=invoices.filter(i=>i.customerId===id);return {invoices:history,payments:payments.filter(p=>p.customerId===id),purchases:history.reduce((s,x)=>s+x.total,0),outstanding:history.reduce((s,x)=>s+outstanding(x),0),lastPurchase:history.map(x=>x.date).sort().at(-1)}; }
