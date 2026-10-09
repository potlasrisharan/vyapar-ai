import type {
  Business,
  BusinessData,
  Customer,
  Document,
  Expense,
  Insight,
  Invoice,
  Language,
  Message,
  Payment,
  Product,
  PromptId,
  Vendor,
  ActionItem,
} from "@/lib/types";

export interface IBusinessService {
  getProfile(): Promise<Business>;
  load(): Promise<BusinessData>;
}

export interface IInvoiceService {
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getOverdue(): Promise<Invoice[]>;
}

export interface IPaymentService {
  getPayments(): Promise<Payment[]>;
  getPaymentsForInvoice(invoiceId: string): Promise<Payment[]>;
  getPaymentsForCustomer(customerId: string): Promise<Payment[]>;
}

export interface ICustomerService {
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
}

export interface IVendorService {
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
}

export interface IInventoryService {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getLowStock(): Promise<Product[]>;
}

export interface IExpenseService {
  getExpenses(): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
}

export interface IDocumentService {
  getDocuments(): Promise<Document[]>;
  upload(file: File): Promise<Document>;
}

export interface IInsightService {
  getInsights(): Promise<Insight[]>;
  getPriorities(): Promise<Insight[]>;
}

export interface IAssistantService {
  ask(question: string, language: Language, promptId?: PromptId, context?: Record<string, unknown>): Promise<Message>;
}

export interface IActionService {
  getActions(): Promise<ActionItem[]>;
  createAction(insightId: string, note?: string): Promise<ActionItem>;
  completeAction(id: string): Promise<void>;
}

export interface INotificationService {
  send(channel: "in_app" | "whatsapp" | "email" | "sms" | "push", recipient: string, message: string): Promise<boolean>;
}

export interface IJobService {
  dispatchJob(jobName: string, payload: Record<string, unknown>): Promise<string>;
  getJobStatus(jobId: string): Promise<"queued" | "processing" | "completed" | "failed">;
}

export interface IEmailService {
  searchEmails(query: string, businessId?: string): Promise<import("@/lib/types").EmailThread[]>;
  getThread(id: string): Promise<import("@/lib/types").EmailThread | undefined>;
  draftReply(threadId: string, intent: string, language: Language): Promise<string>;
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

export interface IVoiceService {
  transcribe(audioBlob: Blob, languageCode?: string): Promise<string>;
  synthesize(text: string, languageCode?: string, speaker?: string): Promise<string>;
  executeTool(toolName: string, args: Record<string, unknown>): Promise<import("@/lib/types").VoiceToolResult>;
}

export interface IAuditService {
  log(entry: Omit<import("@/lib/types").AuditLogEntry, "id" | "timestamp">): Promise<import("@/lib/types").AuditLogEntry>;
  getLogs(businessId?: string): Promise<import("@/lib/types").AuditLogEntry[]>;
}

