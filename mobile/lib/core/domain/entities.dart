// lib/core/domain/entities.dart
// Mirror of web/lib/types/index.ts — single source of truth for domain model

enum Language { en, hi, hinglish }

typedef Localized = Map<Language, String>;

extension LocalizedExt on Localized {
  String get(Language lang) => this[lang] ?? this[Language.en] ?? '';
}

enum AppRoute {
  overview,
  documents,
  invoices,
  payments,
  customers,
  vendors,
  inventory,
  expenses,
  insights,
  assistant,
  settings,
}

// ── Business ─────────────────────────────────────────────────────────────────

class Business {
  const Business({
    required this.id,
    required this.name,
    required this.owner,
    required this.city,
    required this.state,
    required this.type,
    required this.demoDate,
    required this.reportingMonth,
    this.gstin,
    this.pan,
    this.currency,
    this.preferredLanguage,
  });

  final String id;
  final String name;
  final String owner;
  final String city;
  final String state;
  final String type;
  final String demoDate;
  final String reportingMonth;
  final String? gstin;
  final String? pan;
  final String? currency;
  final Language? preferredLanguage;
}

// ── Customer ──────────────────────────────────────────────────────────────────

class Customer {
  const Customer({
    required this.id,
    required this.name,
    required this.contact,
    required this.phone,
    required this.city,
    this.gstin,
    this.email,
  });

  final String id;
  final String name;
  final String contact;
  final String phone;
  final String city;
  final String? gstin;
  final String? email;
}

// ── Vendor ────────────────────────────────────────────────────────────────────

class Vendor {
  const Vendor({
    required this.id,
    required this.name,
    required this.category,
    required this.city,
    this.gstin,
    this.phone,
    this.email,
  });

  final String id;
  final String name;
  final String category;
  final String city;
  final String? gstin;
  final String? phone;
  final String? email;
}

// ── Product / Inventory ───────────────────────────────────────────────────────

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.category,
    required this.price,
    required this.stock,
    required this.reorderLevel,
    required this.dailySales,
    required this.vendorId,
    this.hsnCode,
  });

  final String id;
  final String name;
  final String sku;
  final String category;
  final double price;
  final int stock;
  final int reorderLevel;
  final double dailySales;
  final String vendorId;
  final String? hsnCode;

  bool get isLowStock => stock <= reorderLevel;
}

// ── Invoice ───────────────────────────────────────────────────────────────────

class InvoiceItem {
  const InvoiceItem({
    required this.productId,
    required this.quantity,
    required this.unitPrice,
    required this.gross,
    required this.subtotal,
    required this.tax,
    this.hsnCode,
    this.cgst,
    this.sgst,
    this.igst,
  });

  final String productId;
  final int quantity;
  final double unitPrice;
  final double gross;
  final double subtotal;
  final double tax;
  final String? hsnCode;
  final double? cgst;
  final double? sgst;
  final double? igst;
}

enum InvoiceStatus { paid, pending, overdue }

class Invoice {
  const Invoice({
    required this.id,
    required this.customerId,
    required this.date,
    required this.dueDate,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.total,
    this.gstin,
    this.cgst,
    this.sgst,
    this.igst,
    this.status,
  });

  final String id;
  final String customerId;
  final String date;
  final String dueDate;
  final List<InvoiceItem> items;
  final double subtotal;
  final double tax;
  final double total;
  final String? gstin;
  final double? cgst;
  final double? sgst;
  final double? igst;
  final InvoiceStatus? status;
}

// ── Payment ───────────────────────────────────────────────────────────────────

enum PaymentMethod { upi, bank, cash }

class Payment {
  const Payment({
    required this.id,
    required this.invoiceId,
    required this.customerId,
    required this.amount,
    required this.date,
    required this.method,
    this.referenceNumber,
  });

  final String id;
  final String invoiceId;
  final String customerId;
  final double amount;
  final String date;
  final PaymentMethod method;
  final String? referenceNumber;
}

// ── Expense ───────────────────────────────────────────────────────────────────

enum ExpenseCategory {
  inventory,
  electricity,
  rent,
  transport,
  salaries,
  marketing,
  other,
}

class Expense {
  const Expense({
    required this.id,
    required this.name,
    required this.category,
    required this.amount,
    required this.date,
    required this.documentId,
    this.vendorId,
    this.gstPaid,
  });

