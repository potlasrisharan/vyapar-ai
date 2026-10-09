export type AITaskType =
  | "document_extraction"
  | "classification"
  | "business_reasoning"
  | "chat"
  | "translation"
  | "embedding"
  | "speech_to_text"
  | "text_to_speech";

export interface AIModelRoute {
  task: AITaskType;
  primaryProvider: "gemini" | "openai" | "anthropic" | "bedrock" | "mock";
  primaryModel: string;
  fallbackProvider: "mock";
  fallbackModel: string;
  description: string;
}

export interface AIProvider {
  name: string;
  generateText(prompt: string, task: AITaskType): Promise<string>;
  generateStructured<T>(prompt: string, schema: string): Promise<T>;
  embed?(text: string): Promise<number[]>;
}

export class MockAIProvider implements AIProvider {
  name = "MockAIProvider";

  async generateText(prompt: string, task: AITaskType): Promise<string> {
    return `[MockAI (${task}): ${prompt.slice(0, 40)}...] Grounded in business ledger.`;
  }

  async generateStructured<T>(prompt: string, schema: string): Promise<T> {
    void prompt;
    void schema;
    return {} as T;
  }

  async embed(text: string): Promise<number[]> {
    void text;
    return Array.from({ length: 64 }, () => 0.1);
  }
}

export class AIModelRouter {
  private routes: Record<AITaskType, AIModelRoute> = {
    document_extraction: {
      task: "document_extraction",
      primaryProvider: "gemini",
      primaryModel: "gemini-1.5-flash-multimodal",
      fallbackProvider: "mock",
      fallbackModel: "mock-ocr-v1",
      description: "Multimodal OCR for Indian handwritten and printed GST invoices",
    },
    business_reasoning: {
      task: "business_reasoning",
      primaryProvider: "openai",
      primaryModel: "gpt-4o",
      fallbackProvider: "mock",
      fallbackModel: "mock-reasoning-v1",
      description: "Synthesizes cash runway, margin pressure, and overdue risk",
    },
    chat: {
      task: "chat",
      primaryProvider: "anthropic",
      primaryModel: "claude-3-5-sonnet",
      fallbackProvider: "mock",
      fallbackModel: "mock-copilot-v1",
      description: "Conversational business copilot with real evidence citation",
    },
    classification: {
      task: "classification",
      primaryProvider: "openai",
      primaryModel: "gpt-4o-mini",
      fallbackProvider: "mock",
      fallbackModel: "mock-classifier-v1",
      description: "Lightweight routing and intent categorization",
    },
    translation: {
      task: "translation",
      primaryProvider: "gemini",
      primaryModel: "gemini-1.5-pro",
      fallbackProvider: "mock",
      fallbackModel: "mock-i18n-v1",
      description: "Natural localized phrasing in Hindi and Hinglish for MSME merchants",
    },
    embedding: {
      task: "embedding",
      primaryProvider: "openai",
      primaryModel: "text-embedding-3-small",
      fallbackProvider: "mock",
      fallbackModel: "mock-embed-v1",
      description: "Vector embeddings for document search and invoice retrieval",
    },
    speech_to_text: {
      task: "speech_to_text",
      primaryProvider: "openai",
      primaryModel: "whisper-large-v3",
      fallbackProvider: "mock",
      fallbackModel: "mock-stt-v1",
      description: "Indian English and Hindi voice input transcription",
    },
    text_to_speech: {
      task: "text_to_speech",
      primaryProvider: "openai",
      primaryModel: "tts-1-hd",
      fallbackProvider: "mock",
      fallbackModel: "mock-tts-v1",
      description: "Audio briefing read-out in merchant preference language",
    },
  };

  private providers = new Map<string, AIProvider>([
    ["mock", new MockAIProvider()],
  ]);

  getRoute(task: AITaskType): AIModelRoute {
    return this.routes[task];
  }

  getAllRoutes(): AIModelRoute[] {
    return Object.values(this.routes);
  }

  async executeTask(task: AITaskType, prompt: string): Promise<string> {
    const route = this.getRoute(task);
    const provider = this.providers.get(route.primaryProvider) ?? this.providers.get("mock")!;
    try {
      return await provider.generateText(prompt, task);
    } catch {
      const fallback = this.providers.get(route.fallbackProvider) ?? new MockAIProvider();
      return fallback.generateText(prompt, task);
    }
  }
}

export const aiRouter = new AIModelRouter();
