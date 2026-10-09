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
  ask(question: string, language: Language, promptId?: PromptId): Promise<Message>;
}

export interface IActionService {
  getActions(): Promise<ActionItem[]>;
  createAction(insightId: string, note?: string): Promise<ActionItem>;
  completeAction(id: string): Promise<void>;
}

export interface INotificationService {
  send(channel: "in_app" | "whatsapp" | "email" | "sms", recipient: string, message: string): Promise<boolean>;
}

export interface IJobService {
  dispatchJob(jobName: string, payload: Record<string, unknown>): Promise<string>;
  getJobStatus(jobId: string): Promise<"queued" | "processing" | "completed" | "failed">;
}