  final String id;
  final Localized name;
  final ExpenseCategory category;
  final double amount;
  final String date;
  final String documentId;
  final String? vendorId;
  final double? gstPaid;
}

// ── Document ──────────────────────────────────────────────────────────────────

enum DocumentType { invoice, purchase, expense, inventory, statement, profile }
enum DocumentFormat { pdf, jpg, png, csv, xlsx }
enum DocumentStatus { completed, review }

class AppDocument {
  const AppDocument({
    required this.id,
    required this.name,
    required this.type,
    required this.format,
    required this.status,
    required this.uploaded,
    required this.insightIds,
    this.relatedId,
    this.extractedData,
    this.confidenceScore,
  });

  final String id;
  final String name;
  final DocumentType type;
  final DocumentFormat format;
  final DocumentStatus status;
  final String uploaded;
  final List<String> insightIds;
  final String? relatedId;
  final Map<String, dynamic>? extractedData;
  final double? confidenceScore;
}

// ── Insight ───────────────────────────────────────────────────────────────────

enum InsightCategory { financial, inventory, operations, opportunities }
enum InsightPriority { high, medium, low }
enum InsightAction { followup, purchase, review, upload }
enum InsightStatus { open, handled, dismissed }

class Insight {
  const Insight({
    required this.id,
    required this.category,
    required this.priority,
    required this.title,
    required this.summary,
    required this.why,
    required this.recommendation,
    required this.evidenceIds,
    required this.action,
    required this.targetId,
    this.impactAmount,
  });

  final String id;
  final InsightCategory category;
  final InsightPriority priority;
  final Localized title;
  final Localized summary;
  final Localized why;
  final Localized recommendation;
  final List<String> evidenceIds;
  final InsightAction action;
  final String targetId;
  final double? impactAmount;
}

// ── Message / Conversation ────────────────────────────────────────────────────

enum MessageRole { user, assistant }
enum PromptId { today, owes, expenses, stock, summary, unknown }

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.text,
    required this.evidenceIds,
    required this.createdAt,
    this.promptId,
    this.provider,
    this.isGrounded = false,
  });

  final String id;
  final MessageRole role;
  final String text;
  final List<String> evidenceIds;
  final DateTime createdAt;
  final PromptId? promptId;
  final String? provider;
  final bool isGrounded;
}

class Conversation {
  const Conversation({required this.id, required this.messages});
  final String id;
  final List<ChatMessage> messages;
}

// ── Action Item ───────────────────────────────────────────────────────────────

enum ActionStatus { open, completed }
enum NotificationChannel { whatsapp, email, sms, inApp }

class ActionItem {
  const ActionItem({
    required this.id,
    required this.insightId,
    required this.kind,
    required this.status,
    required this.createdAt,
    required this.note,
    this.channel,
    this.draftMessage,
    this.recipientContact,
    this.recipientName,
  });

  final String id;
  final String insightId;
  final InsightAction kind;
  final ActionStatus status;
  final DateTime createdAt;
  final String note;
  final NotificationChannel? channel;
  final String? draftMessage;
  final String? recipientContact;
  final String? recipientName;
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

class BusinessData {
  const BusinessData({
    required this.business,
    required this.customers,
    required this.vendors,
    required this.products,
    required this.invoices,
    required this.payments,
    required this.expenses,
    required this.documents,
    required this.insights,
  });

  final Business business;
  final List<Customer> customers;
  final List<Vendor> vendors;
  final List<Product> products;
  final List<Invoice> invoices;
  final List<Payment> payments;
  final List<Expense> expenses;
  final List<AppDocument> documents;
  final List<Insight> insights;

  BusinessData copyWith({
    Business? business,
    List<Customer>? customers,
    List<Vendor>? vendors,
    List<Product>? products,
    List<Invoice>? invoices,
    List<Payment>? payments,
    List<Expense>? expenses,
    List<AppDocument>? documents,
    List<Insight>? insights,
  }) =>
      BusinessData(
        business: business ?? this.business,
        customers: customers ?? this.customers,
        vendors: vendors ?? this.vendors,
        products: products ?? this.products,
        invoices: invoices ?? this.invoices,
        payments: payments ?? this.payments,
        expenses: expenses ?? this.expenses,
        documents: documents ?? this.documents,
        insights: insights ?? this.insights,
      );
}
