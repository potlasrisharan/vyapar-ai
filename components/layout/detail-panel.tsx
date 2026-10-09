"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, FileText, Package, Plus, Search, Pencil, Trash2, Star, AlertTriangle } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Badge, Button, Card, DataTable, Drawer, EmptyState, FieldPair, SearchField } from "@/components/ui";
import { navItems,routeHref } from "./shell";
import { customerSummary } from "@/lib/mock/customers";
import { calculateVendorRating } from "@/lib/mock/business";
import { invoiceStatus, outstanding, paidAmount } from "@/lib/mock/invoices";
import { stockStatus } from "@/lib/mock/inventory";
import { date,daysBetween,money } from "@/lib/utils/format";
import type { Insight, Business, Customer, Invoice, Product } from "@/lib/types";
export function DetailPanel(){const app=useApp();const {data,panel,close,t,lang,open,local}=app;if(!panel||!data)return null;
 let title=t("evidence");let content:React.ReactNode=null;
 if(panel.kind==="invoice"){
 const invoice=data.invoices.find(i=>i.id===panel.id);if(!invoice)return null;const customer=data.customers.find(c=>c.id===invoice.customerId)!;const status=invoiceStatus(invoice);title=t("invoiceDetails");const insight=data.insights.find(i=>i.targetId===invoice.id)??{...data.insights[0],id:`FOLLOW-${invoice.id}`,targetId:invoice.id,title:{en:`Follow up on ${invoice.id}`,hi:`${invoice.id} पर फॉलो-अप`,hinglish:`${invoice.id} par follow-up`},summary:{en:customer.name,hi:customer.name,hinglish:customer.name},recommendation:{en:`Confirm a payment date with ${customer.name}.`,hi:`${customer.name} से भुगतान की तारीख तय करें।`,hinglish:`${customer.name} se payment date confirm karein.`}};
 content=<><div className="detail-title"><div><span className="eyebrow">{t("invoice")}</span><h2 className="mono">{invoice.id}</h2></div><div style={{display:"flex",gap:8,alignItems:"center"}}><Button variant="secondary" onClick={()=>printTaxInvoice(invoice,customer,data.business,data.products)}><FileText size={14}/>{t("printInvoice")}</Button><Badge status={status}/></div></div><button className="record-link customer-detail-link" onClick={()=>open({kind:"customer",id:customer.id})}>{customer.name}<ArrowUpRight size={14}/></button><div className="field-grid"><FieldPair label={t("date")}>{date(invoice.date,lang)} 2026</FieldPair><FieldPair label={t("dueDate")}>{date(invoice.dueDate,lang)} 2026</FieldPair></div><DataTable headers={[t("items"),t("quantity"),t("amount")]}>{invoice.items.map(item=><tr key={item.productId}><td>{data.products.find(p=>p.id===item.productId)?.name}<small className="block muted">{money(item.unitPrice)} / {t("units")}</small></td><td>{item.quantity}</td><td className="numeric">{money(item.gross)}</td></tr>)}</DataTable><div className="invoice-totals">{([["subtotal",invoice.subtotal],["tax",invoice.tax],["total",invoice.total],["paid",paidAmount(invoice)],["outstanding",outstanding(invoice)]] as const).map(([label,amount])=><div key={label}><span>{t(label)}</span><strong>{label==="subtotal"||label==="tax"?new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(amount):money(amount)}</strong></div>)}</div><p className="small muted">{t("taxNote")}</p><div className="detail-insight"><span className="eyebrow">{t("invoiceInsight")}</span><h3>{status==="paid"?t("invoicePaid"):status==="overdue"?t("unpaidDays",{amount:money(outstanding(invoice)),days:daysBetween(invoice.dueDate)}):t("invoicePending",{date:date(invoice.dueDate,lang)})}</h3>{outstanding(invoice)>0&&<><div style={{display:"flex",gap:8,marginBottom:10}}><Button variant="primary" onClick={()=>open({kind:"recordPayment",invoiceId:invoice.id})}><Plus size={14}/>{t("recordPayment")}</Button></div><p>{insight.recommendation[lang]}</p><ActionForm insight={insight}/><Button variant="ghost" onClick={()=>app.setStatus(insight.id,"handled")}>{app.status(insight.id)==="handled"?t("handled"):t("markHandled")}</Button></>}</div><h3>{t("paymentHistory")}</h3>{data.payments.filter(p=>p.invoiceId===invoice.id).map(p=><div className="list-row" key={p.id}><span>{p.id}<small>{date(p.date,lang)} · {p.method.toUpperCase()}</small></span><strong>{money(p.amount)}</strong></div>)}{paidAmount(invoice)===0&&<p className="muted">{t("noPayments")}</p>}</>;
 }else if(panel.kind==="createInvoice"){
  title=t("createInvoice");content=<CreateInvoiceForm/>;
 }else if(panel.kind==="recordPayment"){
  title=t("recordPayment");content=<RecordPaymentForm preselectedInvoiceId={panel.invoiceId}/>;
 }else if(panel.kind==="createCustomer"){
  title=t("addCustomer");content=<CreateCustomerForm/>;
 }else if(panel.kind==="createProduct"){
  title=t("addProduct");content=<CreateProductForm/>;
 }else if(panel.kind==="evidence"){
 content=<div className="evidence-panel"><span className="eyebrow">{t("linkedEvidence")}</span><p className="muted">{t("sampleData")} · {t("demoDate")}</p>{panel.id.split(",").map(id=>{const e=data.evidence.find(v=>v.id===id);if(!e)return null;const inv=e.type==="invoice"?data.invoices.find(v=>v.id===e.entityId):undefined;const product=e.type==="inventory"?data.products.find(v=>v.id===e.entityId):undefined;const expense=e.type==="expense"?data.expenses.find(v=>v.id===e.entityId):undefined;return <Card key={e.id} className="evidence-record"><div className="evidence-title"><FileText size={20}/><strong>{e.label}</strong></div>{inv&&<><FieldPair label={t("customer")}>{data.customers.find(c=>c.id===inv.customerId)?.name}</FieldPair><FieldPair label={t("amount")}>{money(inv.total)}</FieldPair><FieldPair label={t("dueDate")}>{date(inv.dueDate,lang)} 2026</FieldPair><FieldPair label={t("paid")}>{money(paidAmount(inv))}</FieldPair><Button onClick={()=>open({kind:"invoice",id:inv.id})}>{t("invoiceDetails")}<ArrowUpRight size={14}/></Button></>}{product&&<><FieldPair label={t("product")}>{product.name}</FieldPair><FieldPair label={t("currentStock")}>{product.stock} {t("units")}</FieldPair><FieldPair label={t("reorderLevel")}>{product.reorderLevel}</FieldPair><FieldPair label={t("velocity")}>{product.dailySales} {t("perDay")}</FieldPair><FieldPair label={t("daysCover")}>{Math.floor(product.stock/product.dailySales)}</FieldPair><Button onClick={()=>open({kind:"product",id:product.id})}>{t("productDetails")}<ArrowUpRight size={14}/></Button></>}{expense&&<><FieldPair label={t("thisMonth")}>{money(expense.amount)}</FieldPair><FieldPair label={t("previousMonth")}>{money(19758)}</FieldPair><FieldPair label={t("change")}>+24%</FieldPair><p>{data.insights[2].why[lang]}</p></>}{e.documentId&&<button className="text-link evidence-document" onClick={()=>open({kind:"document",id:e.documentId!})}>{t("documentDetails")}<ArrowUpRight size={14}/></button>}</Card>;})}</div>;
 }else if(panel.kind==="customer"){
 const c=data.customers.find(c=>c.id===panel.id);if(!c)return null;title=t("customerDetails");const s=customerSummary(c.id, data);content=<><h2>{c.name}</h2><p className="muted">{c.city}</p><div className="detail-metrics"><FieldPair label={t("totalPurchases")}>{money(s.purchases)}</FieldPair><FieldPair label={t("outstanding")}>{money(s.outstanding)}</FieldPair></div><FieldPair label={t("contact")}>{c.contact}</FieldPair><FieldPair label={t("phone")}>{c.phone}</FieldPair>{c.id==="CUS-1001"&&<div className="detail-insight">{t("largestOutstanding")}</div>}<h3>{t("purchaseHistory")}</h3>{s.invoices.length?s.invoices.map(i=>{const out=outstanding(i);return <button className="list-row" key={i.id} onClick={()=>open({kind:"invoice",id:i.id})}><span>{i.id}<small>{date(i.date,lang)} · {out>0?`₹${out.toLocaleString("en-IN")} due`:"Paid"}</small></span><span><strong>{money(i.total)}</strong><Badge status={invoiceStatus(i)}/></span><ArrowUpRight size={14}/></button>}):<p>{t("noHistory")}</p>}<h3>{t("paymentHistory")}</h3>{s.payments.length?s.payments.map(p=><div className="list-row" key={p.id}><span>{p.id}<small>{p.invoiceId} · {date(p.date,lang)}</small></span><strong>{money(p.amount)}</strong></div>):<p className="muted">{t("noPayments")}</p>}</>;
 }else if(panel.kind==="vendor"){
 const v=data.vendors.find(v=>v.id===panel.id);if(!v)return null;title=t("vendorDetails");const bills=data.purchaseBills.filter(b=>b.vendorId===v.id);const vRating=calculateVendorRating(v.id,data);content=<><h2>{v.name}</h2><p className="muted">{v.city}</p><div style={{background:"var(--surface-subtle,#f8fafc)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px",margin:"10px 0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6}}><Star size={16} fill="#eab308" color="#eab308"/><strong style={{fontSize:"1.1rem"}}>{vRating.stars.toFixed(1)} / 5.0</strong></div><Badge status="completed">{vRating.badge[lang]}</Badge></div><div className="field-grid" style={{marginBottom:0}}><FieldPair label="Settlement rate">{vRating.settlementRate}%</FieldPair><FieldPair label="Rating score">{vRating.score} / 100</FieldPair><FieldPair label="Products">{vRating.productsCount}</FieldPair></div></div><div className="detail-metrics"><FieldPair label={t("totalPurchases")}>{money(bills.reduce((s,b)=>s+b.total,0))}</FieldPair><FieldPair label={t("outstanding")}>{money(bills.reduce((s,b)=>s+b.total-b.paid,0))}</FieldPair></div><h3>{t("purchaseBills")}</h3>{bills.length?bills.map(b=><div className="list-row" key={b.id}><span>{b.id}<small>{date(b.date,lang)}</small></span><span><strong>{money(b.total)}</strong><small>{t("paid")}: {money(b.paid)}</small></span></div>):<p>{t("noBills")}</p>}<h3>{t("products")}</h3>{data.products.filter(p=>p.vendorId===v.id).map(p=><button key={p.id} className="list-row" onClick={()=>open({kind:"product",id:p.id})}><span>{p.name}</span><ArrowUpRight size={14}/></button>)}</>;
 }else if(panel.kind==="product"){
 const p=data.products.find(p=>p.id===panel.id);if(!p)return null;title=t("productDetails");const insight=data.insights.find(i=>i.targetId===p.id)??{...data.insights[1],id:`STOCK-${p.id}`,targetId:p.id,title:{en:`Restock ${p.name}`,hi:`${p.name} का स्टॉक भरें`,hinglish:`${p.name} restock karein`},summary:{en:p.sku,hi:p.sku,hinglish:p.sku},recommendation:{en:`Review a purchase of ${Math.max(0,p.reorderLevel*2-p.stock)} units.`,hi:`${Math.max(0,p.reorderLevel*2-p.stock)} यूनिट की खरीद पर विचार करें।`,hinglish:`${Math.max(0,p.reorderLevel*2-p.stock)} units ki purchase review karein.`}};content=<><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><span className="product-icon large"><Package size={30}/></span><h2>{p.name}</h2><p className="mono muted">{p.sku}</p></div><div style={{display:"flex",gap:8}}><Button variant="secondary" onClick={()=>open({kind:"editProduct",productId:p.id})}><Pencil size={14}/>{t("editProduct")}</Button><DeleteProductButton productId={p.id} productName={p.name} onDelete={()=>{app.deleteProduct(p.id);close();}} deleteLabel={t("deleteProduct")}/></div></div><Badge status={stockStatus(p)}/><div className="field-grid"><FieldPair label={t("currentStock")}>{p.stock} {t("units")}</FieldPair><FieldPair label={t("reorderLevel")}>{p.reorderLevel}</FieldPair><FieldPair label={t("velocity")}>{p.dailySales} {t("perDay")}</FieldPair><FieldPair label={t("daysCover")}>{Math.floor(p.stock/p.dailySales)}</FieldPair></div><FieldPair label={t("vendor")}>{data.vendors.find(v=>v.id===p.vendorId)?.name}</FieldPair><p className="muted">{t("stockAdvice")}</p><div className="detail-insight"><h3>{t("recommended")}</h3><p>{insight.recommendation[lang]}</p><ActionForm insight={insight}/></div></>;
 }else if(panel.kind==="editProduct"){
  title=t("editProduct");content=<EditProductForm productId={panel.productId}/>;
 }else if(panel.kind==="document"){
  const d=[...local.uploadedDocuments,...data.documents].find(d=>d.id===panel.id);if(!d)return null;title=t("documentDetails");
  const inv=d.relatedId?.startsWith("INV-")?data.invoices.find(i=>i.id===d.relatedId):undefined;
  const exp=d.relatedId?.startsWith("EXP-")?data.expenses.find(e=>e.id===d.relatedId):undefined;
  const cust=inv?data.customers.find(c=>c.id===inv.customerId):undefined;
  const confScore=d.confidenceScore?`${(d.confidenceScore*100).toFixed(1)}%`:"98.4%";
  content=<><div className="file-icon large"><FileText size={28}/></div><h2 className="break-word">{d.name}</h2><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",margin:"6px 0 12px 0"}}><Badge status={d.status==="completed"?"completed":"pending"}>{t(d.status==="completed"?"processed":"reviewStatus")}</Badge><Badge status="completed">Confidence: {confScore}</Badge></div><div className="field-grid"><FieldPair label={t("type")}>{d.format}</FieldPair><FieldPair label={t("uploaded")}>{date(d.uploaded,lang)} 2026</FieldPair>{cust&&<FieldPair label={t("customer")}>{cust.name}</FieldPair>}{inv?.gstin&&<FieldPair label="GSTIN">{inv.gstin}</FieldPair>}</div>{inv&&<div className="invoice-totals" style={{marginTop:12}}><div><span>{t("subtotal")}</span><strong>{money(inv.subtotal)}</strong></div><div><span>GST (CGST+SGST)</span><strong>{money(inv.tax)}</strong></div><div><span>{t("total")}</span><strong>{money(inv.total)}</strong></div></div>}<div className="detail-insight"><p>{t(d.id.startsWith("DOC-UP-")?"simulationNote":"sampleData")}</p>{d.relatedId?.startsWith("INV-")&&<Button onClick={()=>open({kind:"invoice",id:d.relatedId!})}>{t("invoiceDetails")}<ArrowUpRight size={14}/></Button>}{d.relatedId?.startsWith("PRD-")&&<Button onClick={()=>open({kind:"product",id:d.relatedId!})}>{t("productDetails")}<ArrowUpRight size={14}/></Button>}{exp&&<FieldPair label={t("amount")}>{money(exp.amount)}</FieldPair>}</div>{d.extractedData&&<details style={{fontSize:"0.82rem",background:"var(--surface-subtle,#f8fafc)",padding:"8px 12px",borderRadius:6,marginTop:8}}><summary style={{cursor:"pointer",fontWeight:600}}>Structured Extracted Fields (JSON)</summary><pre style={{overflowX:"auto",marginTop:6,fontSize:"0.75rem"}}>{JSON.stringify(d.extractedData,null,2)}</pre></details>}{d.insightIds.map(id=>{const i=data.insights.find(i=>i.id===id);return i?<button className="list-row" key={id} onClick={()=>open({kind:"evidence",id:i.evidenceIds.join(",")})}><span>{i.title[lang]}</span><ArrowUpRight size={16}/></button>:null;})}</>;
 }else if(panel.kind==="action"){
 const insight=data.insights.find(i=>i.id===panel.id);if(!insight)return null;title=t(insight.action);content=<><h2>{insight.title[lang]}</h2><p>{insight.recommendation[lang]}</p><p className="muted">{t("reminderDescription")}</p><ActionForm key={insight.id} insight={insight}/></>;
 }else if(panel.kind==="actions"){
 title=t("actionCenter");content=<><p className="muted">{t("allLocal")}</p>{local.actions.length?local.actions.map(a=>{const i=data.insights.find(i=>i.id===a.insightId);return <Card className="action-record" key={a.id}><Badge status={a.status}/><h3>{i?.title[lang]??a.note}</h3>{a.note&&<p style={{fontSize:"0.88rem",marginTop:4}}>{a.note}</p>}<small className="muted">{t("created")} {date(a.createdAt,lang)}</small>{a.status==="open"&&<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>{a.draftMessage&&<Button variant="secondary" onClick={()=>{const url=`https://api.whatsapp.com/send?text=${encodeURIComponent(a.draftMessage!)}`;window.open(url,"_blank");}}>💬 WhatsApp</Button>}<Button onClick={()=>app.completeAction(a.id)}><CheckCircle2 size={15}/>{t("completeAction")}</Button></div>}</Card>;}):<EmptyState title={t("noActions")} description={t("noActionsNote")}><Link className="button primary" href="/insights" onClick={close}>{t("viewInsights")}</Link></EmptyState>}</>;
 }else if(panel.kind==="more"){
 title=t("more");content=<nav className="more-navigation">{[...navItems,{route:"settings" as const,icon:Plus}].map(({route,icon:Icon})=><Link key={route} href={routeHref(route)} onClick={close}><Icon size={20}/>{t(route)}</Link>)}</nav>;
 }else if(panel.kind==="help"){
 title=t("help");content=<><h2>VyaparAI</h2><p>{t("tagline")}</p><div className="detail-insight">{t("helpText")}</div><p>{t("privacyNote")}</p><Link className="button primary" href="/assistant" onClick={close}>{t("askCopilot")}<ArrowUpRight size={15}/></Link></>;
 }else if(panel.kind==="reset"){
 title=t("resetTitle");content=<><p>{t("resetNote")}</p><div className="button-row"><Button onClick={close}>{t("cancel")}</Button><Button variant="danger" onClick={app.reset}>{t("resetConfirm")}</Button></div></>;
 }else if(panel.kind==="search"){title=t("search");content=<GlobalSearch/>;}
 return <Drawer title={title} onClose={close}>{content}</Drawer>;
}
function ActionForm({insight}:{insight:Insight}){
  const {t,createAction,local,lang,data,notify}=useApp();
  const [note,setNote]=useState("");
  const [copied,setCopied]=useState(false);
  const existing=local.actions.some(a=>a.insightId===insight.id&&a.status==="open");

  const isInvoiceAction=insight.targetId?.startsWith("INV-")||insight.id==="INS-1";
  const invoiceId=insight.targetId?.startsWith("INV-")?insight.targetId:"INV-1023";
  const inv=data?.invoices.find(i=>i.id===invoiceId);
  const customer=data?.customers.find(c=>c.id===inv?.customerId);
  const amountStr=inv?`₹${inv.total.toLocaleString("en-IN")}`:"₹35,000";
  const customerName=customer?.name??"Customer";

  const whatsappMessage=lang==="hi"
    ?`नमस्ते ${customerName}, ${data?.business.name??"VyaparAI"} (कानपुर) से विनम्र अनुस्मारक। बिल ${invoiceId} का बकाया ${amountStr} है। कृपया जल्द भुगतान करें। धन्यवाद!`
    :`Dear ${customerName}, greetings from ${data?.business.name??"VyaparAI"} (Kanpur). This is a reminder regarding pending invoice ${invoiceId} for ${amountStr}. Kindly arrange payment at your earliest. Thank you!`;

  const copyWhatsApp=()=>{
    if(typeof navigator!=="undefined"&&navigator.clipboard){
      void navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      notify("saved");
      setTimeout(()=>setCopied(false),2000);
    }
  };

  const openWhatsApp=()=>{
    const url=`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url,"_blank");
  };

  return <div className="action-form-wrapper">
    {isInvoiceAction&&(
      <div className="whatsapp-action-box">
        <div className="whatsapp-action-header">
          <span>💬 WhatsApp Reminder</span>
          <small>{customerName}</small>
        </div>
        <div className="whatsapp-message-preview">{whatsappMessage}</div>
        <div className="whatsapp-buttons">
          <button type="button" className="whatsapp-btn" onClick={openWhatsApp}>
            Open WhatsApp
          </button>
          <button type="button" className="button" onClick={copyWhatsApp}>
            {copied?"Copied! ✓":"Copy Message"}
          </button>
        </div>
      </div>
    )}
    <form className="action-form" onSubmit={e=>{e.preventDefault();createAction(insight,note||insight.targetId);}}>
      <label>{t("note")}<textarea rows={3} maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder={t("reminderNote")}/></label>
      <Button variant="primary" type="submit">{t(existing?"actionCenter":insight.action)}<ArrowUpRight size={15}/></Button>
      <small className="muted">{t("allLocal")}</small>
    </form>
  </div>;
}
function GlobalSearch(){const {data,t,open}=useApp();const [query,setQuery]=useState("");if(!data)return null;const q=query.trim().toLowerCase();const results=[...data.invoices.map(i=>({kind:"invoice" as const,id:i.id,name:`${i.id} · ${data.customers.find(c=>c.id===i.customerId)?.name}`})),...data.customers.map(c=>({kind:"customer" as const,id:c.id,name:c.name})),...data.products.map(p=>({kind:"product" as const,id:p.id,name:p.name}))].filter(v=>q&&v.name.toLowerCase().includes(q)).slice(0,20);return <><SearchField value={query} onChange={setQuery} placeholder={t("searchPlaceholder")}/>{results.length?results.map(r=><button className="list-row" key={r.id} onClick={()=>open({kind:r.kind,id:r.id})}><Search size={16}/><span>{r.name}</span><ArrowUpRight size={14}/></button>):<EmptyState title={q?t("noResults"):t("search")} description={q?t("trySearch"):t("searchPlaceholder")}/>}</>;}

function printTaxInvoice(invoice: Invoice, customer: Customer, business: Business, products: Product[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const itemsHtml = invoice.items.map((item, idx) => {
    const p = products.find(prod => prod.id === item.productId);
    const hsn = item.hsnCode || p?.hsnCode || "8528";
    const name = p?.name || item.productId;
    const cgstAmt = (item.tax / 2).toFixed(2);
    const sgstAmt = (item.tax / 2).toFixed(2);
    return `<tr>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">${idx + 1}</td>
      <td style="border:1px solid #cbd5e1;padding:8px;"><strong>${name}</strong></td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">${hsn}</td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">${item.quantity} Nos</td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;">₹${item.unitPrice.toLocaleString("en-IN")}</td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;">₹${item.subtotal.toLocaleString("en-IN")}</td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;">9% (₹${cgstAmt})</td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;">9% (₹${sgstAmt})</td>
      <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-weight:bold;">₹${item.gross.toLocaleString("en-IN")}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Tax Invoice - ${invoice.id}</title><style>@page{size:A4 portrait;margin:12mm}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:0;padding:16px;font-size:13px;line-height:1.4;background:#fff}.tax-invoice-box{max-width:800px;margin:auto;border:2px solid #0f172a;padding:20px}.header-title{text-align:center;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:16px}.header-title h1{margin:0;font-size:20px;letter-spacing:1px;text-transform:uppercase}.header-title small{font-size:11px;color:#64748b}.parties-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;border-bottom:1px solid #cbd5e1;padding-bottom:12px;margin-bottom:12px}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;font-size:12px}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f1f5f9;border:1px solid #cbd5e1;padding:8px;font-size:11px;text-transform:uppercase;color:#334155}.totals-table{width:320px;margin-left:auto;border-collapse:collapse;margin-top:10px}.totals-table td{padding:6px 10px;border:1px solid #cbd5e1;font-size:12px}.footer{margin-top:24px;display:grid;grid-template-columns:1.5fr 1fr;gap:20px;border-top:1px solid #cbd5e1;padding-top:14px}.sign-box{border-top:1px dashed #64748b;margin-top:50px;text-align:center;padding-top:6px;font-weight:bold}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="margin-bottom:12px;text-align:right"><button onclick="window.print()" style="background:#0d7063;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Print / Save as PDF</button></div><div class="tax-invoice-box"><div class="header-title"><h1>TAX INVOICE</h1><small>(Under Section 31 of Central Goods and Services Tax Act, 2017)</small></div><div class="parties-grid"><div><h3 style="margin:0 0 4px 0;font-size:15px;">${business.name}</h3><p style="margin:0;font-size:12px;color:#475569;">${business.type} · ${business.city}, ${business.state}</p><p style="margin:4px 0;font-size:12px;"><strong>GSTIN:</strong> 09AAACS1429B1Z2</p><p style="margin:0;font-size:12px;"><strong>State:</strong> Uttar Pradesh (Code 09)</p></div><div><p style="margin:0;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;">Billed To / Buyer:</p><h3 style="margin:2px 0 4px 0;font-size:15px;">${customer.name}</h3><p style="margin:0;font-size:12px;color:#475569;">${customer.city}</p><p style="margin:4px 0;font-size:12px;"><strong>GSTIN:</strong> ${customer.gstin||"URP (Unregistered Person)"}</p><p style="margin:0;font-size:12px;"><strong>Phone:</strong> ${customer.phone||customer.contact||"—"}</p></div></div><div class="meta-grid"><div><strong>Invoice No:</strong> ${invoice.id}</div><div><strong>Invoice Date:</strong> ${invoice.date} 2026</div><div><strong>Place of Supply:</strong> Uttar Pradesh (09)</div><div><strong>Payment Due Date:</strong> ${invoice.dueDate} 2026</div></div><table><thead><tr><th>#</th><th>Item Description</th><th>HSN/SAC</th><th>Qty</th><th>Unit Rate</th><th>Taxable Val</th><th>CGST</th><th>SGST</th><th>Total (INR)</th></tr></thead><tbody>${itemsHtml}</tbody></table><table class="totals-table"><tr><td>Taxable Amount:</td><td style="text-align:right;">₹${invoice.subtotal.toLocaleString("en-IN")}</td></tr><tr><td>CGST (9%):</td><td style="text-align:right;">₹${(invoice.tax/2).toLocaleString("en-IN")}</td></tr><tr><td>SGST (9%):</td><td style="text-align:right;">₹${(invoice.tax/2).toLocaleString("en-IN")}</td></tr><tr style="font-weight:bold;background:#f8fafc;"><td>Total Invoice Amount:</td><td style="text-align:right;">₹${invoice.total.toLocaleString("en-IN")}</td></tr></table><div class="footer"><div><h4 style="margin:0 0 4px 0;font-size:12px;">Bank Details for NEFT / RTGS / UPI:</h4><p style="margin:2px 0;font-size:11px;">Bank: State Bank of India</p><p style="margin:2px 0;font-size:11px;">A/C No: 390192830192</p><p style="margin:2px 0;font-size:11px;">IFSC: SBIN0001294 (Kanpur Main)</p><p style="margin:2px 0;font-size:11px;">UPI ID: vyapar.sharma@sbi</p><p style="margin:8px 0 0 0;font-size:10px;color:#64748b;">Terms: Subject to Kanpur jurisdiction. Goods once sold will not be taken back.</p></div><div><p style="text-align:center;font-size:11px;margin:0;">For ${business.name}</p><div class="sign-box">Authorized Signatory</div></div></div></div></body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
}

function CreateInvoiceForm(){
  const {data,createInvoice,notify,close,open,t}=useApp();
  const [customerId,setCustomerId]=useState(data?.customers[0]?.id||"CUS-1001");
  const [productId,setProductId]=useState(data?.products[0]?.id||"PRD-2001");
  const [quantity,setQuantity]=useState(2);
  const selectedProd=data?.products.find(p=>p.id===productId);
  const [unitPrice,setUnitPrice]=useState(selectedProd?.price||15000);
  const [invoiceDate,setInvoiceDate]=useState("2026-09-30");
  const [dueDate,setDueDate]=useState("2026-10-15");

  const handleProductChange=(pId:string)=>{
    setProductId(pId);
    const prod=data?.products.find(p=>p.id===pId);
    if(prod)setUnitPrice(prod.price);
  };

  const subtotal=Math.max(0,quantity*unitPrice);
  const tax=Math.round(subtotal*0.18);
  const total=subtotal+tax;

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!data)return;
    const invId=`INV-${1000+data.invoices.length+1}`;
    createInvoice({
      id:invId,
      customerId,
      date:invoiceDate,
      dueDate,
      subtotal,
      tax,
      total,
      items:[{
        productId,
        quantity,
        unitPrice,
        gross:total,
        subtotal,
        tax,
        hsnCode:selectedProd?.hsnCode||"8528"
      }]
    });
    notify("invoiceAdded");
    open({kind:"invoice",id:invId});
  };

  return <form className="action-form" onSubmit={handleSubmit} style={{width:"100%",gap:14}}>
    <label style={{width:"100%"}}>
      <span style={{fontWeight:600,fontSize:12}}>{t("selectCustomer")}</span>
      <select value={customerId} onChange={e=>setCustomerId(e.target.value)} required style={{width:"100%",padding:"8px 12px"}}>
        {data?.customers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
      </select>
    </label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("date")}</span><input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} required style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("dueDate")}</span><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} required style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <label style={{width:"100%"}}>
      <span style={{fontWeight:600,fontSize:12}}>{t("product")}</span>
      <select value={productId} onChange={e=>handleProductChange(e.target.value)} required style={{width:"100%",padding:"8px 12px"}}>
        {data?.products.map(p=><option key={p.id} value={p.id}>{p.name} · ₹{p.price.toLocaleString("en-IN")}</option>)}
      </select>
    </label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("quantity")}</span><input type="number" min={1} value={quantity} onChange={e=>setQuantity(Math.max(1,parseInt(e.target.value)||1))} required style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("unitPrice")} (₹)</span><input type="number" min={0} value={unitPrice} onChange={e=>setUnitPrice(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <div className="invoice-totals" style={{width:"100%",margin:"8px 0"}}>
      <div><span>{t("subtotal")}</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></div>
      <div><span>CGST (9%) + SGST (9%)</span><strong>₹{tax.toLocaleString("en-IN")}</strong></div>
      <div><span>{t("total")}</span><strong style={{color:"var(--primary)"}}>₹{total.toLocaleString("en-IN")}</strong></div>
    </div>
    <div style={{display:"flex",gap:10,width:"100%",marginTop:8}}>
      <Button variant="primary" type="submit" style={{flex:1,justifyContent:"center"}}>{t("createInvoice")}</Button>
      <Button type="button" onClick={close}>{t("cancel")}</Button>
    </div>
  </form>;
}

function RecordPaymentForm({preselectedInvoiceId}:{preselectedInvoiceId?:string}){
  const {data,recordPayment,notify,close,t,lang}=useApp();
  const unpaidInvoices=(data?.invoices||[]).filter(i=>outstanding(i)>0);
  const initialInvId=preselectedInvoiceId||unpaidInvoices[0]?.id||data?.invoices[0]?.id||"";
  const [invoiceId,setInvoiceId]=useState(initialInvId);

  const selectedInvoice=data?.invoices.find(i=>i.id===invoiceId);
  const currentOutstanding=selectedInvoice?outstanding(selectedInvoice):0;
  const customer=data?.customers.find(c=>c.id===selectedInvoice?.customerId);

  const [amount,setAmount]=useState(currentOutstanding||10000);
  const [method,setMethod]=useState<"upi"|"bank"|"cash">("upi");
  const [paymentDate,setPaymentDate]=useState("2026-09-30");
  const [reference,setReference]=useState("");

  const handleInvoiceChange=(invId:string)=>{
    setInvoiceId(invId);
    const inv=data?.invoices.find(i=>i.id===invId);
    if(inv)setAmount(outstanding(inv));
  };

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!selectedInvoice||!customer)return;
    const refNum=reference.trim()||`${method.toUpperCase()}/PAY-${(data?.payments.length??0)+1}`;
    recordPayment({
      invoiceId:selectedInvoice.id,
      customerId:customer.id,
      amount,
      method,
      date:paymentDate,
      referenceNumber:refNum
    });
    notify("paymentReceived");
    close();
  };

  return <form className="action-form" onSubmit={handleSubmit} style={{width:"100%",gap:14}}>
    <label style={{width:"100%"}}>
      <span style={{fontWeight:600,fontSize:12}}>{t("selectInvoice")}</span>
      <select value={invoiceId} onChange={e=>handleInvoiceChange(e.target.value)} required style={{width:"100%",padding:"8px 12px"}}>
        {unpaidInvoices.length>0?unpaidInvoices.map(inv=>{
          const cName=data?.customers.find(c=>c.id===inv.customerId)?.name;
          return <option key={inv.id} value={inv.id}>{inv.id} · {cName} · Due: ₹{outstanding(inv).toLocaleString("en-IN")}</option>;
        }):<option value="">No unpaid invoices</option>}
      </select>
    </label>
    {selectedInvoice&&customer&&(
      <div style={{background:"var(--teal-bg)",padding:12,borderRadius:8,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{t("customer")}:</span><strong>{customer.name}</strong></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{t("dueDate")}:</span><strong>{date(selectedInvoice.dueDate,lang)} 2026</strong></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--red)",fontWeight:700}}><span>{t("outstanding")}:</span><span>₹{currentOutstanding.toLocaleString("en-IN")}</span></div>
      </div>
    )}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("amount")} (₹)</span><input type="number" min={1} max={currentOutstanding>0?currentOutstanding:undefined} value={amount} onChange={e=>setAmount(Math.max(1,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("method")}</span><select value={method} onChange={e=>setMethod(e.target.value as "upi"|"bank"|"cash")} style={{width:"100%",padding:"8px 10px"}}><option value="upi">{t("upi")}</option><option value="bank">{t("bankTransfer")}</option><option value="cash">{t("cash")}</option></select></label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("date")}</span><input type="date" value={paymentDate} onChange={e=>setPaymentDate(e.target.value)} required style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("referenceNumber")}</span><input type="text" value={reference} placeholder="e.g. UPI/6291048291" onChange={e=>setReference(e.target.value)} style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <div style={{display:"flex",gap:10,width:"100%",marginTop:8}}>
      <Button variant="primary" type="submit" disabled={!selectedInvoice||amount<=0} style={{flex:1,justifyContent:"center"}}>{t("recordPayment")}</Button>
      <Button type="button" onClick={close}>{t("cancel")}</Button>
    </div>
  </form>;
}

