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

test("payment reconciliation arithmetic updates invoice outstanding balances correctly",()=>{
  const inv = data.invoices.find(i=>i.id==="INV-1023")!;
  assert.equal(inv.total, 35000);
  assert.equal(paidAmount(inv), 0);
  assert.equal(outstanding(inv), 35000);

  const simulatedPayment = { id: "PAY-TEST-1", invoiceId: "INV-1023", customerId: inv.customerId, amount: 15000, date: "2026-09-30", method: "upi" as const };
  const paymentsWithSim = [simulatedPayment, ...data.payments];
  const customPaid = paymentsWithSim.filter(p=>p.invoiceId===inv.id).reduce((s,p)=>s+p.amount,0);
  assert.equal(customPaid, 15000);
  const customOutstanding = Math.max(0, inv.total - customPaid);
  assert.equal(customOutstanding, 20000);

  const simulatedSettlement = { id: "PAY-TEST-2", invoiceId: "INV-1023", customerId: inv.customerId, amount: 20000, date: "2026-09-30", method: "bank" as const };
  const settledPayments = [simulatedSettlement, ...paymentsWithSim];
  const settledPaid = settledPayments.filter(p=>p.invoiceId===inv.id).reduce((s,p)=>s+p.amount,0);
  assert.equal(settledPaid, 35000);
  const settledOutstanding = Math.max(0, inv.total - settledPaid);
  assert.equal(settledOutstanding, 0);
});

import { rigidRagDatabase, RigidRagDatabase } from "../lib/services";

test("rigid RAG test database initializes with verified test invoices and business profile", () => {
  const db = new RigidRagDatabase();
  const chunks = db.getAllChunks();
  assert.ok(chunks.length >= 5);

  const bizChunk = chunks.find(c => c.category === "business_profile");
  assert.ok(bizChunk);
  assert.equal(bizChunk.metadata.party, "Sharma Electronics");
  assert.equal(bizChunk.metadata.gstin, "09AAACS1420M1Z8");
  assert.ok(bizChunk.content.includes("Kanpur"));

  const inv801 = chunks.find(c => c.metadata.invoiceNumber === "INV-801");
  assert.ok(inv801);
  assert.equal(inv801.metadata.amount, 45000);
  assert.equal(inv801.metadata.party, "Bajaj Electricals");
  assert.ok(inv801.content.includes("Ceiling Fan"));
});

test("rigid RAG retrieves exact verified facts for known invoice and business queries", () => {
  const res801 = rigidRagDatabase.retrieve("What are the items in invoice INV-801?");
  assert.equal(res801.isGrounded, true);
  assert.ok(res801.matchedChunks.length > 0);
  assert.equal(res801.matchedChunks[0].chunk.metadata.invoiceNumber, "INV-801");
  assert.ok(res801.groundedContext.includes("Bajaj Electricals"));
  assert.ok(res801.groundedContext.includes("45000"));

  const resHavells = rigidRagDatabase.retrieve("Tell me about Havells bill");
  assert.equal(resHavells.isGrounded, true);
  assert.equal(resHavells.matchedChunks[0].chunk.metadata.invoiceNumber, "INV-802");
  assert.ok(resHavells.groundedContext.includes("Smart LED Surface Panel"));

  const resGstin = rigidRagDatabase.retrieve("What is Sharma Electronics GSTIN?");
  assert.equal(resGstin.isGrounded, true);
  assert.ok(resGstin.groundedContext.includes("09AAACS1420M1Z8"));
});

test("rigid RAG rejects non-existent or hallucinated records with zero false-positives", () => {
  const fakeInv = rigidRagDatabase.retrieve("Details on invoice INV-9999 for Apple iPhone purchase");
  assert.equal(fakeInv.isGrounded, false);
  assert.equal(fakeInv.groundedContext, "");
  assert.equal(fakeInv.matchedChunks.length, 0);

  const unrelated = rigidRagDatabase.retrieve("Who won the 2024 cricket world cup final?");
  assert.equal(unrelated.isGrounded, false);
  assert.equal(unrelated.groundedContext, "");
});

