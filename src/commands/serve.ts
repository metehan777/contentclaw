import chalk from "chalk";
import { readConfig, configExists, getDefaultConfig } from "../utils/config.js";
import { createServer } from "../api/server.js";
import { getDb } from "../core/store.js";
import * as logger from "../utils/logger.js";

interface ServeOptions {
  port?: string;
  host?: string;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  let config;
  if (configExists()) {
    config = readConfig();
  } else {
    config = getDefaultConfig();
  }

  const port = options.port ? parseInt(options.port, 10) : config.server.port;
  const host = options.host || config.server.host;

  getDb();

  try {
    await createServer({ port, host });

    const url = `http://${host}:${port}`;

    console.log("");
    logger.success("ContentClaw is running!\n");
    console.log(
      chalk.gray("  Dashboard:  ") + chalk.cyan.bold(url)
    );
    console.log(
      chalk.gray("  API Docs:   ") + chalk.cyan.bold(`${url}/docs`)
    );
    console.log(
      chalk.gray("  API Base:   ") + chalk.cyan(`${url}/api`)
    );
    console.log("");
    console.log(chalk.gray("  Endpoints:"));
    console.log(
      chalk.gray("  ├─ ") +
        chalk.white("GET  ") +
        chalk.cyan("/api/health") +
        chalk.gray("         Health check")
    );
    console.log(
      chalk.gray("  ├─ ") +
        chalk.white("GET  ") +
        chalk.cyan("/api/pages") +
        chalk.gray("          List pages")
    );
    console.log(
      chalk.gray("  ├─ ") +
        chalk.white("GET  ") +
        chalk.cyan("/api/pages/:slug") +
        chalk.gray("    Get page")
    );
    console.log(
      chalk.gray("  ├─ ") +
        chalk.white("DEL  ") +
        chalk.cyan("/api/pages/:slug") +
        chalk.gray("    Delete page")
    );
    console.log(
      chalk.gray("  └─ ") +
        chalk.white("POST ") +
        chalk.cyan("/api/generate") +
        chalk.gray("       Generate pages")
    );
    console.log("");
    logger.dim("  Press Ctrl+C to stop.");
    console.log("");
  } catch (err) {
    logger.error(
      `Failed to start server: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}
