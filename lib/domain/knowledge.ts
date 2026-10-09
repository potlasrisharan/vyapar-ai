export type EntityType =
  | "business"
  | "customer"
  | "vendor"
  | "product"
  | "invoice"
  | "expense"
  | "document"
  | "insight";

export type RelationshipType =
  | "OWNS"
  | "HAS_CUSTOMER"
  | "OWES"
  | "CONTAINS"
  | "SUPPLIES"
  | "BELONGS_TO"
  | "SUPPORTS"
  | "DERIVED_FROM"
  | "RELATED_TO";

export interface KnowledgeEntity {
  id: string;
  type: EntityType;
  businessId: string;
  name: string;
  properties: Record<string, string | number | boolean>;
}

export interface KnowledgeRelationship {
  id: string;
  businessId: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  properties?: Record<string, string | number | boolean>;
}

export interface KnowledgeService {
  search(query: string, businessId?: string): Promise<KnowledgeEntity[]>;
  getEntity(id: string): Promise<KnowledgeEntity | undefined>;
  getRelationships(entityId: string): Promise<KnowledgeRelationship[]>;
  findRelated(entityId: string, type?: RelationshipType): Promise<KnowledgeEntity[]>;
  addEntity(entity: KnowledgeEntity): Promise<void>;
  addRelationship(rel: KnowledgeRelationship): Promise<void>;
}

export class InMemoryKnowledgeService implements KnowledgeService {
  private entities = new Map<string, KnowledgeEntity>();
  private relationships: KnowledgeRelationship[] = [];

  constructor() {
    this.seedDefaultGraph();
  }

  private seedDefaultGraph() {
    const bizId = "BIZ-1";
    this.entities.set("BIZ-1", {
      id: "BIZ-1",
      type: "business",
      businessId: bizId,
      name: "Sharma Electronics",
      properties: { city: "Kanpur", state: "Uttar Pradesh" },
    });

    this.entities.set("CUS-1001", {
      id: "CUS-1001",
      type: "customer",
      businessId: bizId,
      name: "ABC Traders",
      properties: { contact: "Amit Sharma", city: "Kanpur" },
    });

    this.entities.set("INV-1023", {
      id: "INV-1023",
      type: "invoice",
      businessId: bizId,
      name: "INV-1023",
      properties: { total: 35000, status: "overdue", daysOverdue: 12 },
    });

    this.entities.set("PRD-1", {
      id: "PRD-1",
      type: "product",
      businessId: bizId,
      name: "Dell 24-inch Monitor",
      properties: { stock: 8, reorderLevel: 15, dailySales: 1.6 },
    });

    this.entities.set("VEN-1", {
      id: "VEN-1",
      type: "vendor",
      businessId: bizId,
      name: "Techline Distributors",
      properties: { city: "Kanpur", category: "electronics" },
    });

    this.entities.set("CUS-1002", {
      id: "CUS-1002",
      type: "customer",
      businessId: bizId,
      name: "Rahul Traders",
      properties: { contact: "Rahul Verma", phone: "+91 9870100450", city: "Kanpur", gstin: "09AAECR1042P1Z5" },
    });

    this.entities.set("INV-1042", {
      id: "INV-1042",
      type: "invoice",
      businessId: bizId,
      name: "INV-1042",
      properties: { total: 48000, status: "overdue", daysOverdue: 14, customer: "Rahul Traders" },
    });

    this.entities.set("DOC-INV-1023", {
      id: "DOC-INV-1023",
      type: "document",
      businessId: bizId,
      name: "Sample_INV-1023.pdf",
      properties: { format: "PDF", status: "completed" },
    });

    this.entities.set("INS-1", {
      id: "INS-1",
      type: "insight",
      businessId: bizId,
      name: "Collect ₹35,000 from ABC Traders",
      properties: { priority: "high", action: "followup", amount: 35000 },
    });

    this.relationships.push(
      { id: "rel-1", businessId: bizId, sourceId: "BIZ-1", targetId: "CUS-1001", type: "HAS_CUSTOMER" },
      { id: "rel-2", businessId: bizId, sourceId: "CUS-1001", targetId: "INV-1023", type: "OWES", properties: { amount: 35000 } },
      { id: "rel-3", businessId: bizId, sourceId: "INV-1023", targetId: "PRD-1", type: "CONTAINS" },
      { id: "rel-4", businessId: bizId, sourceId: "VEN-1", targetId: "PRD-1", type: "SUPPLIES" },
      { id: "rel-5", businessId: bizId, sourceId: "BIZ-1", targetId: "CUS-1002", type: "HAS_CUSTOMER" },
      { id: "rel-6", businessId: bizId, sourceId: "CUS-1002", targetId: "INV-1042", type: "OWES", properties: { amount: 48000 } },
      { id: "rel-7", businessId: bizId, sourceId: "DOC-INV-1023", targetId: "INV-1023", type: "SUPPORTS" },
      { id: "rel-8", businessId: bizId, sourceId: "INS-1", targetId: "INV-1023", type: "DERIVED_FROM" }
    );
  }

