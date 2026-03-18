export type ContentType =
  | "blog"
  | "landing"
  | "glossary"
  | "comparison"
  | "listicle"
  | "how-to"
  | "alternatives"
  | "review"
  | "hub"
  | "auto";

export const ALL_CONTENT_TYPES: Exclude<ContentType, "auto">[] = [
  "blog", "glossary", "listicle", "comparison", "landing",
  "how-to", "alternatives", "review", "hub",
];

export interface GeneratedContent {
  title: string;
  meta_description: string;
  body: string;
  internal_links?: InternalLink[];
  external_links?: ExternalLink[];
}

export interface InternalLink {
  anchor: string;
  url: string;
}

export interface ExternalLink {
  anchor: string;
  url: string;
  title?: string;
}

export interface SeedEntry {
  keyword: string;
  category?: string;
  slug?: string;
  custom_prompt?: string;
  type?: ContentType;
  [key: string]: string | undefined;
}

export interface GenerateConfig {
  provider: ProviderName;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language?: string;
  tone?: string;
  wordCount?: number;
  internalLinks?: string[];
  brand?: BrandConfig;
  slugPrefix?: string;
  existingPages?: { slug: string; title: string; keyword: string }[];
  contentType?: ContentType;
  webSearch?: boolean;
  rateLimit?: RateLimitConfig;
}

export type ProviderName =
  | "openai"
  | "gemini"
  | "anthropic"
  | "xai"
  | "qwen"
  | "ollama";

export interface AIProvider {
  name: ProviderName;
  generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent>;
  generateRaw(prompt: string, config: GenerateConfig): Promise<string>;
}

export interface BrandConfig {
  name?: string;
  url?: string;
  description?: string;
}

export interface RateLimitConfig {
  rpm?: number;
  concurrency?: number;
  batchSize?: number;
}

export const DEFAULT_RATE_LIMITS: Record<ProviderName, RateLimitConfig> = {
  openai: { rpm: 500, concurrency: 5, batchSize: 5 },
  gemini: { rpm: 1000, concurrency: 10, batchSize: 10 },
  anthropic: { rpm: 50, concurrency: 3, batchSize: 3 },
  xai: { rpm: 60, concurrency: 3, batchSize: 3 },
  qwen: { rpm: 60, concurrency: 3, batchSize: 3 },
  ollama: { rpm: 999, concurrency: 1, batchSize: 1 },
};

export interface PseoConfig {
  provider: ProviderName;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language: string;
  tone: string;
  wordCount: number;
  brand: BrandConfig;
  internalLinking: InternalLinkingConfig;
  server: ServerConfig;
  webSearch?: boolean;
  rateLimit?: Partial<Record<ProviderName, RateLimitConfig>>;
}

export interface InternalLinkingConfig {
  enabled: boolean;
  source: "sitemap" | "manual" | "both";
  sitemapUrl?: string;
  urls: string[];
  slugPrefix?: string;
}

export interface ServerConfig {
  port: number;
  host: string;
}

export interface StoredPage {
  id: number;
  slug: string;
  keyword: string;
  title: string;
  meta_description: string;
  body: string;
  internal_links: string;
  external_links: string;
  page_type: string;
  published_date: string;
  created_at: string;
  updated_at: string;
}

export interface PageResponse {
  slug: string;
  keyword: string;
  title: string;
  meta_description: string;
  body: string;
  internal_links: InternalLink[];
  external_links: ExternalLink[];
  page_type: string;
  published_date: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
