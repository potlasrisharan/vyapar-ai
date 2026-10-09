export interface AppConfig {
  env: "development" | "test" | "production";
  app: {
    name: string;
    version: string;
    port: number;
    host: string;
  };
  aws: {
    region: string;
    agentToolkitRegion: string;
    s3Bucket: string;
    documentsPrefix: string;
    cloudWatchNamespace: string;
  };
  database: {
    url?: string;
    poolMin: number;
    poolMax: number;
  };
  ai: {
    defaultProvider: "mock" | "openai" | "gemini" | "anthropic" | "bedrock";
    fallbackProvider: "mock";
    enableLocalMocks: boolean;
  };
}

export const config: AppConfig = {
  env: (process.env.NODE_ENV as AppConfig["env"]) || "development",
  app: {
    name: "VyaparAI",
    version: "0.1.0",
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "127.0.0.1",
  },
  aws: {
    region: process.env.AWS_REGION || "ap-southeast-2", // Sydney target region
    agentToolkitRegion: process.env.AWS_AGENT_TOOLKIT_REGION || "us-east-1", // Agent toolkit requirement
    s3Bucket: process.env.S3_BUCKET || "vyaparai-documents-ap-southeast-2",
    documentsPrefix: "msme-uploads/",
    cloudWatchNamespace: "VyaparAI/MSME",
  },
  database: {
    url: process.env.DATABASE_URL,
    poolMin: 2,
    poolMax: 10,
  },
  ai: {
    defaultProvider: "mock",
    fallbackProvider: "mock",
    enableLocalMocks: true,
  },
};