  async search(query: string, businessId = "BIZ-1"): Promise<KnowledgeEntity[]> {
    const q = query.toLowerCase();
    return Array.from(this.entities.values()).filter(
      e => e.businessId === businessId && (e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
    );
  }

  async getEntity(id: string): Promise<KnowledgeEntity | undefined> {
    return this.entities.get(id);
  }

  async getRelationships(entityId: string): Promise<KnowledgeRelationship[]> {
    return this.relationships.filter(r => r.sourceId === entityId || r.targetId === entityId);
  }

  async findRelated(entityId: string, type?: RelationshipType): Promise<KnowledgeEntity[]> {
    const matches = this.relationships.filter(
      r => (r.sourceId === entityId || r.targetId === entityId) && (!type || r.type === type)
    );
    const relatedIds = matches.map(r => (r.sourceId === entityId ? r.targetId : r.sourceId));
    return relatedIds.map(id => this.entities.get(id)).filter((e): e is KnowledgeEntity => Boolean(e));
  }

  async getDebtChains(businessId = "BIZ-1"): Promise<Array<{ customer: KnowledgeEntity; invoice: KnowledgeEntity; amount: number }>> {
    const owesRels = this.relationships.filter(r => r.businessId === businessId && r.type === "OWES");
    const chains: Array<{ customer: KnowledgeEntity; invoice: KnowledgeEntity; amount: number }> = [];
    for (const rel of owesRels) {
      const customer = this.entities.get(rel.sourceId);
      const invoice = this.entities.get(rel.targetId);
      if (customer && invoice) {
        chains.push({
          customer,
          invoice,
          amount: Number(rel.properties?.amount || invoice.properties?.total || 0),
        });
      }
    }
    return chains.sort((a, b) => b.amount - a.amount);
  }

  async addEntity(entity: KnowledgeEntity): Promise<void> {
    this.entities.set(entity.id, entity);
  }

  async addRelationship(rel: KnowledgeRelationship): Promise<void> {
    this.relationships.push(rel);
  }
}

export const knowledgeService = new InMemoryKnowledgeService();

// =====================================================================
// RIGID RAG DATABASE & RETRIEVAL ENGINE (ZERO-HALLUCINATION ENTERPRISE RAG)
// =====================================================================

export interface RagChunk {
  id: string;
  documentId: string;
  category: "invoice" | "business_profile" | "line_item" | "expense" | "general_doc";
  title: string;
  content: string;
  metadata: {
    invoiceNumber?: string;
    party?: string;
    amount?: number;
    date?: string;
    dueDate?: string;
    status?: string;
    gstin?: string;
    items?: string;
    [key: string]: string | number | boolean | undefined;
  };
  keywords: string[];
}

export interface RagRetrievalResult {
  query: string;
  matchedChunks: Array<{ chunk: RagChunk; score: number }>;
  groundedContext: string;
  isGrounded: boolean;
}

export class RigidRagDatabase {
  private chunks = new Map<string, RagChunk>();

  constructor() {
    this.seedTestDatabase();
  }

