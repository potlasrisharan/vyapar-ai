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

    this.relationships.push(
      { id: "rel-1", businessId: bizId, sourceId: "BIZ-1", targetId: "CUS-1001", type: "HAS_CUSTOMER" },
      { id: "rel-2", businessId: bizId, sourceId: "CUS-1001", targetId: "INV-1023", type: "OWES", properties: { amount: 35000 } },
      { id: "rel-3", businessId: bizId, sourceId: "INV-1023", targetId: "PRD-1", type: "CONTAINS" },
      { id: "rel-4", businessId: bizId, sourceId: "VEN-1", targetId: "PRD-1", type: "SUPPLIES" }
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

  async addEntity(entity: KnowledgeEntity): Promise<void> {
    this.entities.set(entity.id, entity);
  }

  async addRelationship(rel: KnowledgeRelationship): Promise<void> {
    this.relationships.push(rel);
  }
}

export const knowledgeService = new InMemoryKnowledgeService();
