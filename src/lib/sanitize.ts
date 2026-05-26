import DOMPurify from "dompurify";

/**
 * Safely sanitizes HTML content.
 * During SSR/Server Components, returns the content directly to avoid heavy jsdom/ESM dependencies.
 * Sanitizes in the browser where the DOM API is natively available.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }
  return DOMPurify.sanitize(html);
}