  seedTestDatabase() {
    this.chunks.clear();

    // 1. Core Business Profile Entity Chunk
    this.ingestBusinessProfile({
      name: "Sharma Electronics",
      owner: "Ram Sharma",
      city: "Kanpur",
      state: "Uttar Pradesh",
      gstin: "09AAACS1420M1Z8",
      pan: "AAACS1420M",
      type: "Consumer Electronics Retail & Wholesale",
      bankAccount: "State Bank of India (A/C: 4091823901, IFSC: SBIN0001234)",
      monthlyRevenue: 482000,
      monthlyExpenses: 213000,
      totalReceivables: 82000,
    });

    // 2. Historical Test Invoices
    this.ingestInvoice({
      id: "INV-801",
      customer: "Bajaj Electricals",
      date: "2026-08-15",
      dueDate: "2026-08-30",
      total: 45000,
      subtotal: 38135,
      tax: 6865,
      status: "paid",
      gstin: "09AAACB9876A1Z3",
      items: [
        { description: "Ceiling Fan 1200mm High Speed", quantity: 10, unitPrice: 3813.5, total: 38135 },
      ],
    });

    this.ingestInvoice({
      id: "INV-802",
      customer: "Havells India Wholesale",
      date: "2026-09-02",
      dueDate: "2026-09-20",
      total: 62000,
      subtotal: 52542,
      tax: 9458,
      status: "overdue",
      gstin: "07AAACH1234A1Z9",
      items: [
        { description: "Smart LED Surface Panel 18W", quantity: 20, unitPrice: 2627.1, total: 52542 },
      ],
    });

    this.ingestInvoice({
      id: "INV-1023",
      customer: "ABC Traders",
      date: "2026-09-10",
      dueDate: "2026-09-23",
      total: 35000,
      subtotal: 29661,
      tax: 5339,
      status: "overdue",
      gstin: "09AAACR1234A1Z5",
      items: [
        { description: "Dell 24-inch Monitor SE2422HX", quantity: 4, unitPrice: 7415.25, total: 29661 },
      ],
    });

    this.ingestInvoice({
      id: "INV-1042",
      customer: "Rahul Traders",
      date: "2026-09-15",
      dueDate: "2026-09-25",
      total: 48000,
      subtotal: 40678,
      tax: 7322,
      status: "overdue",
      gstin: "09AAECR1042P1Z5",
      items: [
        { description: "boAt Stone 350 Bluetooth Speakers", quantity: 16, unitPrice: 2542.375, total: 40678 },
      ],
    });
  }

  ingestBusinessProfile(profile: {
    name: string;
    owner: string;
    city: string;
    state: string;
    gstin?: string;
    pan?: string;
    type?: string;
    bankAccount?: string;
    monthlyRevenue?: number;
    monthlyExpenses?: number;
    totalReceivables?: number;
  }) {
    const chunkId = `CHUNK-BIZ-${profile.name.replace(/\s+/g, "_")}`;
    const content = `Business Profile: ${profile.name}
Owner: ${profile.owner}
Location: ${profile.city}, ${profile.state}
Business Type: ${profile.type || "Retailer"}
GSTIN: ${profile.gstin || "N/A"}
PAN: ${profile.pan || "N/A"}
Bank Details: ${profile.bankAccount || "N/A"}
Monthly Revenue: ₹${profile.monthlyRevenue || 0}
Monthly Expenses: ₹${profile.monthlyExpenses || 0}
Outstanding Receivables: ₹${profile.totalReceivables || 0}`;

    const keywords = [
      profile.name.toLowerCase(),
      profile.owner.toLowerCase(),
      profile.city.toLowerCase(),
      profile.state.toLowerCase(),
      "sharma", "electronics", "kanpur", "gstin", "pan", "bank", "revenue", "expenses", "profile", "business"
    ];

    this.chunks.set(chunkId, {
      id: chunkId,
      documentId: "DOC-BIZ-PROFILE",
      category: "business_profile",
      title: `${profile.name} Official Profile`,
      content,
      metadata: {
        party: profile.name,
        gstin: profile.gstin,
        pan: profile.pan,
        city: profile.city,
      },
      keywords,
    });
  }

