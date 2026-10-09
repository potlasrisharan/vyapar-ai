import type { Invoice, Payment } from "@/lib/types";
import { invoices, payments } from "./seed";
import { DEMO_DATE } from "@/lib/utils/format";
export function paidAmount(invoice: Invoice, records: Payment[] = payments) { return records.filter(p=>p.invoiceId===invoice.id).reduce((s,p)=>s+p.amount,0); }
export function outstanding(invoice: Invoice, records: Payment[] = payments) { return invoice.total-paidAmount(invoice,records); }
export function invoiceStatus(invoice: Invoice) { if(outstanding(invoice)===0)return "paid";if(invoice.dueDate<DEMO_DATE)return "overdue";if(paidAmount(invoice)>0)return "partial";return "pending"; }
export async function getInvoices() { return invoices; }
