/**
 * Extracts moodleFunction and allowedRoles from all tool specs
 * and generates PHP code for plugin/lib.php
 *
 * Usage: npx tsx scripts/export-functions.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FunctionSpec {
  moodleFunction: string;
  allowedRoles: string[];
}

const TOOLS_DIR = join(__dirname, "../src/mcp/tools");
const ROLES = [
  "admin",
  "manager",
  "editingteacher",
  "teacher",
  "student",
  "user",
] as const;

type Role = (typeof ROLES)[number];

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".ts") && entry !== "index.ts") {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function extractFunctions(filePath: string): FunctionSpec[] {
  const content = readFileSync(filePath, "utf-8");
  const functions: FunctionSpec[] = [];

  // Match tool spec objects with moodleFunction and allowedRoles
  // Pattern: moodleFunction: "...", ... allowedRoles: [...]
  const toolRegex =
    /\{\s*name:\s*["']([^"']+)["'][\s\S]*?moodleFunction:\s*["']([^"']+)["'][\s\S]*?allowedRoles:\s*\[([\s\S]*?)\]/g;

  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const moodleFunction = match[2];
    const rolesStr = match[3];

    // Extract role strings from the array
    const roleMatches = rolesStr.match(/["']([^"']+)["']/g);
    const allowedRoles = roleMatches
      ? roleMatches.map((r) => r.replace(/["']/g, ""))
      : [];

    if (moodleFunction && allowedRoles.length > 0) {
      functions.push({ moodleFunction, allowedRoles });
    }
  }

  return functions;
}

function groupByService(functions: FunctionSpec[]): Record<string, string[]> {
  const services: Record<string, Set<string>> = {
    moodlemcp_admin: new Set(),
    moodlemcp_manager: new Set(),
    moodlemcp_editingteacher: new Set(),
    moodlemcp_teacher: new Set(),
    moodlemcp_student: new Set(),
    moodlemcp_user: new Set(),
  };

  for (const fn of functions) {
    const roles = fn.allowedRoles as Role[];

    // Add to services based on role presence
    // If a role is allowed, add to that service and all higher services
    if (roles.includes("user")) {
      services.moodlemcp_user.add(fn.moodleFunction);
      services.moodlemcp_student.add(fn.moodleFunction);
      services.moodlemcp_teacher.add(fn.moodleFunction);
      services.moodlemcp_editingteacher.add(fn.moodleFunction);
      services.moodlemcp_manager.add(fn.moodleFunction);
      services.moodlemcp_admin.add(fn.moodleFunction);
    } else if (roles.includes("student")) {
      services.moodlemcp_student.add(fn.moodleFunction);
      services.moodlemcp_teacher.add(fn.moodleFunction);
      services.moodlemcp_editingteacher.add(fn.moodleFunction);
      services.moodlemcp_manager.add(fn.moodleFunction);
      services.moodlemcp_admin.add(fn.moodleFunction);
    } else if (roles.includes("teacher")) {
      services.moodlemcp_teacher.add(fn.moodleFunction);
      services.moodlemcp_editingteacher.add(fn.moodleFunction);
      services.moodlemcp_manager.add(fn.moodleFunction);
      services.moodlemcp_admin.add(fn.moodleFunction);
    } else if (roles.includes("editingteacher")) {
      services.moodlemcp_editingteacher.add(fn.moodleFunction);
      services.moodlemcp_manager.add(fn.moodleFunction);
      services.moodlemcp_admin.add(fn.moodleFunction);
    } else if (roles.includes("manager")) {
      services.moodlemcp_manager.add(fn.moodleFunction);
      services.moodlemcp_admin.add(fn.moodleFunction);
    } else if (roles.includes("admin")) {
      services.moodlemcp_admin.add(fn.moodleFunction);
    }
  }

  // Convert Sets to sorted arrays
  const result: Record<string, string[]> = {};
  for (const [service, fns] of Object.entries(services)) {
    result[service] = Array.from(fns).sort();
  }
  return result;
}

function generatePhp(services: Record<string, string[]>): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(
    " * Returns service definitions with their assigned functions."
  );
  lines.push(" *");
  lines.push(
    " * GENERATED CODE - DO NOT EDIT MANUALLY"
  );
  lines.push(
    " * Run: cd server && npx tsx scripts/export-functions.ts"
  );
  lines.push(" *");
  lines.push(" * @return array Service definitions");
  lines.push(" */");
  lines.push("function local_moodlemcp_get_service_definitions(): array {");
  lines.push("    return [");

  const serviceOrder = [
    "moodlemcp_admin",
    "moodlemcp_manager",
    "moodlemcp_editingteacher",
    "moodlemcp_teacher",
    "moodlemcp_student",
    "moodlemcp_user",
  ];

  for (const serviceName of serviceOrder) {
    const functions = services[serviceName];
    lines.push("        [");
    lines.push(`            'shortname' => '${serviceName}',`);
    lines.push(`            'name' => '${serviceName}',`);
    lines.push(`            'functions' => [`);

    for (const fn of functions) {
      lines.push(`                '${fn}',`);
    }

    lines.push("            ],");
    lines.push("        ],");
  }

  lines.push("    ];");
  lines.push("}");

  return lines.join("\n");
}

// Main
console.log("Scanning tools directory:", TOOLS_DIR);

const tsFiles = getAllTsFiles(TOOLS_DIR);
console.log(`Found ${tsFiles.length} .ts files\n`);

const allFunctions: FunctionSpec[] = [];
for (const file of tsFiles) {
  const functions = extractFunctions(file);
  allFunctions.push(...functions);
}

// Deduplicate by moodleFunction name
const uniqueFunctions = new Map<string, FunctionSpec>();
for (const fn of allFunctions) {
  uniqueFunctions.set(fn.moodleFunction, fn);
}

console.log(`Extracted ${uniqueFunctions.size} unique functions\n`);

const services = groupByService(Array.from(uniqueFunctions.values()));

console.log("Functions per service:");
for (const [service, fns] of Object.entries(services)) {
  console.log(`  ${service}: ${fns.length} functions`);
}

const phpCode = generatePhp(services);
const outputPath = join(__dirname, "../../plugin/db/service_functions.php");

// Write to a separate PHP file that can be included
const phpFile = `<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Service function definitions for MoodleMCP.
 *
 * GENERATED CODE - DO NOT EDIT MANUALLY
 * Run: cd server && npx tsx scripts/export-functions.ts
 *
 * @package    local_moodlemcp
 * @copyright  2026 Studio LXD <hello@studiolxd.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

${phpCode}
`;

writeFileSync(outputPath, phpFile);
console.log(`\nPHP code written to: ${outputPath}`);
