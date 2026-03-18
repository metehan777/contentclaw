import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type {
  StoredPage,
  PageResponse,
  InternalLink,
  ExternalLink,
  PaginatedResponse,
} from "../types/index.js";

let db: Database.Database | null = null;
let dbInode: number | null = null;

export function getDbPath(): string {
  return path.resolve(process.cwd(), "contentclaw.db");
}

export function getDb(): Database.Database {
  const dbPath = getDbPath();

  if (db) {
    try {
      const stat = fs.statSync(dbPath);
      if (dbInode !== null && stat.ino !== dbInode) {
        db.close();
        db = null;
        dbInode = null;
      }
    } catch {
      db.close();
      db = null;
      dbInode = null;
    }
  }

  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
    try {
      dbInode = fs.statSync(dbPath).ino;
    } catch {
      dbInode = null;
    }
  }
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      keyword TEXT NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      body TEXT NOT NULL,
      internal_links TEXT DEFAULT '[]',
      external_links TEXT DEFAULT '[]',
      page_type TEXT NOT NULL DEFAULT 'blog',
      published_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
    CREATE INDEX IF NOT EXISTS idx_pages_keyword ON pages(keyword);
  `);

  migrateSchema(database);
}

function migrateSchema(database: Database.Database): void {
  const cols = database.pragma("table_info(pages)") as { name: string }[];
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes("page_type")) {
    database.exec("ALTER TABLE pages ADD COLUMN page_type TEXT NOT NULL DEFAULT 'blog'");
  }
  if (!colNames.includes("external_links")) {
    database.exec("ALTER TABLE pages ADD COLUMN external_links TEXT DEFAULT '[]'");
  }
}

export function insertPage(page: Omit<StoredPage, "id" | "created_at" | "updated_at">): StoredPage {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO pages (slug, keyword, title, meta_description, body, internal_links, external_links, page_type, published_date)
    VALUES (@slug, @keyword, @title, @meta_description, @body, @internal_links, @external_links, @page_type, @published_date)
    ON CONFLICT(slug) DO UPDATE SET
      keyword = @keyword,
      title = @title,
      meta_description = @meta_description,
      body = @body,
      internal_links = @internal_links,
      external_links = @external_links,
      page_type = @page_type,
      published_date = @published_date,
      updated_at = datetime('now')
  `);
  const result = stmt.run(page);
  return getPageById(result.lastInsertRowid as number)!;
}

export function getPageById(id: number): StoredPage | undefined {
  const database = getDb();
  return database.prepare("SELECT * FROM pages WHERE id = ?").get(id) as
    | StoredPage
    | undefined;
}

export function getPageBySlug(slug: string): PageResponse | undefined {
  const database = getDb();
  const row = database.prepare("SELECT * FROM pages WHERE slug = ?").get(slug) as
    | StoredPage
    | undefined;
  if (!row) return undefined;
  return toPageResponse(row);
}

export function getPages(page: number = 1, limit: number = 20): PaginatedResponse<PageResponse> {
  const database = getDb();
  const offset = (page - 1) * limit;

  const totalRow = database.prepare("SELECT COUNT(*) as count FROM pages").get() as { count: number };
  const total = totalRow.count;

  const rows = database
    .prepare("SELECT * FROM pages ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as StoredPage[];

  return {
    data: rows.map(toPageResponse),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getAllPages(): PageResponse[] {
  const database = getDb();
  const rows = database
    .prepare("SELECT * FROM pages ORDER BY created_at DESC")
    .all() as StoredPage[];
  return rows.map(toPageResponse);
}

export function deletePageBySlug(slug: string): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM pages WHERE slug = ?").run(slug);
  return result.changes > 0;
}

function toPageResponse(row: StoredPage): PageResponse {
  let links: InternalLink[] = [];
  try {
    links = JSON.parse(row.internal_links);
  } catch {
    links = [];
  }
  let extLinks: ExternalLink[] = [];
  try {
    extLinks = JSON.parse(row.external_links || "[]");
  } catch {
    extLinks = [];
  }
  return {
    slug: row.slug,
    keyword: row.keyword,
    title: row.title,
    meta_description: row.meta_description,
    body: row.body,
    internal_links: links,
    external_links: extLinks,
    page_type: row.page_type || "blog",
    published_date: row.published_date,
    created_at: row.created_at,
  };
}

export function slugExists(slug: string): boolean {
  const database = getDb();
  const row = database.prepare("SELECT 1 FROM pages WHERE slug = ?").get(slug);
  return !!row;
}

export function getPageAge(slug: string): number | null {
  const database = getDb();
  const row = database.prepare("SELECT updated_at FROM pages WHERE slug = ?").get(slug) as { updated_at: string } | undefined;
  if (!row) return null;
  return Date.now() - new Date(row.updated_at).getTime();
}

export function getExistingSlugs(): Set<string> {
  const database = getDb();
  const rows = database.prepare("SELECT slug FROM pages").all() as { slug: string }[];
  return new Set(rows.map((r) => r.slug));
}

export function getExistingPageLinks(): { slug: string; title: string; keyword: string }[] {
  const database = getDb();
  return database
    .prepare("SELECT slug, title, keyword FROM pages ORDER BY created_at DESC")
    .all() as { slug: string; title: string; keyword: string }[];
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
