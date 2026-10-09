import type { BusinessData, BusinessService } from "@/lib/types";
import { customers, vendors, products, invoices, payments, expenses, purchaseBills, documents } from "./seed";
import { evidence, insights } from "./insights";
import { sleep } from "@/lib/utils/format";
export const data: BusinessData={business:{id:"BIZ-1",name:"Sharma Electronics",owner:"Rajesh Sharma",city:"Kanpur",state:"Uttar Pradesh",type:"Electronics Retailer",demoDate:"2026-10-05",reportingMonth:"2026-09"},customers,vendors,products,invoices,payments,expenses,purchaseBills,documents,evidence,insights};
export const monthlyHistory=[{month:"apr",revenue:338000,expenses:168000},{month:"may",revenue:372000,expenses:179000},{month:"jun",revenue:354000,expenses:181000},{month:"jul",revenue:398000,expenses:192000},{month:"aug",revenue:429000,expenses:202378},{month:"sep",revenue:482000,expenses:213000}];
export const businessService: BusinessService = { async load(){await sleep(350);return data;} };
export function businessTotals(d:BusinessData){const revenue=d.invoices.reduce((s,i)=>s+i.total,0);const paid=d.payments.reduce((s,p)=>s+p.amount,0);const expenses=d.expenses.reduce((s,e)=>s+e.amount,0);return {revenue,paid,outstanding:revenue-paid,expenses,net:revenue-expenses,lowStock:d.products.filter(p=>p.stock<=p.reorderLevel).length};}
