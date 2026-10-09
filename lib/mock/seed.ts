import type { BusinessData, Customer, Expense, Invoice, Product, Vendor } from "@/lib/types";
const names = ["ABC Traders", "Gupta Enterprises", "Verma Solutions", "Kanpur Digital", "Singh & Sons", "Ananya Retail", "City Computers", "Rohan Mehta", "Aarav Technologies", "New Era School", "Aditi Sharma", "Kumar Office Supplies", "Patel Stores", "Greenfield Academy", "Ravi Electronics"];
export const customers: Customer[] = names.map((name, i) => ({ id: `CUS-${1001+i}`, name, contact: ["Amit", "Rajesh", "Neha", "Priya", "Sanjay"][i%5]+" "+["Sharma", "Gupta", "Verma"][i%3], phone: `+91 9${String(870010000+i*173).slice(0,9)}`, city: ["Kanpur", "Lucknow", "Unnao"][i%3] }));
const vendorNames = ["Techline Distributors", "North India Electronics", "UP Power Corporation", "Sharma Properties", "Kanpur Logistics", "Digital Reach Studio", "Prime Accessories", "Soundwave Wholesale", "Reliable Appliances", "Office Essentials"];
export const vendors: Vendor[] = vendorNames.map((name,i)=>({ id:`VEN-${i+1}`, name, category:["electronics","electronics","electricity","rent","transport","marketing","accessories","audio","appliances","other"][i], city:i%2 ? "Lucknow" : "Kanpur" }));
const catalog: [string,string,number][] = [
  ["Dell 24-inch Monitor","computers",10000],["Logitech K120 Keyboard","accessories",1000],["boAt Stone 350 Speaker","audio",2000],["Samsung 43-inch Smart TV","appliances",35000],["TP-Link Archer C6 Router","networking",3500],
  ["HP Wireless Mouse","accessories",800],["SanDisk 64GB USB Drive","storage",650],["JBL Go 3 Speaker","audio",3000],["boAt Airdopes 141","audio",1400],["Mi Power Bank 10000mAh","accessories",1800],
  ["Canon PIXMA Printer","computers",6500],["Samsung 500GB SSD","storage",4500],["Zebronics Webcam","computers",1600],["Belkin USB-C Hub","accessories",2800],["Realme Buds Wireless","audio",1900],
  ["Philips LED Bulb Pack","appliances",600],["Havells Extension Board","accessories",850],["Portronics Laptop Stand","accessories",1200],["Lenovo Laptop Charger","computers",2200],["Sony Wired Headphones","audio",1500],
  ["D-Link Ethernet Cable","networking",350],["Samsung 25W Charger","accessories",1100],["Apple USB-C Cable","accessories",1900],["WD 1TB External Drive","storage",5200],["Epson Ink Bottle Set","computers",2400],
  ["TP-Link Wi-Fi Adapter","networking",900],["Logitech C270 Webcam","computers",2500],["Ambrane Power Bank","accessories",1300],["Wipro LED Desk Lamp","appliances",1600],["HP 64GB Memory Card","storage",700]
];
export const products: Product[] = catalog.map(([name,category,price],i)=>({id:`PRD-${i+1}`,name,category,price,sku:`SE-${category.slice(0,3).toUpperCase()}-${String(i+1).padStart(3,"0")}`,stock:[8,4,0,12,6][i] ?? 22+(i*7)%52,reorderLevel:i<5?15:10,dailySales:i===0?1.6:Number((0.3+(i%5)*0.25).toFixed(2)),vendorId:`VEN-${[1,2,7,8,9][i%5]}`}));
const invoiceAmounts = Array.from({length:40},(_,i)=>({3:25000,7:22000,14:26000,22:35000,26:18000,30:12000,39:14000}[i] ?? 10000));
export const invoices: Invoice[] = invoiceAmounts.map((total,i)=>{
  const counts: [number,number][] = total===35000 ? [[3,1]] : [[0,Math.floor(total/10000)],[2,Math.floor(total%10000/2000)],[1,Math.floor(total%2000/1000)]];
  const items = counts.filter(([,qty])=>qty>0).map(([idx,quantity])=>{const gross=products[idx].price*quantity;const subtotal=Math.round(gross/1.18*100)/100;return {productId:products[idx].id,quantity,unitPrice:products[idx].price,gross,subtotal,tax:Math.round((gross-subtotal)*100)/100};});
  const subtotal = Math.round(items.reduce((s,x)=>s+x.subtotal,0)*100)/100;
  return {id:`INV-${1001+i}`,customerId:i===22?customers[0].id:customers[1+i%14].id,date:`2026-09-${String(1+Math.floor(i*29/40)).padStart(2,"0")}`,dueDate:({22:"2026-09-23",26:"2026-09-26",30:"2026-09-29",37:"2026-10-10",39:"2026-10-12"}[i] ?? "2026-10-15"),items,subtotal,tax:Math.round((total-subtotal)*100)/100,total};
});
export const payments = invoices.flatMap((invoice,i)=>{
  if([22,26,30,37].includes(i))return [];
  return [{id:`PAY-${2001+i}`,invoiceId:invoice.id,customerId:invoice.customerId,amount:i===39?7000:invoice.total,date:invoice.date,method:(["upi","bank","cash"] as const)[i%3]}];
});
const expenseRecords: [string,string,string,Expense["category"],number,string][] = [
 ["Stock purchase — Techline","स्टॉक खरीद — टेकलाइन","Stock kharid — Techline","inventory",28000,"VEN-1"],["Stock purchase — North India","स्टॉक खरीद — नॉर्थ इंडिया","Stock kharid — North India","inventory",24000,"VEN-2"],["Stock purchase — Prime","स्टॉक खरीद — प्राइम","Stock kharid — Prime","inventory",15000,"VEN-7"],["Stock purchase — Soundwave","स्टॉक खरीद — साउंडवेव","Stock kharid — Soundwave","inventory",13000,"VEN-8"],["Stock purchase — Reliable","स्टॉक खरीद — रिलायबल","Stock kharid — Reliable","inventory",20000,"VEN-9"],
 ["September electricity bill","सितंबर बिजली का बिल","September bijli ka bill","electricity",24500,"VEN-3"],["Store rent","दुकान का किराया","Dukaan ka kiraya","rent",30000,"VEN-4"],["Delivery and transport","डिलीवरी और परिवहन","Delivery aur transport","transport",8000,"VEN-5"],["Team salaries","टीम का वेतन","Team ki salary","salaries",40000,""],["Local advertising","स्थानीय विज्ञापन","Local advertising","marketing",6000,"VEN-6"],["Store maintenance","दुकान का रखरखाव","Dukaan maintenance","other",4500,"VEN-10"]
];
export const expenses: Expense[] = expenseRecords.map(([en,hi,hinglish,category,amount,vendorId],i)=>({id:`EXP-${i+1}`,name:{en,hi,hinglish},category,amount,date:`2026-09-${String(10+i).padStart(2,"0")}`,vendorId:vendorId||undefined,documentId:`DOC-EXP-${i+1}`}));
export const purchaseBills = expenses.filter(x=>x.vendorId).map((x,i)=>({id:`BILL-${301+i}`,vendorId:x.vendorId!,date:x.date,total:x.amount,paid:i===0?18000:i===1?20000:x.amount,expenseId:x.id}));
export const documents: BusinessData["documents"] = [
 ...invoices.slice(18,30).map(x=>({id:`DOC-${x.id}`,name:`${x.id}.pdf`,type:"invoice" as const,format:"PDF" as const,status:"completed" as const,uploaded:x.date,insightIds:x.id==="INV-1023"?["INS-1"]:[],relatedId:x.id})),
 ...expenses.map(x=>({id:x.documentId,name:x.id==="EXP-6"?"Electricity_Bill_September.pdf":`${x.category}_September_${x.id}.pdf`,type:(x.category==="inventory"?"purchase":"expense") as "purchase"|"expense",format:"PDF" as const,status:"completed" as const,uploaded:x.date,insightIds:x.id==="EXP-6"?["INS-3"]:[],relatedId:x.id})),
 {id:"DOC-INVENTORY",name:"Inventory_September.xlsx",type:"inventory",format:"XLSX",status:"completed",uploaded:"2026-09-30",insightIds:["INS-2","INS-4"],relatedId:"PRD-1"},
 {id:"DOC-BANK",name:"Bank_Statement_September.csv",type:"statement",format:"CSV",status:"review",uploaded:"2026-10-01",insightIds:["INS-5"]}
];
