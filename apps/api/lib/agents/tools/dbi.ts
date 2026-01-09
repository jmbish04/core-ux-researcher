/**
 * @module DBI_Tools
 * @description
 * Domain-specific tools for data processing and classification.
 */

/**
 * Generates wildcard patterns for contractor name matching.
 * Used to create fuzzy search patterns from contractor identifiers.
 *
 * @param {Env} env - The environment bindings
 * @param {string} input - Input string containing contractor name/license
 * @returns {Promise<string[]>} Array of wildcard patterns for SoQL matching
 */
export async function generateContractorWildcards(
  env: Env,
  input: string,
): Promise<string[]> {
  const patterns: string[] = [];
  const cleaned = input.trim().toUpperCase();

  if (!cleaned) return patterns;

  // Direct match pattern
  patterns.push(`%${cleaned}%`);

  // Extract license numbers (typically numeric patterns)
  const licenseMatch = cleaned.match(/\b(\d{5,10})\b/);
  if (licenseMatch) {
    patterns.push(`%${licenseMatch[1]}%`);
  }

  // Generate name-based patterns
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
  for (const word of words) {
    if (!/^\d+$/.test(word)) {
      patterns.push(`%${word}%`);
    }
  }

  return [...new Set(patterns)];
}

/**
 * Classifies user intent from a natural language query.
 * Returns a mode string that can be used to route to the appropriate agent.
 *
 * @param {Env} env - The environment bindings
 * @param {string} query - Natural language query from user
 * @returns {Promise<string>} Classification result (e.g., "nl_analyst", "data_pull")
 */
export async function classifyIntent(
  env: Env,
  query: string,
): Promise<string> {
  const lowercased = query.toLowerCase();

  // Analysis patterns
  if (/analy|insight|trend|pattern|anomal/i.test(lowercased)) {
    return "nl_analyst";
  }

  // Bulk data patterns
  if (/bulk|all|export|download|mass/i.test(lowercased)) {
    return "bulk_analysis";
  }

  // UX Research patterns
  if (/ux|wireframe|component|frontend|ui|design|user story/i.test(lowercased)) {
    return "ux_research";
  }

  // Default to data pull
  return "data_pull";
}
