export type Language = "en" | "hi" | "hinglish";
export type Localized = Record<Language, string>;
export type Route = "overview" | "documents" | "invoices" | "payments" | "customers" | "vendors" | "inventory" | "expenses" | "insights" | "assistant" | "settings";
export interface Business { id: string; name: string; owner: string; city: string; state: string; type: string; demoDate: string; reportingMonth: string }
export interface Customer { id: string; name: string; contact: string; phone: string; city: string }
export interface Vendor { id: string; name: string; category: string; city: string }
export interface Product { id: string; name: string; sku: string; category: string; price: number; stock: number; reorderLevel: number; dailySales: number; vendorId: string }
export interface InvoiceItem { productId: string; quantity: number; unitPrice: number; gross: number; subtotal: number; tax: number }
export interface Invoice { id: string; customerId: string; date: string; dueDate: string; items: InvoiceItem[]; subtotal: number; tax: number; total: number }
export interface Payment { id: string; invoiceId: string; customerId: string; amount: number; date: string; method: "upi" | "bank" | "cash" }
export type ExpenseCategory = "inventory" | "electricity" | "rent" | "transport" | "salaries" | "marketing" | "other";
export interface Expense { id: string; name: Localized; category: ExpenseCategory; amount: number; date: string; vendorId?: string; documentId: string }
export interface PurchaseBill { id: string; vendorId: string; date: string; total: number; paid: number; expenseId: string }
export interface Document { id: string; name: string; type: "invoice" | "purchase" | "expense" | "inventory" | "statement"; format: "PDF" | "JPG" | "PNG" | "CSV" | "XLSX"; status: "completed" | "review"; uploaded: string; insightIds: string[]; relatedId?: string }
export interface Evidence { id: string; type: "invoice" | "inventory" | "expense" | "document"; entityId: string; documentId?: string; label: string }
export type InsightCategory = "financial" | "inventory" | "operations" | "opportunities";
export interface Insight { id: string; category: InsightCategory; priority: "high" | "medium" | "low"; title: Localized; summary: Localized; why: Localized; recommendation: Localized; evidenceIds: string[]; action: "followup" | "purchase" | "review" | "upload"; targetId: string }
export type InsightStatus = "open" | "handled" | "dismissed";
export type PromptId = "today" | "owes" | "expenses" | "stock" | "summary" | "unknown";
export interface Message { id: string; role: "user" | "assistant"; text: string; promptId?: PromptId; evidenceIds: string[]; createdAt: string }
export interface Conversation { id: string; messages: Message[] }
export interface AIModel { id: string; task: "document" | "reasoning" | "language"; provider: string; mode: "mock"; connected: false }
export interface ActionItem { id: string; insightId: string; kind: Insight["action"]; status: "open" | "completed"; createdAt: string; note: string }
export interface BusinessData { business: Business; customers: Customer[]; vendors: Vendor[]; products: Product[]; invoices: Invoice[]; payments: Payment[]; expenses: Expense[]; purchaseBills: PurchaseBill[]; documents: Document[]; insights: Insight[]; evidence: Evidence[] }
export interface LocalState { language: Language; insightStatuses: Record<string, InsightStatus>; actions: ActionItem[]; uploadedDocuments: Document[]; conversations: Conversation[] }
export interface BusinessService { load(): Promise<BusinessData> }
export interface AssistantService { ask(question: string, language: Language, promptId?: PromptId): Promise<Message> }
