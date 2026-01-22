import katex from 'katex';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Renders math formulas in HTML content using KaTeX
 * Converts LaTeX stored in data-latex attributes to rendered math
 */
export function renderMathInHTML(html: string): string {
  // Create a temporary div to parse HTML
  if (typeof window === 'undefined') {
    // Server-side: return as-is
    return html;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = DOMPurify.sanitize(html);

  // Find all elements with data-latex attribute
  const mathElements = tempDiv.querySelectorAll('[data-latex]');

  mathElements.forEach((element) => {
    const latex = element.getAttribute('data-latex');
    if (latex) {
      try {
        const rendered = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        element.innerHTML = rendered;
        element.classList.add('math-rendered');
      } catch (e) {
        // Fallback to showing LaTeX as text
        element.textContent = latex;
      }
    }
  });

  return tempDiv.innerHTML;
}

/**
 * Renders math formulas in a DOM element
 * Call this in useEffect when content changes
 */
export function renderMathInElement(element: HTMLElement): void {
  const mathElements = element.querySelectorAll('[data-latex]');

  mathElements.forEach((el) => {
    const latex = el.getAttribute('data-latex');
    if (latex && !el.classList.contains('math-rendered')) {
      try {
        const rendered = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        el.innerHTML = rendered;
        el.classList.add('math-rendered');
      } catch (e) {
        el.textContent = latex;
      }
    }
  });
}
