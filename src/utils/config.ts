import fs from "node:fs";
import path from "node:path";
import type { PseoConfig } from "../types/index.js";

const CONFIG_FILE = "contentclaw.config.json";

export function getConfigPath(): string {
  return path.resolve(process.cwd(), CONFIG_FILE);
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

export function readConfig(): PseoConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config file not found. Run "contentclaw init" to create one.`
    );
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as PseoConfig;
}

export function writeConfig(config: PseoConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function getDefaultConfig(): PseoConfig {
  return {
    provider: "openai",
    model: undefined,
    apiKey: undefined,
    baseUrl: undefined,
    language: "en",
    tone: "informative",
    wordCount: 1500,
    brand: {},
    internalLinking: {
      enabled: false,
      source: "manual",
      sitemapUrl: undefined,
      urls: [],
    },
    server: {
      port: 3099,
      host: "localhost",
    },
  };
}
