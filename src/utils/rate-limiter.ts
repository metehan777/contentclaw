import type { RateLimitConfig } from "../types/index.js";

export class RateLimiter {
  private rpm: number;
  private concurrency: number;
  private active = 0;
  private queue: (() => void)[] = [];
  private timestamps: number[] = [];

  constructor(config: RateLimitConfig) {
    this.rpm = config.rpm || 60;
    this.concurrency = config.concurrency || 3;
  }

  private async waitForSlot(): Promise<void> {
    if (this.active < this.concurrency) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60_000;
    this.timestamps = this.timestamps.filter((t) => t > windowStart);

    if (this.timestamps.length >= this.rpm) {
      const oldest = this.timestamps[0];
      const waitMs = oldest + 60_000 - now + 50;
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      this.timestamps = this.timestamps.filter((t) => t > Date.now() - 60_000);
    }

    this.timestamps.push(Date.now());
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    try {
      await this.waitForRateLimit();
      return await fn();
    } finally {
      this.release();
    }
  }

  async executeBatch<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    batchSize: number,
    onResult?: (result: R, index: number) => void,
    onError?: (error: Error, item: T, index: number) => void
  ): Promise<{ results: (R | null)[]; errors: number }> {
    const results: (R | null)[] = new Array(items.length).fill(null);
    let errorCount = 0;

    for (let batchStart = 0; batchStart < items.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, items.length);
      const batch = items.slice(batchStart, batchEnd);

      const promises = batch.map((item, batchIdx) => {
        const globalIdx = batchStart + batchIdx;
        return this.execute(async () => {
          try {
            const result = await fn(item);
            results[globalIdx] = result;
            onResult?.(result, globalIdx);
            return result;
          } catch (err) {
            errorCount++;
            onError?.(err instanceof Error ? err : new Error(String(err)), item, globalIdx);
            return null;
          }
        });
      });

      await Promise.all(promises);
    }

    return { results, errors: errorCount };
  }
}

const cache = new Map<string, { data: string; expires: number }>();

export function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: string, ttlMs: number = 3600_000): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });

  if (cache.size > 10000) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expires) cache.delete(k);
    }
  }
}

export function cacheKey(prompt: string, provider: string, model?: string): string {
  const hash = simpleHash(prompt);
  return `${provider}:${model || "default"}:${hash}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