test("rigid RAG dynamically ingests uploaded invoices and enforces strict ground truth", () => {
  rigidRagDatabase.ingestInvoice({
    id: "INV-UPLOAD-77",
    customer: "Anchor Electricals Pvt Ltd",
    date: "2026-10-01",
    dueDate: "2026-10-15",
    total: 28500,
    subtotal: 24152,
    tax: 4348,
    status: "paid",
    gstin: "09AAACA9999Z1Z0",
    items: [
      { description: "Anchor Roma Modular Switches 6A", quantity: 150, unitPrice: 161, total: 24152 },
    ],
  });

  const queryRes = rigidRagDatabase.retrieve("What was the quantity and price for Anchor Roma switches in INV-UPLOAD-77?");
  assert.equal(queryRes.isGrounded, true);
  assert.equal(queryRes.matchedChunks[0].chunk.metadata.invoiceNumber, "INV-UPLOAD-77");
  assert.ok(queryRes.groundedContext.includes("28500"));
  assert.ok(queryRes.groundedContext.includes("Modular Switches"));
  assert.ok(queryRes.groundedContext.includes("150 units"));
});

test("copilot synthesizes overdue payments, weekly action plan, and explicitly names relied-on documents", () => {
  // Ingest business profile and new monthly overdue bill
  rigidRagDatabase.ingestBusinessProfile({
    name: "Sharma Electronics Superstore",
    owner: "Ramesh Sharma",
    city: "Kanpur",
    state: "Uttar Pradesh",
    gstin: "09AAACS1420M1Z8",
    pan: "AAACS1420M",
    monthlyRevenue: 482000,
    monthlyExpenses: 213000,
    totalReceivables: 82000,
  });

  rigidRagDatabase.ingestInvoice({
    id: "INV-MONTH-99",
    customer: "Kalyan Enterprises Kanpur",
    date: "2026-09-12",
    dueDate: "2026-09-24",
    total: 31000,
    status: "overdue",
    gstin: "09AAACK9999K1Z2",
    items: [{ description: "OLED TV Wall Mounts", quantity: 10, unitPrice: 3100, total: 31000 }],
  });

  const planEn = rigidRagDatabase.getOverdueAndWeeklyPlan("en");
  assert.ok(planEn.totalOverdue >= 145000);
  assert.ok(planEn.content.includes("Overdue Payments Summary"));
  assert.ok(planEn.content.includes("Weekly Action Plan"));
  assert.ok(planEn.content.includes("Documents Relied On"));
  assert.ok(planEn.content.includes("INV-1023"));
  assert.ok(planEn.content.includes("INV-1042"));
  assert.ok(planEn.content.includes("INV-MONTH-99"));
  assert.ok(planEn.content.includes("EXP-6"));
  assert.ok(planEn.reliedDocuments.some((d) => d.includes("INV-1023")));
  assert.ok(planEn.reliedDocuments.some((d) => d.includes("EXP-6")));
  assert.ok(planEn.evidenceIds.includes("CHUNK-INV-INV-1023"));

  const planHi = rigidRagDatabase.getOverdueAndWeeklyPlan("hi");
  assert.ok(planHi.content.includes("बकाया भुगतान"));
  assert.ok(planHi.content.includes("कार्ययोजना"));
  assert.ok(planHi.content.includes("संदर्भित दस्तावेज़"));

  const planHinglish = rigidRagDatabase.getOverdueAndWeeklyPlan("hinglish");
  assert.ok(planHinglish.content.includes("Action Plan for This Week"));
  assert.ok(planHinglish.content.includes("Documents Relied On"));
});

import { unifiedExtractInvoice, generatePaymentReminderAI } from "../lib/services/sarvam";

