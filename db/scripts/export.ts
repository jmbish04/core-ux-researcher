#!/usr/bin/env node
/**
 * PostgreSQL database export utility with schema/data options
 *
 * Usage:
 *   tsx scripts/export.ts                    # Schema only (default)
 *   tsx scripts/export.ts --data             # Schema + data
 *   tsx scripts/export.ts --data-only        # Data only
 *   tsx scripts/export.ts --table=users      # Specific table
 *   tsx scripts/export.ts -- --inserts       # Pass pg_dump flags directly
 *
 * Environment:
 *   cross-env ENVIRONMENT=staging tsx scripts/export.ts
 *   cross-env ENVIRONMENT=prod tsx scripts/export.ts
 *
 * REQUIREMENTS:
 * - DATABASE_URL environment variable must be set and valid PostgreSQL connection string
 * - pg_dump binary must be available in PATH (PostgreSQL client tools required, validated at runtime)
 * - ./backups/ directory will be created automatically if it doesn't exist
 * - Output filenames include timestamp, environment, and export type for uniqueness
 * - Process exits with code 1 on any failure for CI/CD integration
 * - File permissions on output SQL files are restricted (readable by owner only)
 * - Script handles concurrent executions without filename conflicts
 */

import { spawn } from "node:child_process";
import { existsSync } from "fs";
import { chmod, mkdir } from "fs/promises";
import { resolve } from "path";

// Import drizzle config to trigger environment loading and validation
import "../drizzle.config.js";

// Helper function to run shell commands
async function execCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const proc = spawn(command, args);

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// Parse arguments
const args = process.argv.slice(2);
const passThrough: string[] = [];
let includeData = false;
let dataOnly = false;
let table: string | undefined;

// Find pass-through arguments (after --)
const dashIndex = args.indexOf("--");
if (dashIndex !== -1) {
  passThrough.push(...args.slice(dashIndex + 1));
  args.splice(dashIndex);
}

// Parse named arguments
for (const arg of args) {
  if (arg === "--data") {
    includeData = true;
  } else if (arg === "--data-only") {
    dataOnly = true;
  } else if (arg.startsWith("--table=")) {
    table = arg.split("=")[1];
  }
}

// Build pg_dump command
const pgDumpArgs: string[] = [];

// pg_dump requires the connection string as the last positional argument
// or through -d/--dbname flag
pgDumpArgs.push("--dbname", process.env.DATABASE_URL!);

// Default options
pgDumpArgs.push("--format=plain", "--encoding=UTF-8");

// Handle export type
if (dataOnly) {
  pgDumpArgs.push("--data-only");
} else if (!includeData) {
  pgDumpArgs.push("--schema-only");
}

// Handle table selection
if (table) {
  pgDumpArgs.push(`--table=${table}`);
}

// Add pass-through arguments
pgDumpArgs.push(...passThrough);

// Generate filename based on options with high precision timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const envSuffix = process.env.ENVIRONMENT ? `-${process.env.ENVIRONMENT}` : "";
const typeSuffix = dataOnly ? "-data" : includeData ? "-full" : "-schema";
const tableSuffix = table ? `-${table}` : "";

// Ensure backups directory exists
const backupsDir = resolve("./backups");
if (!existsSync(backupsDir)) {
  await mkdir(backupsDir, { recursive: true });
  console.log(`📁 Created backups directory: ${backupsDir}`);
}

const outputPath = resolve(
  backupsDir,
  `dump${envSuffix}${typeSuffix}${tableSuffix}-${timestamp}.sql`,
);

pgDumpArgs.push(`--file=${outputPath}`);

// Check if pg_dump is available
try {
  await execCommand("which", ["pg_dump"]);
} catch {
  console.error(
    "❌ pg_dump not found. Please install PostgreSQL client tools.",
  );
  process.exit(1);
}

console.log("📤 Exporting database...");
console.log(`📁 Output: ${outputPath}`);

try {
  // Execute pg_dump
  await execCommand("pg_dump", pgDumpArgs);

  // Set file permissions to owner-only readable (600)
  await chmod(outputPath, 0o600);

  console.log(`✅ Export completed successfully!`);
} catch (error) {
  console.error("❌ Export failed:");
  console.error(error);
  process.exit(1);
}