function CreateCustomerForm(){
  const {createCustomer,notify,close,t}=useApp();
  const [name,setName]=useState("");
  const [contact,setContact]=useState("");
  const [phone,setPhone]=useState("");
  const [city,setCity]=useState("Kanpur");
  const [gstin,setGstin]=useState("");

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!name.trim())return;
    createCustomer({
      name:name.trim(),
      contact:contact.trim()||name.trim(),
      phone:phone.trim()||"+91 98390 12345",
      city:city.trim()||"Kanpur",
      gstin:gstin.trim()||undefined
    });
    notify("saved");
    close();
  };

  return <form className="action-form" onSubmit={handleSubmit} style={{width:"100%",gap:14}}>
    <label style={{width:"100%"}}><span style={{fontWeight:600,fontSize:12}}>{t("customer")} Name</span><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Kanpur Smart Devices" required style={{width:"100%",padding:"8px 10px"}}/></label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("contact")} Person</span><input type="text" value={contact} onChange={e=>setContact(e.target.value)} placeholder="e.g. Amit Verma" style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("phone")}</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98390 00000" style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("city")}</span><input type="text" value={city} onChange={e=>setCity(e.target.value)} style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>GSTIN (Optional)</span><input type="text" value={gstin} onChange={e=>setGstin(e.target.value)} placeholder="09AAACS1429B1Z2" style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <div style={{display:"flex",gap:10,width:"100%",marginTop:8}}>
      <Button variant="primary" type="submit" style={{flex:1,justifyContent:"center"}}>{t("addCustomer")}</Button>
      <Button type="button" onClick={close}>{t("cancel")}</Button>
    </div>
  </form>;
}

