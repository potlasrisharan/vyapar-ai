import { test } from "node:test";
import assert from "node:assert/strict";
import { data,businessTotals,monthlyHistory } from "../lib/mock/business";
import { invoiceStatus,outstanding,paidAmount } from "../lib/mock/invoices";
import { previousExpenses } from "../lib/mock/expenses";
import { dictionaries } from "../lib/i18n";
import { classifyQuestion,responseText } from "../lib/mock/assistant";
test("the complete ledger reconciles to dashboard totals",()=>{assert.equal(data.invoices.length,40);assert.equal(data.customers.length,15);assert.equal(data.vendors.length,10);assert.equal(data.products.length,30);assert.deepEqual(businessTotals(data),{revenue:482000,paid:400000,outstanding:82000,expenses:213000,net:269000,lowStock:5});assert.equal(data.invoices.filter(i=>invoiceStatus(i)==="overdue").length,3);assert.equal(Object.values(previousExpenses).reduce((a,b)=>a+b,0),202378);assert.equal(monthlyHistory.at(-1)?.revenue,businessTotals(data).revenue);});
test("every invoice, payment and vendor bill has valid related records",()=>{for(const i of data.invoices){assert.ok(data.customers.some(c=>c.id===i.customerId));assert.equal(i.items.reduce((s,x)=>s+x.gross,0),i.total);assert.ok(Math.abs(i.subtotal+i.tax-i.total)<0.01);assert.ok(outstanding(i)>=0);for(const item of i.items){assert.ok(data.products.some(p=>p.id===item.productId));assert.equal(item.quantity*item.unitPrice,item.gross);}}for(const p of data.payments){const i=data.invoices.find(i=>i.id===p.invoiceId);assert.equal(i?.customerId,p.customerId);}for(const b of data.purchaseBills){assert.ok(data.vendors.some(v=>v.id===b.vendorId));assert.equal(data.expenses.find(e=>e.id===b.expenseId)?.amount,b.total);}assert.equal(paidAmount(data.invoices.find(i=>i.id==="INV-1023")!),0);});
test("every insight cites an existing record and document",()=>{for(const insight of data.insights)for(const id of insight.evidenceIds){const e=data.evidence.find(e=>e.id===id);assert.ok(e);const entities=e.type==="invoice"?data.invoices:e.type==="inventory"?data.products:e.type==="expense"?data.expenses:data.documents;assert.ok(entities.some(v=>v.id===e.entityId));if(e.documentId)assert.ok(data.documents.some(d=>d.id===e.documentId));}for(const doc of data.documents){for(const id of doc.insightIds)assert.ok(data.insights.some(i=>i.id===id));}});
import { knowledgeService, eventBus, config, emailService, voiceService, auditService, jobService } from "../lib/services";
test("dictionaries have identical stable keys and multilingual responses",()=>{const keys=Object.keys(dictionaries.en).sort();assert.deepEqual(Object.keys(dictionaries.hi).sort(),keys);assert.deepEqual(Object.keys(dictionaries.hinglish).sort(),keys);assert.equal(classifyQuestion("आज मुझे क्या करना चाहिए?"),"today");assert.equal(classifyQuestion("Mere kharch kyun badhe?"),"expenses");assert.equal(classifyQuestion("invent a forecast for next year"),"unknown");assert.match(responseText("owes","hi"),/₹35,000/);assert.notEqual(responseText("today","en"),responseText("today","hinglish"));});
test("knowledge graph and domain event bus operate correctly",async()=>{const matches=await knowledgeService.findRelated("CUS-1001","OWES");assert.ok(matches.some(m=>m.id==="INV-1023"));assert.equal(config.aws.region,"ap-southeast-2");let received=false;const unsub=eventBus.subscribe("InvoicePaid",()=>{received=true;});await eventBus.emit({type:"InvoicePaid",businessId:"BIZ-1",payload:{invoiceId:"INV-1023"}});assert.equal(received,true);unsub();});

test("email service searches threads, drafts localized replies, and sends",async()=>{
  const searchResults=await emailService.searchEmails("INV-1023");
  assert.ok(searchResults.length>0);
  assert.equal(searchResults[0].messages.length,2);
  const hindiDraft=await emailService.draftReply("EML-TH-01","confirm","hi");
  assert.ok(hindiDraft.includes("Sharma Electronics"));
  const hinglishDraft=await emailService.draftReply("EML-TH-01","confirm","hinglish");
  assert.ok(hinglishDraft.includes("UTR number"));
  const sent=await emailService.sendEmail("amit@abctraders.in","Payment Confirmation","Thank you");
  assert.equal(sent,true);
});

test("voice service executes business copilot tools accurately",async()=>{
  const balanceResult=await voiceService.executeTool("get_outstanding_balance",{});
  assert.ok(balanceResult.output.includes("₹82,000"));
  const customerResult=await voiceService.executeTool("get_customer",{query:"ABC"});
  assert.ok(customerResult.output.includes("ABC Traders"));
  const invoiceResult=await voiceService.executeTool("get_invoice",{id:"INV-1023"});
  assert.ok(invoiceResult.output.includes("35,000"));
  const promiseResult=await voiceService.executeTool("record_payment_promise",{customerId:"CUS-1001",amount:35000,promisedDate:"2026-10-10"});
  assert.ok(promiseResult.output.includes("35000"));
});

test("audit service logs entries and background jobs process correctly",async()=>{
  const logs=await auditService.getLogs("BIZ-1");
  assert.ok(logs.length>=6);
  assert.ok(logs.some(l=>l.action==="BusinessProfileRegistered"));
  const jobId=await jobService.dispatchJob("DocumentProcessingJob",{docId:"DOC-UP-1"});
  assert.ok(jobId.startsWith("JOB-"));
  const status=await jobService.getJobStatus(jobId);
  assert.ok(["processing","completed"].includes(status));
});