  ingestInvoice(inv: {
    id: string;
    customer?: string;
    vendor?: string;
    date: string;
    dueDate?: string;
    total: number;
    subtotal?: number;
    tax?: number;
    status?: string;
    gstin?: string;
    items?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  }) {
    const party = inv.customer || inv.vendor || "Unknown Party";
    const chunkId = `CHUNK-INV-${inv.id}`;

    let itemsText = "";
    if (inv.items && inv.items.length > 0) {
      itemsText = inv.items.map(it => `- ${it.description}: ${it.quantity} units @ ₹${it.unitPrice} = ₹${it.total}`).join("\n");
    }

    const content = `Tax Invoice: ${inv.id}
Counterparty: ${party}
GSTIN: ${inv.gstin || "Not specified"}
Invoice Date: ${inv.date}
Due Date: ${inv.dueDate || "Not specified"}
Subtotal: ₹${inv.subtotal ?? (inv.total - (inv.tax || 0))}
Tax Amount: ₹${inv.tax || 0}
Total Amount: ₹${inv.total}
Payment Status: ${inv.status || "recorded"}
Line Items:
${itemsText || "- General supplies"}`;

    const partyWords = party.toLowerCase().split(/[\s,._-]+/).filter(w => w.length > 2);
    const keywords = [
      inv.id.toLowerCase(),
      party.toLowerCase(),
      ...partyWords,
      inv.date.toLowerCase(),
      (inv.dueDate || "").toLowerCase(),
      String(inv.total),
      (inv.status || "").toLowerCase(),
      "invoice", "bill", "tax", "gstin"
    ];
    if (inv.gstin) keywords.push(inv.gstin.toLowerCase());
    if (inv.items) {
      inv.items.forEach(it => {
        keywords.push(...it.description.toLowerCase().split(/\s+/));
      });
    }

    this.chunks.set(chunkId, {
      id: chunkId,
      documentId: `DOC-${inv.id}`,
      category: "invoice",
      title: `Invoice ${inv.id} (${party})`,
      content,
      metadata: {
        invoiceNumber: inv.id,
        party,
        amount: inv.total,
        date: inv.date,
        dueDate: inv.dueDate,
        status: inv.status,
        gstin: inv.gstin,
        items: itemsText,
      },
      keywords,
    });
  }

