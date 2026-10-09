// lib/core/services/mock_data.dart
// Dart mirror of web/lib/mock/*.ts — same business scenario (Sharma Electronics)

import '../domain/entities.dart';

const mockBusinessData = BusinessData(
  business: Business(
    id: 'BIZ-1',
    name: 'Sharma Electronics',
    owner: 'Rajesh Sharma',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    type: 'Electronics Retail',
    demoDate: '1 October 2026',
    reportingMonth: 'September 2026',
    gstin: '09ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    currency: 'INR',
    preferredLanguage: Language.hinglish,
  ),

  customers: [
    Customer(id: 'CUST-1', name: 'Rahul Traders', contact: 'Rahul Gupta', phone: '9876543210', city: 'Kanpur'),
    Customer(id: 'CUST-2', name: 'ABC Electronics', contact: 'Amit Bajaj', phone: '9871234560', city: 'Lucknow'),
    Customer(id: 'CUST-3', name: 'Kumar General Store', contact: 'Suresh Kumar', phone: '9812345678', city: 'Kanpur'),
    Customer(id: 'CUST-4', name: 'Verma Wholesale', contact: 'Pradeep Verma', phone: '9867452310', city: 'Agra'),
    Customer(id: 'CUST-5', name: 'Singh Enterprises', contact: 'Harinder Singh', phone: '9834567890', city: 'Varanasi'),
    Customer(id: 'CUST-6', name: 'Patel Trading Co.', contact: 'Vivek Patel', phone: '9823456789', city: 'Kanpur'),
  ],

  vendors: [
    Vendor(id: 'VEN-1', name: 'Samsung India Ltd.', category: 'Electronics', city: 'Delhi', gstin: '07SAMSU1234A1Z1'),
    Vendor(id: 'VEN-2', name: 'LG Electronics India', category: 'Electronics', city: 'Pune', gstin: '27LGELE5678B2Z2'),
    Vendor(id: 'VEN-3', name: 'Havells India Ltd.', category: 'Electrical', city: 'Noida', gstin: '09HAVEL3456C3Z3'),
    Vendor(id: 'VEN-4', name: 'Bajaj Electricals', category: 'Electrical', city: 'Mumbai', gstin: '27BAJAJ2345D4Z4'),
    Vendor(id: 'VEN-5', name: 'UPPCL', category: 'Utility', city: 'Lucknow'),
  ],

  products: [
    Product(id: 'PRD-1', name: 'Samsung 43" 4K TV', sku: 'SAM-TV-43', category: 'Television', price: 38000, stock: 4, reorderLevel: 5, dailySales: 0.5, vendorId: 'VEN-1'),
    Product(id: 'PRD-2', name: 'LG 1.5T Split AC', sku: 'LG-AC-1.5', category: 'Air Conditioner', price: 42000, stock: 3, reorderLevel: 3, dailySales: 0.3, vendorId: 'VEN-2'),
    Product(id: 'PRD-3', name: 'Havells Ceiling Fan', sku: 'HAV-FAN-4', category: 'Fan', price: 3200, stock: 12, reorderLevel: 15, dailySales: 1.2, vendorId: 'VEN-3'),
    Product(id: 'PRD-4', name: 'Bajaj Mixer Grinder', sku: 'BAJ-MG-3', category: 'Kitchen', price: 2800, stock: 8, reorderLevel: 10, dailySales: 0.8, vendorId: 'VEN-4'),
    Product(id: 'PRD-5', name: 'Samsung Washing Machine', sku: 'SAM-WM-7', category: 'Washing Machine', price: 28000, stock: 2, reorderLevel: 3, dailySales: 0.2, vendorId: 'VEN-1'),
    Product(id: 'PRD-6', name: 'LG Refrigerator 260L', sku: 'LG-RF-260', category: 'Refrigerator', price: 24000, stock: 5, reorderLevel: 4, dailySales: 0.4, vendorId: 'VEN-2'),
  ],

  invoices: [
    Invoice(
      id: 'INV-1038',
      customerId: 'CUST-1',
      date: '2026-09-14',
      dueDate: '2026-09-28',
      items: [InvoiceItem(productId: 'PRD-1', quantity: 1, unitPrice: 38000, gross: 38000, subtotal: 38000, tax: 6840, cgst: 3420, sgst: 3420)],
      subtotal: 38000,
      tax: 6840,
      total: 44840,
      status: InvoiceStatus.overdue,
    ),
    Invoice(
      id: 'INV-1039',
      customerId: 'CUST-2',
      date: '2026-09-20',
      dueDate: '2026-10-04',
      items: [InvoiceItem(productId: 'PRD-3', quantity: 3, unitPrice: 3200, gross: 9600, subtotal: 9600, tax: 480, cgst: 240, sgst: 240)],
      subtotal: 9600,
      tax: 480,
      total: 10080,
      status: InvoiceStatus.pending,
    ),
    Invoice(
      id: 'INV-1040',
      customerId: 'CUST-3',
      date: '2026-09-22',
      dueDate: '2026-10-06',
      items: [InvoiceItem(productId: 'PRD-4', quantity: 2, unitPrice: 2800, gross: 5600, subtotal: 5600, tax: 280, cgst: 140, sgst: 140)],
      subtotal: 5600,
      tax: 280,
      total: 5880,
      status: InvoiceStatus.paid,
    ),
    Invoice(
      id: 'INV-1041',
      customerId: 'CUST-1',
      date: '2026-09-01',
      dueDate: '2026-09-15',
      items: [InvoiceItem(productId: 'PRD-5', quantity: 1, unitPrice: 28000, gross: 28000, subtotal: 28000, tax: 5040, cgst: 2520, sgst: 2520)],
      subtotal: 28000,
      tax: 5040,
      total: 33040,
      status: InvoiceStatus.overdue,
    ),
    Invoice(
      id: 'INV-1042',
      customerId: 'CUST-4',
      date: '2026-09-25',
      dueDate: '2026-10-09',
      items: [InvoiceItem(productId: 'PRD-6', quantity: 2, unitPrice: 24000, gross: 48000, subtotal: 48000, tax: 8640, cgst: 4320, sgst: 4320)],
      subtotal: 48000,
      tax: 8640,
      total: 56640,
      status: InvoiceStatus.pending,
    ),
  ],

  payments: [
    Payment(id: 'PAY-1', invoiceId: 'INV-1040', customerId: 'CUST-3', amount: 5880, date: '2026-09-29', method: PaymentMethod.upi, referenceNumber: 'UPI2026092901234'),
    Payment(id: 'PAY-2', invoiceId: 'INV-1039', customerId: 'CUST-2', amount: 5040, date: '2026-09-25', method: PaymentMethod.bank, referenceNumber: 'NEFT20260925ABC'),
  ],

  expenses: [
    Expense(
      id: 'EXP-1',
      name: {Language.en: 'Samsung TV Stock Purchase', Language.hi: 'सैमसंग टीवी स्टॉक खरीदारी', Language.hinglish: 'Samsung TV Stock Purchase'},
      category: ExpenseCategory.inventory,
      amount: 152000,
      date: '2026-09-05',
      documentId: 'DOC-PURCHASE-1',
      vendorId: 'VEN-1',
    ),
    Expense(
      id: 'EXP-2',
      name: {Language.en: 'Shop Rent - September', Language.hi: 'दुकान किराया - सितंबर', Language.hinglish: 'Shop Rent - September'},
      category: ExpenseCategory.rent,
      amount: 18000,
      date: '2026-09-01',
      documentId: 'DOC-RENT-1',
    ),
    Expense(
      id: 'EXP-3',
      name: {Language.en: 'Staff Salaries', Language.hi: 'स्टाफ वेतन', Language.hinglish: 'Staff Salaries'},
      category: ExpenseCategory.salaries,
      amount: 42000,
      date: '2026-09-30',
      documentId: 'DOC-SAL-1',
    ),
    Expense(
      id: 'EXP-4',
      name: {Language.en: 'Electricity Bill', Language.hi: 'बिजली बिल', Language.hinglish: 'Electricity Bill'},
      category: ExpenseCategory.electricity,
      amount: 8742,
      date: '2026-09-28',
      documentId: 'DOC-ELEC-1',
      vendorId: 'VEN-5',
    ),
  ],

  documents: [
    AppDocument(id: 'DOC-1', name: 'Samsung_Invoice_Sep.pdf', type: DocumentType.invoice, format: DocumentFormat.pdf, status: DocumentStatus.completed, uploaded: '2026-09-05', insightIds: ['INS-1']),
    AppDocument(id: 'DOC-2', name: 'Electricity_Bill_Sep.jpg', type: DocumentType.expense, format: DocumentFormat.jpg, status: DocumentStatus.completed, uploaded: '2026-09-28', insightIds: ['INS-3']),
    AppDocument(id: 'DOC-3', name: 'Inventory_September.xlsx', type: DocumentType.inventory, format: DocumentFormat.xlsx, status: DocumentStatus.completed, uploaded: '2026-09-30', insightIds: []),
    AppDocument(id: 'DOC-4', name: 'Rahul_Traders_Overdue.pdf', type: DocumentType.invoice, format: DocumentFormat.pdf, status: DocumentStatus.review, uploaded: '2026-10-01', insightIds: ['INS-2']),
  ],

  insights: [
    Insight(
      id: 'INS-1',
      category: InsightCategory.financial,
      priority: InsightPriority.high,
      title: {Language.en: 'Rahul Traders overdue by ₹44,840', Language.hi: 'राहुल ट्रेडर्स का ₹44,840 बकाया', Language.hinglish: 'Rahul Traders ka ₹44,840 overdue hai'},
      summary: {Language.en: 'Invoice INV-1038 is 12 days overdue. Send a payment reminder immediately.', Language.hi: 'INV-1038 12 दिन से बकाया है। तुरंत भुगतान अनुस्मारक भेजें।', Language.hinglish: 'INV-1038 12 din overdue hai. Abhi reminder bhejein.'},
      why: {Language.en: 'Late payment affects cash flow and working capital.', Language.hi: 'देर से भुगतान से नकदी प्रवाह प्रभावित होता है।', Language.hinglish: 'Late payment se cash flow affect hota hai.'},
      recommendation: {Language.en: 'Send WhatsApp reminder to Rahul Gupta (9876543210).', Language.hi: 'राहुल गुप्ता को WhatsApp reminder भेजें।', Language.hinglish: 'Rahul Gupta ko WhatsApp reminder bhejein.'},
      evidenceIds: ['DOC-1'],
      action: InsightAction.followup,
      targetId: 'CUST-1',
      impactAmount: 44840,
    ),
    Insight(
      id: 'INS-2',
      category: InsightCategory.inventory,
      priority: InsightPriority.high,
      title: {Language.en: '3 products at critical stock level', Language.hi: '3 उत्पाद खतरनाक स्टॉक स्तर पर', Language.hinglish: '3 products ka stock critically low hai'},
      summary: {Language.en: 'Samsung TV, LG AC, and Havells Fan are at or below reorder levels.', Language.hi: 'सैमसंग टीवी, LG AC और हैवेल्स फैन रीऑर्डर स्तर पर हैं।', Language.hinglish: 'Samsung TV, LG AC aur Havells Fan reorder level par hain.'},
      why: {Language.en: 'Low stock means lost sales during festival season.', Language.hi: 'कम स्टॉक से त्योहार सीजन में बिक्री छूट जाती है।', Language.hinglish: 'Low stock se festival season me sales miss hongi.'},
      recommendation: {Language.en: 'Place reorder with Samsung and LG vendors immediately.', Language.hi: 'Samsung और LG से तुरंत ऑर्डर दें।', Language.hinglish: 'Samsung aur LG vendors ko abhi order place karein.'},
      evidenceIds: ['DOC-3'],
      action: InsightAction.purchase,
      targetId: 'VEN-1',
      impactAmount: 120000,
    ),
    Insight(
      id: 'INS-3',
      category: InsightCategory.financial,
      priority: InsightPriority.medium,
      title: {Language.en: 'Electricity cost up 18% vs last month', Language.hi: 'बिजली का खर्च पिछले महीने से 18% ज़्यादा', Language.hinglish: 'Electricity cost last month se 18% zyada'},
      summary: {Language.en: 'September electricity bill ₹8,742 — highest in 4 months.', Language.hi: 'सितंबर बिजली बिल ₹8,742 — 4 महीने में सबसे ज़्यादा।', Language.hinglish: 'September electricity bill ₹8,742 — 4 mahino me sabse zyada.'},
      why: {Language.en: 'Peak summer surcharge applied for load exceeding 5kW capacity.', Language.hi: 'गर्मी सरचार्ज लागू हुआ क्योंकि लोड 5kW से ज़्यादा था।', Language.hinglish: 'Summer surcharge lag gaya kyunki load 5kW se zyada tha.'},
      recommendation: {Language.en: 'Review AC usage during peak hours to reduce October bill.', Language.hi: 'पीक घंटों में AC का उपयोग कम करें।', Language.hinglish: 'Peak hours me AC kam chalayein October bill kam karne ke liye.'},
      evidenceIds: ['DOC-2'],
      action: InsightAction.review,
      targetId: 'EXP-4',
      impactAmount: 8742,
    ),
  ],
);

// Business totals helper
({double revenue, double outstanding, double expenses, int lowStock}) businessTotals(BusinessData data) {
  final revenue = data.payments.fold(0.0, (s, p) => s + p.amount);
  final outstanding = data.invoices
      .where((i) => i.status != InvoiceStatus.paid)
      .fold(0.0, (s, i) => s + i.total);
  final expenses = data.expenses.fold(0.0, (s, e) => s + e.amount);
  final lowStock = data.products.where((p) => p.isLowStock).length;
  return (revenue: revenue, outstanding: outstanding, expenses: expenses, lowStock: lowStock);
}
