// backend/utils/normalize.js
// Course code normalization utility

/**
 * Normalize course code for consistent matching and storage
 * - Trim whitespace
 * - Uppercase
 * - Collapse multiple whitespace to single space
 * - Treat '.' and '-' and spaces as equivalent separators between subject and number
 * - Canonical form: "SPAN-UA 9050" (subject-number with space)
 * 
 * Examples:
 * - "SPAN-UA.9050" → "SPAN-UA 9050"
 * - "SPAN-UA 9050" → "SPAN-UA 9050"
 * - "span-ua 9050" → "SPAN-UA 9050"
 * - "WREX-UF 9101" → "WREX-UF 9101"
 * - "WREX-UF.9101" → "WREX-UF 9101"
 */
function normalizeCourseCode(code) {
  if (!code || typeof code !== 'string') return '';
  
  // Trim and uppercase
  let normalized = code.trim().toUpperCase();
  
  // Collapse multiple whitespace to single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Replace dots and dashes with spaces, then collapse spaces again
  // This treats "SPAN-UA.9050" and "SPAN-UA 9050" as equivalent
  normalized = normalized.replace(/[.\-]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

module.exports = { normalizeCourseCode };
