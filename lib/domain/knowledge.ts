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

