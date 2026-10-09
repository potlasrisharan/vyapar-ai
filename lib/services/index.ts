import type {
  AuditLogEntry,
  BackgroundJob,
  EmailThread,
  Language,
  VoiceToolResult,
} from "@/lib/types";
import { eventBus } from "@/lib/domain/events";
import { customers, invoices } from "@/lib/mock/seed";
import type {
  IAuditService,
  IEmailService,
  IJobService,
  INotificationService,
  IVoiceService,
} from "./contracts";

export { businessService } from "@/lib/mock/business";
export { assistantService } from "@/lib/mock/assistant";
export { knowledgeService, POSTGRES_SCHEMA_SQL } from "@/lib/domain/knowledge";
export { aiRouter } from "@/lib/domain/ai-router";
export { eventBus } from "@/lib/domain/events";
export { config } from "@/lib/config";
export * from "./contracts";

// ---------------------------------------------------------------------
// 1. Audit Service Implementation (R29)
// ---------------------------------------------------------------------
class MemoryAuditService implements IAuditService {
  private logs: AuditLogEntry[] = [
    {
      id: "AUD-001",
      businessId: "BIZ-1",
      timestamp: "2026-09-01T09:00:00Z",
      action: "BusinessProfileRegistered",
      actor: "Owner (Ramesh Sharma)",
      entityType: "business",
      entityId: "BIZ-1",
      details: "Sharma Electronics onboarded with GSTIN 09AABCU9603R1ZM in Kanpur, UP.",
    },
    {
      id: "AUD-002",
      businessId: "BIZ-1",
      timestamp: "2026-09-23T11:30:00Z",
      action: "InvoiceIssued",
      actor: "Billing System",
      entityType: "invoice",
      entityId: "INV-1023",
      details: "Invoice INV-1023 for ₹35,000 issued to ABC Traders (Due 23 Sept).",
    },
    {
      id: "AUD-003",
      businessId: "BIZ-1",
      timestamp: "2026-09-24T00:00:00Z",
      action: "InvoiceOverdueDetected",
      actor: "Deterministic Engine",
      entityType: "invoice",
      entityId: "INV-1023",
      details: "INV-1023 crossed payment deadline without settlement. Marked overdue.",
    },
    {
      id: "AUD-004",
      businessId: "BIZ-1",
      timestamp: "2026-09-30T17:00:00Z",
      action: "InventoryReconciled",
      actor: "Stock Parser",
      entityType: "product",
      entityId: "PRD-1",
      details: "Dell 24-inch Monitor dipped below reorder point (8 units in stock, threshold 15).",
    },
    {
      id: "AUD-005",
      businessId: "BIZ-1",
      timestamp: "2026-10-01T10:15:00Z",
      action: "ExpenseAnomalyDetected",
      actor: "Financial Auditor AI",
      entityType: "expense",
      entityId: "EXP-6",
      details: "September electricity bill of ₹24,500 identified with +24% month-over-month spike.",
    },
    {
      id: "AUD-006",
      businessId: "BIZ-1",
      timestamp: "2026-10-05T08:00:00Z",
      action: "DailyPrioritiesComputed",
      actor: "VyaparAI Prioritization Engine",
      entityType: "insight",
      entityId: "INS-1",
      details: "Top action generated: Follow up with ABC Traders for ₹35,000 overdue receivable.",
    },
  ];

  constructor() {
    // Automatically wire domain events to audit trail
    eventBus.subscribe("DocumentUploaded", (evt) => {
      void this.log({
        businessId: evt.businessId,
        action: "DocumentUploaded",
        actor: "User",
        entityType: "document",
        entityId: (evt.payload as { documentId?: string })?.documentId || "DOC-UP",
        details: "New business document uploaded to pipeline.",
      });
    });

    eventBus.subscribe("ActionCreated", (evt) => {
      void this.log({
        businessId: evt.businessId,
        action: "ActionCreated",
        actor: "Owner",
        entityType: "action",
        entityId: (evt.payload as { actionId?: string })?.actionId || "ACT-NEW",
        details: (evt.payload as { note?: string })?.note || "Business owner scheduled a follow-up action.",
      });
    });

    eventBus.subscribe("NotificationDispatched", (evt) => {
      void this.log({
        businessId: evt.businessId,
        action: "NotificationDispatched",
        actor: "VyaparAI System",
        entityType: "notification",
        entityId: (evt.payload as { recipient?: string })?.recipient || "N/A",
        details: `Dispatched message via ${(evt.payload as { channel?: string })?.channel || "channel"}.`,
        channel: (evt.payload as { channel?: string })?.channel,
      });
    });
  }

