import chalk from "chalk";
import figlet from "figlet";

export function showBanner(): void {
  const banner = figlet.textSync("ContentClaw", {
    font: "Small",
    horizontalLayout: "default",
  });

  console.log(chalk.hex("#f97316")(banner));
  console.log(
    chalk.gray("  Programmatic SEO Engine — ") +
      chalk.hex("#f97316").bold("by metehan.ai") +
      "\n"
  );
}

export function info(msg: string): void {
  console.log(chalk.blue("ℹ") + " " + msg);
}

export function success(msg: string): void {
  console.log(chalk.green("✔") + " " + msg);
}

export function warn(msg: string): void {
  console.log(chalk.yellow("⚠") + " " + msg);
}

export function error(msg: string): void {
  console.log(chalk.red("✖") + " " + msg);
}

export function dim(msg: string): void {
  console.log(chalk.dim(msg));
}
