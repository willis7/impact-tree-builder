import DOMPurify from "dompurify";

/**
 * Simple HTML tag remover for when DOMPurify isn't available
 * Only used in test environments
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Get DOMPurify instance, handling both browser and test environments
 */
function getSanitizer() {
  if (typeof window === "undefined") {
    // In Node/test environment, use simple fallback
    return null;
  }
  return DOMPurify;
}

/**
 * Configuration options for sanitization
 */
interface SanitizeOptions {
  /** Allow HTML tags (default: false) */
  allowHtml?: boolean;
  /** Custom allowed tags */
  allowedTags?: string[];
  /** Custom allowed attributes */
  allowedAttributes?: string[];
}

/**
 * Sanitizes user input to prevent XSS attacks.
 *
 * This utility implements security requirements from the project constitution:
 * - Sanitizes all user inputs before storing or rendering
 * - Prevents XSS (Cross-Site Scripting) attacks
 * - Configurable for different input types
 *
 * @param input - The user input string to sanitize
 * @param options - Optional configuration for sanitization
 * @returns Sanitized string safe for use in the application
 *
 * @example Basic text sanitization
 * ```typescript
 * const safeName = sanitizeInput(userInput);
 * ```
 *
 * @example Allow specific HTML
 * ```typescript
 * const safeDescription = sanitizeInput(userInput, {
 *   allowHtml: true,
 *   allowedTags: ['b', 'i', 'em', 'strong', 'p']
 * });
 * ```
 */
export function sanitizeInput(
  input: string,
  options: SanitizeOptions = {}
): string {
  const {
    allowHtml = false,
    allowedTags = [],
    allowedAttributes = [],
  } = options;

  const sanitizer = getSanitizer();

  // If no HTML is allowed, strip all tags
  if (!allowHtml) {
    if (!sanitizer) {
      // Test environment fallback
      return stripHtmlTags(input).trim();
    }

    return sanitizer
      .sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      })
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  // If HTML is allowed, use custom configuration
  if (!sanitizer) {
    // Test environment fallback - be more permissive but still remove dangerous tags
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "");
  }

  return sanitizer.sanitize(input, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitizes a node name (no HTML allowed)
 *
 * @param name - Node name from user input
 * @returns Sanitized node name
 */
export function sanitizeNodeName(name: string): string {
  return sanitizeInput(name).trim();
}

/**
 * Sanitizes a node description (basic formatting allowed)
 *
 * @param description - Node description from user input
 * @returns Sanitized description with safe HTML
 */
export function sanitizeDescription(description: string): string {
  return sanitizeInput(description, {
    allowHtml: true,
    allowedTags: ["b", "i", "em", "strong", "p", "br"],
    allowedAttributes: [],
  });
}

/**
 * Sanitizes measurement names and values
 *
 * @param text - Measurement text from user input
 * @returns Sanitized text
 */
export function sanitizeMeasurementText(text: string): string {
  return sanitizeInput(text).trim();
}

/**
 * Validates and sanitizes numeric input
 *
 * @param value - Numeric value as string
 * @param defaultValue - Default value if invalid (default: 0)
 * @returns Valid number
 */
export function sanitizeNumericInput(value: string, defaultValue = 0): number {
  const sanitized = sanitizeInput(value);
  const num = parseFloat(sanitized);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Validates and sanitizes JSON data from localStorage
 *
 * @param jsonString - JSON string to validate
 * @returns Parsed and validated JSON object, or null if invalid
 */
export function sanitizeJsonInput<T>(jsonString: string): T | null {
  try {
    // First sanitize the string
    const sanitized = sanitizeInput(jsonString);

    // Parse JSON
    const parsed = JSON.parse(sanitized);

    // Basic validation - ensure it's an object
    if (typeof parsed !== "object" || parsed === null) {
      console.error("Invalid JSON: not an object");
      return null;
    }

    return parsed as T;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
}
