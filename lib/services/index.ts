// Phase 2 boundary: replace these adapters without changing page components.
// No network clients or provider SDKs are instantiated in this prototype.
export { businessService } from "@/lib/mock/business";
export { assistantService } from "@/lib/mock/assistant";
export { knowledgeService } from "@/lib/domain/knowledge";
export { aiRouter } from "@/lib/domain/ai-router";
export { eventBus } from "@/lib/domain/events";
export { config } from "@/lib/config";
export * from "./contracts";
