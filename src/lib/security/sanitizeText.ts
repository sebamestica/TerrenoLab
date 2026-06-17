/**
 * sanitizeText.ts
 * Helper utilities to sanitize user-provided text to prevent injection or UI breakage.
 */

/**
 * Sanitizes a generic text string by removing potentially dangerous HTML tags
 * and limiting its length to prevent UI overflow or memory abuse.
 */
export function sanitizeText(value: unknown, maxLength = 120): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Remove common dangerous characters for HTML/JS injection
  // We keep it strict: only alphanumeric, spaces, and safe punctuation.
  // Replacing <, >, `, ', " with spaces or removing them entirely.
  let sanitized = str.replace(/[<>"'`]/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
}

/**
 * Sanitizes a filename to ensure it is safe to display or export.
 */
export function sanitizeFilename(value: unknown, fallback = 'sin_nombre'): string {
  if (value === null || value === undefined) return fallback;
  
  const str = String(value);
  
  // Keep only alphanumeric, dots, dashes, underscores, and spaces.
  let sanitized = str.replace(/[^a-zA-Z0-9.\-_ ]/g, '');
  
  sanitized = sanitized.trim();
  
  if (!sanitized) {
    return fallback;
  }
  
  // Max filename length approx 150 chars to avoid OS limits
  if (sanitized.length > 150) {
    sanitized = sanitized.substring(0, 150);
  }
  
  return sanitized;
}