function CreateProductForm(){
  const {data,createProduct,notify,close,t}=useApp();
  const [name,setName]=useState("");
  const [sku,setSku]=useState("");
  const [category,setCategory]=useState("Audio");
  const [price,setPrice]=useState(12000);
  const [stock,setStock]=useState(25);
  const [reorderLevel,setReorderLevel]=useState(10);
  const [vendorId,setVendorId]=useState(data?.vendors[0]?.id||"VEN-501");
  const [hsnCode,setHsnCode]=useState("8528");

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!name.trim())return;
    const generatedSku=sku.trim()||`SKU-${((data?.products.length??0)+1).toString().padStart(4,"0")}`;
    createProduct({
      name:name.trim(),
      sku:generatedSku,
      category,
      price,
      stock,
      reorderLevel,
      dailySales:1,
      vendorId,
      hsnCode
    });
    notify("saved");
    close();
  };

  return <form className="action-form" onSubmit={handleSubmit} style={{width:"100%",gap:14}}>
    <label style={{width:"100%"}}><span style={{fontWeight:600,fontSize:12}}>{t("product")} Name</span><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sony Wireless Soundbar HT-S20R" required style={{width:"100%",padding:"8px 10px"}}/></label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("sku")}</span><input type="text" value={sku} onChange={e=>setSku(e.target.value)} placeholder="e.g. SNY-SB-20" style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("category")}</span><select value={category} onChange={e=>setCategory(e.target.value)} style={{width:"100%",padding:"8px 10px"}}><option value="Audio">Audio</option><option value="Appliances">Appliances</option><option value="Wearables">Wearables</option><option value="Accessories">Accessories</option></select></label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>Unit Price (₹)</span><input type="number" min={0} value={price} onChange={e=>setPrice(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>Initial {t("currentStock")}</span><input type="number" min={0} value={stock} onChange={e=>setStock(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label><span style={{fontWeight:600,fontSize:12}}>{t("reorderLevel")}</span><input type="number" min={0} value={reorderLevel} onChange={e=>setReorderLevel(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/></label>
      <label><span style={{fontWeight:600,fontSize:12}}>HSN Code</span><input type="text" value={hsnCode} onChange={e=>setHsnCode(e.target.value)} style={{width:"100%",padding:"8px 10px"}}/></label>
    </div>
    <label style={{width:"100%"}}><span style={{fontWeight:600,fontSize:12}}>Supplier / {t("vendor")}</span><select value={vendorId} onChange={e=>setVendorId(e.target.value)} style={{width:"100%",padding:"8px 12px"}}>{data?.vendors.map(v=><option key={v.id} value={v.id}>{v.name} ({v.city})</option>)}</select></label>
    <div style={{display:"flex",gap:10,width:"100%",marginTop:8}}>
      <Button variant="primary" type="submit" style={{flex:1,justifyContent:"center"}}>{t("addProduct")}</Button>
      <Button type="button" onClick={close}>{t("cancel")}</Button>
    </div>
  </form>;
}

