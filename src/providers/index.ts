import type { AIProvider, ProviderName } from "../types/index.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";
import { AnthropicProvider } from "./anthropic.js";
import { XAIProvider } from "./xai.js";
import { QwenProvider } from "./qwen.js";
import { OllamaProvider } from "./ollama.js";

const providers: Record<ProviderName, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  anthropic: () => new AnthropicProvider(),
  xai: () => new XAIProvider(),
  qwen: () => new QwenProvider(),
  ollama: () => new OllamaProvider(),
};

export function getProvider(name: ProviderName): AIProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(
      `Unknown provider: ${name}. Available: ${Object.keys(providers).join(", ")}`
    );
  }
  return factory();
}

export function listProviders(): ProviderName[] {
  return Object.keys(providers) as ProviderName[];
}
