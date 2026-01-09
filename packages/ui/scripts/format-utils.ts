#!/usr/bin/env node
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Execute a command with inherited stdio
 */
export async function execCommand(
  command: string,
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: "inherit",
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed: ${command} ${args.join(" ")}`));
      } else {
        resolve();
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Format generated UI component files with Prettier
 */
export async function formatGeneratedFiles(): Promise<void> {
  try {
    const componentsDir = join(__dirname, "../components");

    const componentFiles = await glob("**/*.{ts,tsx}", {
      cwd: componentsDir,
      absolute: true,
    });

    if (componentFiles.length === 0) {
      return;
    }

    console.log("🎨 Formatting generated files with Prettier...");

    await execCommand("npx", ["prettier", "--write", ...componentFiles]);

    console.log("✨ Files formatted successfully");
  } catch (error) {
    console.warn("⚠️  Failed to format files with Prettier:", error);
  }
}
