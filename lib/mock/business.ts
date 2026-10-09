import type { BusinessData, BusinessService } from "@/lib/types";
import { customers, vendors, products, invoices, payments, expenses, purchaseBills, documents } from "./seed";
import { evidence, insights } from "./insights";
import { sleep } from "@/lib/utils/format";
export const data: BusinessData={business:{id:"BIZ-1",name:"Sharma Electronics",owner:"Rajesh Sharma",city:"Kanpur",state:"Uttar Pradesh",type:"Electronics Retailer",demoDate:"2026-10-05",reportingMonth:"2026-09"},customers,vendors,products,invoices,payments,expenses,purchaseBills,documents,evidence,insights};
export const monthlyHistory=[{month:"apr",revenue:338000,expenses:168000},{month:"may",revenue:372000,expenses:179000},{month:"jun",revenue:354000,expenses:181000},{month:"jul",revenue:398000,expenses:192000},{month:"aug",revenue:429000,expenses:202378},{month:"sep",revenue:482000,expenses:213000}];
export const businessService: BusinessService = { async load(){await sleep(350);return data;} };
export function businessTotals(d:BusinessData){const revenue=d.invoices.reduce((s,i)=>s+i.total,0);const paid=d.payments.reduce((s,p)=>s+p.amount,0);const expenses=d.expenses.reduce((s,e)=>s+e.amount,0);return {revenue,paid,outstanding:revenue-paid,expenses,net:revenue-expenses,lowStock:d.products.filter(p=>p.stock<=p.reorderLevel).length};}

export interface VendorRating {
  stars: number;
  score: number;
  band: "tier_a" | "reliable" | "good" | "needs_attention";
  badge: { en: string; hi: string; hinglish: string };
  billsCount: number;
  totalPurchases: number;
  paidAmount: number;
  outstanding: number;
  settlementRate: number;
  productsCount: number;
  leadTimeDays: number;
}

export function calculateVendorRating(vendorId: string, d: BusinessData): VendorRating {
  const bills = d.purchaseBills.filter(b => b.vendorId === vendorId);
  const totalPurchases = bills.reduce((s, b) => s + b.total, 0);
  const paidAmount = bills.reduce((s, b) => s + b.paid, 0);
  const outstanding = Math.max(0, totalPurchases - paidAmount);
  const settlementRate = totalPurchases > 0 ? Math.round((paidAmount / totalPurchases) * 100) : 100;
  const vendorProducts = d.products.filter(p => p.vendorId === vendorId);
  const inStockCount = vendorProducts.filter(p => p.stock > p.reorderLevel).length;
  const stockHealthRate = vendorProducts.length > 0 ? inStockCount / vendorProducts.length : 1;
  const score = Math.round(settlementRate * 0.6 + stockHealthRate * 100 * 0.4);
  const stars = Math.max(3.2, Math.min(5.0, Number((3.0 + (score / 100) * 2.0).toFixed(1))));
  const band = stars >= 4.7 ? "tier_a" : stars >= 4.3 ? "reliable" : stars >= 3.8 ? "good" : "needs_attention";
  const badge = {
    tier_a: { en: "Tier A · Excellent", hi: "अग्रणी सप्लायर", hinglish: "Tier A · Best" },
    reliable: { en: "Reliable Partner", hi: "विश्वसनीय सप्लायर", hinglish: "Reliable Partner" },
    good: { en: "Good Standing", hi: "सामान्य स्थिति", hinglish: "Good Standing" },
    needs_attention: { en: "Needs Review", hi: "समीक्षा ज़रूरी", hinglish: "Review Zaroori" }
  }[band];
  return {
    stars,
    score,
    band,
    badge,
    billsCount: bills.length,
    totalPurchases,
    paidAmount,
    outstanding,
    settlementRate,
    productsCount: vendorProducts.length,
    leadTimeDays: 2
  };
}