function EditProductForm({productId}:{productId:string}){
  const {data,updateProduct,deleteProduct,notify,close,open,t}=useApp();
  const product=data?.products.find(p=>p.id===productId);
  const [name,setName]=useState(product?.name||"");
  const [sku,setSku]=useState(product?.sku||"");
  const [category,setCategory]=useState(product?.category||"Audio");
  const [price,setPrice]=useState(product?.price||0);
  const [stock,setStock]=useState(product?.stock||0);
  const [reorderLevel,setReorderLevel]=useState(product?.reorderLevel||10);
  const [dailySales,setDailySales]=useState(product?.dailySales||1);
  const [vendorId,setVendorId]=useState(product?.vendorId||data?.vendors[0]?.id||"VEN-501");
  const [hsnCode,setHsnCode]=useState(product?.hsnCode||"8528");

  if(!product)return <EmptyState title={t("noResults")} description={t("trySearch")}/>;

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!name.trim())return;
    updateProduct(productId,{
      name:name.trim(),
      sku:sku.trim()||product.sku,
      category,
      price,
      stock,
      reorderLevel,
      dailySales,
      vendorId,
      hsnCode
    });
    notify("saved");
    open({kind:"product",id:productId});
  };

  const [confirmingDelete,setConfirmingDelete]=useState(false);

  return <form className="action-form" onSubmit={handleSubmit} style={{width:"100%",gap:14}}>
    <label style={{width:"100%"}}>
      <span style={{fontWeight:600,fontSize:12}}>{t("product")} Name</span>
      <input type="text" value={name} onChange={e=>setName(e.target.value)} required style={{width:"100%",padding:"8px 10px"}}/>
    </label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>{t("sku")}</span>
        <input type="text" value={sku} onChange={e=>setSku(e.target.value)} required style={{width:"100%",padding:"8px 10px"}}/>
      </label>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>{t("category")}</span>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:"100%",padding:"8px 10px"}}><option value="Audio">Audio</option><option value="Appliances">Appliances</option><option value="Wearables">Wearables</option><option value="Accessories">Accessories</option></select>
      </label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>Unit Price (₹)</span>
        <input type="number" min={0} value={price} onChange={e=>setPrice(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/>
      </label>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>{t("currentStock")}</span>
        <input type="number" min={0} value={stock} onChange={e=>setStock(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/>
      </label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>{t("reorderLevel")}</span>
        <input type="number" min={0} value={reorderLevel} onChange={e=>setReorderLevel(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/>
      </label>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>{t("velocity")} (units/day)</span>
        <input type="number" min={0} value={dailySales} onChange={e=>setDailySales(Math.max(0,parseInt(e.target.value)||0))} required style={{width:"100%",padding:"8px 10px"}}/>
      </label>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%"}}>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>Supplier / {t("vendor")}</span>
        <select value={vendorId} onChange={e=>setVendorId(e.target.value)} style={{width:"100%",padding:"8px 10px"}}>
          {data?.vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>
      <label>
        <span style={{fontWeight:600,fontSize:12}}>HSN Code</span>
        <input type="text" value={hsnCode} onChange={e=>setHsnCode(e.target.value)} style={{width:"100%",padding:"8px 10px"}}/>
      </label>
    </div>
    <div style={{display:"flex",gap:10,width:"100%",marginTop:8,flexWrap:"wrap"}}>
      <Button variant="primary" type="submit" style={{flex:1,justifyContent:"center"}}>{t("save")}</Button>
      {confirmingDelete ? (
        <>
          <Button variant="danger" type="button" onClick={()=>{deleteProduct(productId);close();}}>{t("deleteProduct")}</Button>
          <Button type="button" onClick={()=>setConfirmingDelete(false)}>{t("cancel")}</Button>
        </>
      ) : (
        <Button variant="danger" type="button" onClick={()=>setConfirmingDelete(true)}><Trash2 size={14}/>{t("deleteProduct")}</Button>
      )}
      <Button type="button" onClick={close}>{t("cancel")}</Button>
    </div>
  </form>;
}

function DeleteProductButton({productId:_,productName,onDelete,deleteLabel}:{productId:string;productName:string;onDelete:()=>void;deleteLabel:string}){
  const [confirming,setConfirming]=useState(false);
  if(confirming){
    return (
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <AlertTriangle size={14} style={{color:"var(--red)"}}/>
        <Button variant="danger" onClick={onDelete}>{deleteLabel} &quot;{productName}&quot;?</Button>
        <Button onClick={()=>setConfirming(false)}>No</Button>
      </div>
    );
  }
  return <Button variant="danger" onClick={()=>setConfirming(true)}><Trash2 size={14}/>{deleteLabel}</Button>;
}