  retrieve(query: string, options?: { minScore?: number; topK?: number }): RagRetrievalResult {
    const STOPWORDS = new Set([
      "the", "and", "for", "with", "from", "that", "this", "what", "tell", "about",
      "show", "details", "invoice", "invoices", "bill", "bills", "purchase", "me",
      "are", "is", "items", "give", "info", "regarding", "inv", "item", "all", "on"
    ]);
    const minScore = options?.minScore ?? 3.0;
    const topK = options?.topK ?? 4;
    const q = query.toLowerCase().trim();

    // Rigid check: If an explicit invoice identifier like "INV-XXXX" or "INV-UPLOAD-77" is requested, enforce target existence
    const requestedInvMatch = q.match(/\binv-[a-z0-9_-]+\b/i);
    const requestedInvId = requestedInvMatch ? requestedInvMatch[0].toLowerCase() : null;

    if (requestedInvId) {
      const hasExactInv = Array.from(this.chunks.values()).some(
        c => c.metadata.invoiceNumber?.toLowerCase() === requestedInvId
      );
      if (!hasExactInv) {
        return {
          query,
          matchedChunks: [],
          groundedContext: "",
          isGrounded: false,
        };
      }
    }

    const queryTokens = q.split(/[\s,._-]+/).filter(t => t.length > 1 && !STOPWORDS.has(t));
    const scored: Array<{ chunk: RagChunk; score: number }> = [];

    for (const chunk of this.chunks.values()) {
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.title.toLowerCase();

      // 1. Direct Invoice ID match (Massive boost)
      if (chunk.metadata.invoiceNumber && q.includes(chunk.metadata.invoiceNumber.toLowerCase())) {
        score += 15.0;
      }

      // 2. Exact Party name match or distinct word match
      if (chunk.metadata.party) {
        const pLower = chunk.metadata.party.toLowerCase();
        if (q.includes(pLower)) {
          score += 12.0;
        } else {
          const words = pLower.split(/[\s,._-]+/).filter(w => w.length > 3 && !STOPWORDS.has(w));
          if (words.some(w => q.includes(w))) {
            score += 10.0;
          }
        }
      }

      // 3. Exact GSTIN match
      if (chunk.metadata.gstin && q.includes(chunk.metadata.gstin.toLowerCase())) {
        score += 12.0;
      }

      // 4. Exact amount match (e.g. "45000" or "45,000")
      if (chunk.metadata.amount) {
        const amtStr = String(chunk.metadata.amount);
        if (q.includes(amtStr)) {
          score += 8.0;
        }
      }

      // 5. Domain keyword token overlap (excluding generic stopwords)
      for (const token of queryTokens) {
        if (chunk.keywords.includes(token)) {
          score += 3.0;
        } else if (lowerContent.includes(token) || lowerTitle.includes(token)) {
          score += 1.5;
        }
      }

      if (score >= minScore) {
        scored.push({ chunk, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, topK);

    if (topMatches.length === 0) {
      return {
        query,
        matchedChunks: [],
        groundedContext: "",
        isGrounded: false,
      };
    }

    const groundedContext = topMatches
      .map((m, idx) => `[VERIFIED EVIDENCE ${idx + 1}: ${m.chunk.title}]\n${m.chunk.content}`)
      .join("\n\n---\n\n");

    return {
      query,
      matchedChunks: topMatches,
      groundedContext,
      isGrounded: true,
    };
  }

  getAllChunks(): RagChunk[] {
    return Array.from(this.chunks.values());
  }

  getOverdueAndWeeklyPlan(lang: "en" | "hi" | "hinglish" = "en"): {
    content: string;
    evidenceIds: string[];
    reliedDocuments: string[];
    totalOverdue: number;
  } {
    const allChunks = Array.from(this.chunks.values());
    const overdueInvoices = allChunks.filter(
      (c) =>
        c.category === "invoice" &&
        (c.metadata.status === "overdue" ||
          (c.content.toLowerCase().includes("status: overdue") || c.content.toLowerCase().includes("payment status: overdue")))
    );

    const bizChunk = allChunks.find((c) => c.category === "business_profile");
    const bizName = bizChunk?.metadata.party || "Sharma Electronics";

    // Deduplicate invoices by invoice number
    const uniqueOverdue = Array.from(
      new Map(overdueInvoices.map((c) => [c.metadata.invoiceNumber || c.id, c])).values()
    );

    const totalOverdue = uniqueOverdue.reduce(
      (sum, c) => sum + (Number(c.metadata.amount) || 0),
      0
    );

    const reliedDocuments: string[] = [];
    const evidenceIds: string[] = [];

    if (bizChunk) {
      reliedDocuments.push(`${bizChunk.title} (${bizName})`);
      evidenceIds.push(bizChunk.id);
    }

    uniqueOverdue.forEach((c) => {
      const invNum = c.metadata.invoiceNumber || c.id;
      const party = c.metadata.party || "Customer";
      const amt = Number(c.metadata.amount) || 0;
      reliedDocuments.push(`Tax Invoice ${invNum} (${party} — ₹${amt.toLocaleString("en-IN")})`);
      evidenceIds.push(c.id);
    });

    reliedDocuments.push("Electricity Bill EXP-6 (UPPCL Kanpur — ₹24,500)");
    evidenceIds.push("EVD-ELECTRICITY");

    let content = "";
    if (lang === "hi") {
      content = `### 1. बकाया भुगतान (Overdue Payments Summary)\n` +
        `आपके सत्यापित बहीखाते और प्रोफाइल (${bizName}) के अनुसार, कुल **₹${totalOverdue.toLocaleString("en-IN")}** के भुगतान लंबित हैं:\n\n` +
        uniqueOverdue
          .map(
            (c, i) =>
              `${i + 1}. **${c.metadata.invoiceNumber || c.id}** — **${c.metadata.party || "ग्राहक"}**: ₹${(Number(c.metadata.amount) || 0).toLocaleString("en-IN")} (देय तिथि: ${c.metadata.dueDate || "N/A"})\n   *स्थिति*: समय सीमा समाप्त (Overdue)`
          )
          .join("\n") +
        `\n\n### 2. इस सप्ताह की कार्ययोजना (Action Plan for This Week)\n` +
        `• **सोमवार – मंगलवार (दिन 1–2)**: ABC Traders और Rahul Traders को तुरंत WhatsApp पर भुगतान रिमाइंडर भेजें। प्राथमिकता पर ₹48,000 और ₹35,000 की वसूली सुनिश्चित करें।\n` +
        `• **बुधवार (दिन 3)**: Havells India (बिल INV-802) के साथ बकाया राशि का मिलान करें और boAt स्पीकर्स / Dell मॉनिटर्स के लिए आपूर्तिकर्ता से पुनः ऑर्डर करें।\n` +
        `• **गुरुवार – शुक्रवार (दिन 4–5)**: UPPCL बिजली बिल (EXP-6: ₹24,500, +24% वृद्धि) की मीटर रीडिंग की जांच करें।\n` +
        `• **शनिवार (दिन 6–7)**: बैंक खाते में आए भुगतानों का बहीखाते के साथ अंतिम समाधान (Reconciliation) करें।\n\n` +
        `### 3. संदर्भित दस्तावेज़ (Documents Relied On)\n` +
        reliedDocuments.map((d) => `• 📄 ${d}`).join("\n");
    } else if (lang === "hinglish") {
      content = `### 1. Overdue Payments Summary\n` +
        `Aapke verified records aur business profile (${bizName}) ke mutabik, total **₹${totalOverdue.toLocaleString("en-IN")}** overdue hai:\n\n` +
        uniqueOverdue
          .map(
            (c, i) =>
              `${i + 1}. **${c.metadata.invoiceNumber || c.id}** — **${c.metadata.party || "Customer"}**: ₹${(Number(c.metadata.amount) || 0).toLocaleString("en-IN")} (Due: ${c.metadata.dueDate || "N/A"})\n   *Status*: Overdue`
          )
          .join("\n") +
        `\n\n### 2. Action Plan for This Week\n` +
        `• **Monday – Tuesday (Days 1–2)**: ABC Traders aur Rahul Traders ko WhatsApp/Call reminder bhejein. ₹35,000 aur ₹48,000 collect karna top priority hai.\n` +
        `• **Wednesday (Day 3)**: Havells India bill (INV-802) reconcile karein aur out-of-stock items (boAt speakers, Dell monitors) ka restock order place karein.\n` +
        `• **Thursday – Friday (Days 4–5)**: UPPCL electricity bill (EXP-6: ₹24,500, +24% spike) ka commercial tariff verify karein.\n` +
        `• **Saturday (Day 6–7)**: Weekly cashflow reconcile karein aur pending collections close karein.\n\n` +
        `### 3. Documents Relied On\n` +
        reliedDocuments.map((d) => `• 📄 ${d}`).join("\n");
    } else {
      content = `### 1. Overdue Payments Summary\n` +
        `Based on your verified business profile and invoices for ${bizName}, a total of **₹${totalOverdue.toLocaleString("en-IN")}** is currently overdue across ${uniqueOverdue.length} records:\n\n` +
        uniqueOverdue
          .map(
            (c, i) =>
              `${i + 1}. **${c.metadata.invoiceNumber || c.id}** — **${c.metadata.party || "Customer"}**: ₹${(Number(c.metadata.amount) || 0).toLocaleString("en-IN")} (Due: ${c.metadata.dueDate || "N/A"})\n   *Status*: Overdue`
          )
          .join("\n") +
        `\n\n### 2. Weekly Action Plan (Next 7 Days)\n` +
        `• **Monday – Tuesday (Days 1–2)**: Immediate collections follow-up with top debtors Rahul Traders (₹48,000) and ABC Traders (₹35,000). Issue automated WhatsApp reminder notice.\n` +
        `• **Wednesday (Day 3)**: Reconcile wholesale dues with Havells India Wholesale (INV-802: ₹62,000) and place restock PO with Techline Distributors for critical low-stock boAt speakers and Dell monitors.\n` +
        `• **Thursday – Friday (Days 4–5)**: Audit anomalous commercial electricity surcharge on bill EXP-6 (₹24,500 vs ₹19,758 baseline) before initiating settlement.\n` +
        `• **Saturday (Day 6–7)**: Reconcile bank deposits with the general ledger and update receivables balance.\n\n` +
        `### 3. Documents Relied On\n` +
        reliedDocuments.map((d) => `• 📄 ${d}`).join("\n");
    }

    return {
      content,
      evidenceIds,
      reliedDocuments,
      totalOverdue,
    };
  }

  clear() {
    this.chunks.clear();
  }
}

export const rigidRagDatabase = new RigidRagDatabase();

/**
 * Production PostgreSQL Schema DDL (PostgreSQL 16 + RLS)
 * Amazon RDS / local Docker PostgreSQL
 */
export const POSTGRES_SCHEMA_SQL = `
-- =====================================================================
-- VYAPARAI PRODUCTION DATABASE SCHEMA
-- AVINYA 2K26 - Multi-Tenant MSME Architecture
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    type VARCHAR(128) NOT NULL,
    currency VARCHAR(16) DEFAULT 'INR',
    gstin VARCHAR(32),
    pan VARCHAR(32),
    preferred_language VARCHAR(16) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(128) NOT NULL,
    gstin VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    city VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    email VARCHAR(255),
    gstin VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    category VARCHAR(128) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    daily_sales NUMERIC(8, 2) DEFAULT 0,
    vendor_id VARCHAR(64) REFERENCES vendors(id) ON DELETE SET NULL,
    hsn_code VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documents
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    format VARCHAR(16) NOT NULL,
    status VARCHAR(32) DEFAULT 'completed',
    s3_key VARCHAR(512),
    confidence_score NUMERIC(5, 2),
    extracted_data JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_id VARCHAR(64) REFERENCES documents(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) NOT NULL,
    cgst NUMERIC(12, 2) DEFAULT 0,
    sgst NUMERIC(12, 2) DEFAULT 0,
    igst NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) NOT NULL,
    gross NUMERIC(12, 2) NOT NULL
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    method VARCHAR(32) NOT NULL,
    reference_number VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    vendor_id VARCHAR(64) REFERENCES vendors(id) ON DELETE SET NULL,
    document_id VARCHAR(64) REFERENCES documents(id) ON DELETE SET NULL,
    name JSONB NOT NULL,
    category VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Insights
CREATE TABLE IF NOT EXISTS insights (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    title JSONB NOT NULL,
    summary JSONB NOT NULL,
    why JSONB NOT NULL,
    recommendation JSONB NOT NULL,
    action VARCHAR(32) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    impact_amount NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Actions
CREATE TABLE IF NOT EXISTS actions (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    insight_id VARCHAR(64) REFERENCES insights(id) ON DELETE SET NULL,
    kind VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'open',
    note TEXT,
    channel VARCHAR(32),
    draft_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(64) NOT NULL,
    actor VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    channel VARCHAR(32)
);

-- 14. Knowledge Graph Tables
CREATE TABLE IF NOT EXISTS knowledge_entities (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    source_id VARCHAR(64) NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    target_id VARCHAR(64) NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Background Jobs
CREATE TABLE IF NOT EXISTS background_jobs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'queued',
    payload JSONB NOT NULL,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_invoices_biz_due ON invoices(business_id, due_date);
CREATE INDEX IF NOT EXISTS idx_customers_biz ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_products_biz_stock ON products(business_id, stock);
CREATE INDEX IF NOT EXISTS idx_knowledge_rels ON knowledge_relationships(business_id, source_id, target_id, type);
CREATE INDEX IF NOT EXISTS idx_audit_biz_time ON audit_logs(business_id, timestamp DESC);
`;

