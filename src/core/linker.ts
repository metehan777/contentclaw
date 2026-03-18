import { parseStringPromise } from "xml2js";
import type { InternalLinkingConfig } from "../types/index.js";

export async function fetchInternalLinks(
  config: InternalLinkingConfig
): Promise<string[]> {
  const urls = new Set<string>();

  if (
    (config.source === "sitemap" || config.source === "both") &&
    config.sitemapUrl
  ) {
    const sitemapUrls = await fetchSitemapUrls(config.sitemapUrl);
    sitemapUrls.forEach((u) => urls.add(u));
  }

  if (config.source === "manual" || config.source === "both") {
    config.urls.forEach((u) => urls.add(u));
  }

  return Array.from(urls);
}

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml);

    const urls: string[] = [];

    if (result.urlset?.url) {
      for (const entry of result.urlset.url) {
        if (entry.loc?.[0]) {
          urls.push(entry.loc[0]);
        }
      }
    }

    if (result.sitemapindex?.sitemap) {
      for (const sitemap of result.sitemapindex.sitemap) {
        if (sitemap.loc?.[0]) {
          const childUrls = await fetchSitemapUrls(sitemap.loc[0]);
          urls.push(...childUrls);
        }
      }
    }

    return urls;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Sitemap fetch error: ${message}`);
  }
}

export function buildLinkingPromptSection(urls: string[]): string {
  if (urls.length === 0) return "";

  const sample = urls.slice(0, 30);
  return `

INTERNAL LINKING INSTRUCTIONS:
Naturally incorporate 2-5 internal links from the following URLs into the content where contextually relevant. Use descriptive anchor text that matches the linked page's topic. Format as HTML anchor tags.

Available URLs:
${sample.map((u) => `- ${u}`).join("\n")}
`;
}