  async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(fullEntry);
    return fullEntry;
  }

  async getLogs(businessId = "BIZ-1"): Promise<AuditLogEntry[]> {
    return this.logs.filter((l) => l.businessId === businessId);
  }
}

export const auditService = new MemoryAuditService();

// ---------------------------------------------------------------------
// 2. Email Service Implementation (R27)
// ---------------------------------------------------------------------
class MockEmailService implements IEmailService {
  private threads: EmailThread[] = [
    {
      id: "EML-TH-01",
      subject: "Overdue Invoice #INV-1023 — Payment Status Update",
      participant: "amit@abctraders.in",
      category: "customer",
      lastMessageDate: "2026-10-04T14:20:00Z",
      messages: [
        {
          id: "msg-101",
          from: "sharma.electronics.kanpur@gmail.com",
          to: "amit@abctraders.in",
          subject: "Overdue Invoice #INV-1023 — Payment Status Update",
          body: "Dear Amit ji, Invoice #INV-1023 of ₹35,000 for Samsung Smart TV was due on 23 Sept. Please let us know the transfer details.",
          date: "2026-10-02T10:00:00Z",
          unread: false,
          relatedEntityId: "INV-1023",
        },
        {
          id: "msg-102",
          from: "amit@abctraders.in",
          to: "sharma.electronics.kanpur@gmail.com",
          subject: "Re: Overdue Invoice #INV-1023 — Payment Status Update",
          body: "Namaste Ramesh ji. We had a delay with our festival inventory dispatch. We will release RTGS of ₹35,000 this Friday by 3 PM.",
          date: "2026-10-04T14:20:00Z",
          unread: true,
          relatedEntityId: "INV-1023",
        },
      ],
    },
    {
      id: "EML-TH-02",
      subject: "Dispatch Advice: Purchase Order #PO-301 (Monitors)",
      participant: "orders@techline.in",
      category: "vendor",
      lastMessageDate: "2026-10-03T09:15:00Z",
      messages: [
        {
          id: "msg-201",
          from: "orders@techline.in",
          to: "sharma.electronics.kanpur@gmail.com",
          subject: "Dispatch Advice: Purchase Order #PO-301 (Monitors)",
          body: "Consignment of 20 units Dell 24-inch Monitors has been dispatched via Kanpur Logistics (LR #KP-90218). Expected delivery tomorrow morning.",
          date: "2026-10-03T09:15:00Z",
          unread: false,
          relatedEntityId: "PRD-1",
        },
      ],
    },
    {
      id: "EML-TH-03",
      subject: "UPPCL Commercial Tariff Advisory - September 2026",
      participant: "billing@uppcl.org",
      category: "billing",
      lastMessageDate: "2026-09-28T11:00:00Z",
      messages: [
        {
          id: "msg-301",
          from: "billing@uppcl.org",
          to: "sharma.electronics.kanpur@gmail.com",
          subject: "UPPCL Commercial Tariff Advisory - September 2026",
          body: "Consumer No. 09182371: Peak summer surcharge of ₹4,742 applied to September commercial bill due to load exceeding 5kW sanctioned capacity.",
          date: "2026-09-28T11:00:00Z",
          unread: false,
          relatedEntityId: "EXP-6",
        },
      ],
    },
  ];

  async searchEmails(query: string, businessId = "BIZ-1"): Promise<EmailThread[]> {
    void businessId;
    const q = query.toLowerCase();
    return this.threads.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.participant.toLowerCase().includes(q) ||
        t.messages.some((m) => m.body.toLowerCase().includes(q))
    );
  }

  async getThread(id: string): Promise<EmailThread | undefined> {
    return this.threads.find((t) => t.id === id);
  }

  async draftReply(threadId: string, intent: string, language: Language): Promise<string> {
    const thread = await this.getThread(threadId);
    const participantName = thread?.participant.split("@")[0] || "Customer";

    if (language === "hi") {
      return `नमस्ते ${participantName} जी, Sharma Electronics से संपर्क करने के लिए धन्यवाद। आपके ईमेल के अनुसार हम शुक्रवार 3 बजे तक भुगतान की प्रतीक्षा करेंगे। कृपया भुगतान के बाद UTR नंबर साझा करें।`;
    }
    if (language === "hinglish") {
      return `Namaste ${participantName} ji, Sharma Electronics se connect karne ke liye shukriya. Aapke email ke according hum Friday 3 PM tak payment ka wait karenge. Please payment ke baad UTR number share karein.`;
    }
    return `Dear ${participantName}, Thank you for your update. Sharma Electronics will await your RTGS settlement by Friday 3:00 PM. Kindly reply with the bank UTR reference once processed.`;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    await eventBus.emit({
      type: "NotificationDispatched",
      businessId: "BIZ-1",
      payload: { channel: "email", recipient: to, subject, bodyLength: body.length },
    });
    return true;
  }
}