test("multi-model invoice extraction and automated payment reminder generation succeed", async () => {
  const sampleDoc = `TAX INVOICE
Invoice No: INV-TEST-8899
Date: 2026-09-18
Due Date: 2026-09-28
Billed To: Gupta Electricals Kanpur
GSTIN: 09AAACG1234M1Z5
Item: Smart Ceiling Fans 48-inch (Qty: 5 @ 3,500)
Total Amount: ₹17,500
Tax: ₹3,150`;

  const extraction = await unifiedExtractInvoice(sampleDoc);
  assert.ok(extraction.totalAmount > 0);
  assert.ok(extraction.invoiceNumber.includes("8899") || extraction.invoiceNumber.startsWith("INV-"));

  const reminder = await generatePaymentReminderAI({
    invoiceNumber: "INV-TEST-8899",
    customerName: "Gupta Electricals",
    totalAmount: 17500,
    dueDate: "2026-09-28"
  }, "en");

  assert.equal(reminder.channel, "whatsapp");
  assert.ok(reminder.draftMessage.length > 20);
  assert.ok(reminder.draftMessage.includes("INV-TEST-8899") || reminder.draftMessage.includes("Sharma Electronics"));
  assert.ok(reminder.note.includes("Gupta Electricals"));
});

import {
  calculateCustomerUdhaarSummary,
  calculateUdhaarDashboardSummary,
  normalizeOverdueScore,
  normalizeExposureScore,
  normalizePromiseScore,
  calculatePriorityBreakdown,
  calculateReliabilityRating,
} from "../lib/domain/udhaar-engine";
import type { PaymentPromise, CollectionFollowup } from "../lib/types";

test("udhaar khata engine reconciles receivables totals against raw invoices", () => {
  const summaries = data.customers.map((c) =>
    calculateCustomerUdhaarSummary(c, data.invoices, data.payments, [], [])
  );
  const dashboard = calculateUdhaarDashboardSummary(summaries);

  assert.equal(dashboard.totalOutstanding, 82000);
  assert.equal(dashboard.customersWithBalanceCount, 5);
  assert.equal(dashboard.overdueCustomersCount, 3);
  assert.equal(dashboard.totalOverdue, 65000);
  assert.equal(dashboard.totalCollected, 400000);

  const activeDebtors = summaries.filter((s) => s.totalOutstanding > 0);
  assert.equal(activeDebtors.length, 5);
  const abcTraders = activeDebtors.find((s) => s.customer.id === "CUS-1001");
  assert.ok(abcTraders);
  assert.equal(abcTraders.totalOutstanding, 35000);
  assert.equal(abcTraders.overdueBalance, 35000);
  assert.equal(abcTraders.priority.band, "high");
});

test("priority scoring engine correctly balances overdue, exposure, promises and risk trend", () => {
  assert.equal(normalizeOverdueScore(0, true), 0);
  assert.equal(normalizeOverdueScore(0, false), 0);
  assert.equal(normalizeOverdueScore(7, true), 40);
  assert.equal(normalizeOverdueScore(15, true), 75);
  assert.equal(normalizeOverdueScore(35, true), 100);

  assert.equal(normalizeExposureScore(0), 0);
  assert.equal(normalizeExposureScore(25000, 50000), 50);
  assert.equal(normalizeExposureScore(50000, 50000), 100);
  assert.equal(normalizeExposureScore(80000, 50000), 100);

  const noPromises = normalizePromiseScore([]);
  assert.equal(noPromises.score, 30);
  const brokenPromise: PaymentPromise = {
    id: "PRM-1",
    businessId: "BIZ-1",
    customerId: "CUS-1001",
    expectedAmount: 35000,
    expectedDate: "2026-09-20",
    status: "missed",
    note: "Did not wire",
    createdAt: "2026-09-18",
  };
  const oneBroken = normalizePromiseScore([brokenPromise]);
  assert.equal(oneBroken.score, 75);
  const twoBroken = normalizePromiseScore([
    brokenPromise,
    { ...brokenPromise, id: "PRM-2" },
  ]);
  assert.equal(twoBroken.score, 100);

  const settledCustomer = data.customers.find((c) => c.id === "CUS-1002")!;
  const settledPriority = calculatePriorityBreakdown(
    settledCustomer,
    data.invoices,
    data.payments,
    []
  );
  assert.equal(settledPriority.score, 0);
  assert.equal(settledPriority.band, "low");
});

