import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { SeedEntry } from "../types/index.js";

export function parseSeedFile(filePath: string): SeedEntry[] {
  const absPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Seed file not found: ${absPath}`);
  }

  const ext = path.extname(absPath).toLowerCase();
  const content = fs.readFileSync(absPath, "utf-8");

  if (ext === ".csv") {
    return parseCsv(content);
  } else if (ext === ".json") {
    return parseJson(content);
  } else {
    throw new Error(`Unsupported seed file format: ${ext}. Use .csv or .json`);
  }
}

function parseCsv(content: string): SeedEntry[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    throw new Error("CSV file is empty or has no data rows");
  }

  const firstRow = records[0];
  if (!firstRow.keyword && !firstRow.Keyword && !firstRow.KEYWORD) {
    throw new Error(
      'CSV must have a "keyword" column. Found columns: ' +
        Object.keys(firstRow).join(", ")
    );
  }

  return records.map((row) => {
    const keyword =
      row.keyword || row.Keyword || row.KEYWORD || "";
    return {
      keyword,
      category: row.category || row.Category || undefined,
      slug: row.slug || row.Slug || undefined,
      custom_prompt: row.custom_prompt || row.prompt || undefined,
      ...row,
    };
  });
}

function parseJson(content: string): SeedEntry[] {
  const data = JSON.parse(content);

  if (Array.isArray(data)) {
    return data.map(validateSeedEntry);
  }

  if (data.seeds && Array.isArray(data.seeds)) {
    return data.seeds.map(validateSeedEntry);
  }

  if (data.keywords && Array.isArray(data.keywords)) {
    return data.keywords.map((kw: string) => ({ keyword: kw }));
  }

  throw new Error(
    "JSON must be an array of objects with a 'keyword' field, or an object with 'seeds' or 'keywords' array"
  );
}

function validateSeedEntry(entry: Record<string, unknown>): SeedEntry {
  if (!entry.keyword || typeof entry.keyword !== "string") {
    throw new Error(
      `Each seed entry must have a "keyword" string field. Got: ${JSON.stringify(entry)}`
    );
  }
  return entry as unknown as SeedEntry;
}