export const emailService = new MockEmailService();

// ---------------------------------------------------------------------
// 3. Notification Service Implementation (R28)
// ---------------------------------------------------------------------
class MultiChannelNotificationService implements INotificationService {
  async send(
    channel: "in_app" | "whatsapp" | "email" | "sms" | "push",
    recipient: string,
    message: string
  ): Promise<boolean> {
    await eventBus.emit({
      type: "NotificationDispatched",
      businessId: "BIZ-1",
      payload: { channel, recipient, message },
    });
    return true;
  }
}

export const notificationService = new MultiChannelNotificationService();

// ---------------------------------------------------------------------
// 4. Voice Service & Business Tools Pipeline (Voice Feature)
// ---------------------------------------------------------------------
class UnifiedVoiceService implements IVoiceService {
  async transcribe(audioBlob: Blob, languageCode = "hi-IN"): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");
      formData.append("language_code", languageCode);
      const res = await fetch("/api/ai/voice/stt", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        return json.transcript || "";
      }
    } catch {
      // Local fallback
    }
    return "Aaj Sharma Electronics ke sabse bade overdue bill kaunse hain?";
  }

  async synthesize(text: string, languageCode = "hi-IN", speaker = "aditya"): Promise<string> {
    try {
      const res = await fetch("/api/ai/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, languageCode, speaker }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.audio || "";
      }
    } catch {
      // Fallback
    }
    return "";
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<VoiceToolResult> {
    switch (toolName) {
      case "get_outstanding_balance": {
        return {
          tool: toolName,
          output: "Total receivables: ₹82,000. Top unpaid invoices: ABC Traders (₹35,000, 12 days overdue) and Rahul Traders (₹48,000, 14 days overdue).",
        };
      }
      case "get_customer": {
        const query = String(args.query || args.name || "").toLowerCase();
        const match = customers.find((c) => c.name.toLowerCase().includes(query) || c.contact.toLowerCase().includes(query));
        if (match) {
          return {
            tool: toolName,
            output: `Customer ${match.name} in ${match.city}, Contact: ${match.contact} (${match.phone}).`,
          };
        }
        return { tool: toolName, output: `Customer "${args.query}" not found in current ledger.` };
      }
      case "get_invoice": {
        const id = String(args.id || "");
        const inv = invoices.find((i) => i.id.toLowerCase() === id.toLowerCase());
        if (inv) {
          return {
            tool: toolName,
            output: `Invoice ${inv.id}: Total ₹${inv.total.toLocaleString("en-IN")}, Due Date ${inv.dueDate}, Items: ${inv.items.length}.`,
          };
        }
        return { tool: toolName, output: `Invoice "${id}" not found.` };
      }
      case "record_payment_promise": {
        const { customerId, amount, promisedDate } = args;
        await eventBus.emit({
          type: "PaymentPromiseRecorded",
          businessId: "BIZ-1",
          payload: { customerId, amount, promisedDate },
        });
        return {
          tool: toolName,
          output: `Recorded payment commitment of ₹${amount} by ${promisedDate} for customer ${customerId}.`,
        };
      }
      case "create_followup": {
        const { targetId, note } = args;
        await eventBus.emit({
          type: "ActionCreated",
          businessId: "BIZ-1",
          payload: { actionId: `ACT-${Date.now()}`, targetId, note: String(note || "Voice follow-up") },
        });
        return {
          tool: toolName,
          output: `Follow-up action scheduled for target ${targetId}: "${note}".`,
        };
      }
      default:
        return { tool: toolName, output: `Unrecognized voice tool "${toolName}".` };
    }
  }
}

export const voiceService = new UnifiedVoiceService();

// ---------------------------------------------------------------------
// 5. Background Jobs Engine Implementation (R41)
// ---------------------------------------------------------------------
class LocalBackgroundJobService implements IJobService {
  private jobs = new Map<string, BackgroundJob>();

  async dispatchJob(jobName: string, payload: Record<string, unknown>): Promise<string> {
    const jobId = `JOB-${crypto.randomUUID().slice(0, 8)}`;
    const job: BackgroundJob = {
      id: jobId,
      name: jobName as BackgroundJob["name"],
      status: "processing",
      payload,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);

    // Simulate async processing without blocking caller
    setTimeout(() => {
      const activeJob = this.jobs.get(jobId);
      if (activeJob) {
        activeJob.status = "completed";
        activeJob.completedAt = new Date().toISOString();
      }
    }, 1200);

    return jobId;
  }

  async getJobStatus(jobId: string): Promise<"queued" | "processing" | "completed" | "failed"> {
    return this.jobs.get(jobId)?.status || "completed";
  }
}

export const jobService = new LocalBackgroundJobService();