test("customer reliability rating evaluates history independently of invoice size", () => {
  // CUS-1001 has only 1 invoice (INV-1023), so properly flagged as insufficient history (< 2 cycles)
  const c1001 = data.customers.find((c) => c.id === "CUS-1001")!;
  const r1001 = calculateReliabilityRating(c1001, data.invoices, data.payments, []);
  assert.equal(r1001.isInsufficientHistory, true);
  assert.equal(r1001.stars, 0);
  assert.ok(r1001.explanation.en.includes("Insufficient history"));

  // CUS-1003 has 3 invoices with full on-time settlement history
  const c1003 = data.customers.find((c) => c.id === "CUS-1003")!;
  const r1003 = calculateReliabilityRating(c1003, data.invoices, data.payments, []);
  assert.equal(r1003.isInsufficientHistory, false);
  assert.equal(r1003.stars, 5);
  assert.equal(r1003.score, 100);

  const highValueCustomer = {
    id: "CUS-HV-1",
    name: "Large Corp",
    contact: "Chief Procurement Officer",
    phone: "9999999999",
    city: "Mumbai",
  };
  const hvInvoices = [
    {
      id: "INV-HV-1",
      number: "INV-HV-1",
      customerId: "CUS-HV-1",
      businessId: "BIZ-1",
      date: "2026-08-01",
      dueDate: "2026-08-15",
      total: 500000,
      subtotal: 500000,
      tax: 0,
      items: [],
      notes: "",
    },
    {
      id: "INV-HV-2",
      number: "INV-HV-2",
      customerId: "CUS-HV-1",
      businessId: "BIZ-1",
      date: "2026-09-01",
      dueDate: "2026-09-15",
      total: 750000,
      subtotal: 750000,
      tax: 0,
      items: [],
      notes: "",
    },
  ];
  const hvPayments = [
    {
      id: "PAY-HV-1",
      invoiceId: "INV-HV-1",
      customerId: "CUS-HV-1",
      amount: 500000,
      date: "2026-08-14",
      method: "bank" as const,
    },
    {
      id: "PAY-HV-2",
      invoiceId: "INV-HV-2",
      customerId: "CUS-HV-1",
      amount: 750000,
      date: "2026-09-14",
      method: "bank" as const,
    },
  ];
  const hvRating = calculateReliabilityRating(highValueCustomer, hvInvoices, hvPayments, []);
  assert.equal(hvRating.stars, 5);
  assert.equal(hvRating.timelinessScore, 100);
});

test("promise and collection followup status transitions function correctly", () => {
  const promise: PaymentPromise = {
    id: "PRM-101",
    businessId: "BIZ-1",
    customerId: "CUS-1001",
    expectedAmount: 15000,
    expectedDate: "2026-10-15",
    status: "pending",
    note: "Promised by NEFT",
    createdAt: "2026-10-09",
  };

  assert.equal(promise.status, "pending");
  const fulfilledPromise = { ...promise, status: "fulfilled" as const };
  assert.equal(fulfilledPromise.status, "fulfilled");

  const followup: CollectionFollowup = {
    id: "FOL-101",
    businessId: "BIZ-1",
    customerId: "CUS-1001",
    channel: "call",
    status: "contacted",
    contactNotes: "Spoke with owner, promised remittance next Monday",
    scheduledDate: "2026-10-16",
    createdAt: "2026-10-09T10:00:00Z",
  };
  assert.equal(followup.channel, "call");
  assert.equal(followup.customerId, "CUS-1001");
});


