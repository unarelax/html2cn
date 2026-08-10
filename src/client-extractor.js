import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

/**
 * Fetch HTML from a URL via a CORS proxy.
 */
async function fetchHTML(url) {
  // Try direct fetch first
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) return await res.text();
  } catch (e) {
    // fall through to proxy
  }

  // Fallback: use allorigins CORS proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Failed to fetch: HTTP ${res.status}`);
  return await res.text();
}

/**
 * Extract article content from HTML string using Readability.
 */
function extractContent(html, url = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Remove clutter before extraction
  doc.querySelectorAll('script, style, noscript, iframe, nav, footer, .sidebar, .ad, .advertisement, [role="navigation"], [role="banner"], .nav, .footer, .header-nav, .social-share, .related-posts, .comments, .comment').forEach(el => el.remove());

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    throw new Error('Could not extract article content. The page may not be an article.');
  }

  return {
    title: article.title || 'Untitled',
    htmlContent: article.content || '',
  };
}

/**
 * Convert extracted HTML to clean Markdown.
 */
function htmlToMarkdown(htmlContent, title) {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  turndown.addRule('images', {
    filter: 'img',
    replacement: (content, node) => {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      if (!src) return '';
      return `\n\n![${alt}](${src})\n\n`;
    },
  });

  turndown.addRule('pre', {
    filter: 'pre',
    replacement: (content, node) => {
      const code = node.querySelector('code');
      const text = code ? code.textContent : node.textContent;
      return `\n\n\`\`\`\n${text.trim()}\n\`\`\`\n\n`;
    },
  });

  turndown.addRule('figure', {
    filter: 'figure',
    replacement: (content, node) => {
      const img = node.querySelector('img');
      const figcaption = node.querySelector('figcaption');
      if (img) {
        const alt = img.getAttribute('alt') || '';
        const src = img.getAttribute('src') || '';
        let md = `\n\n![${alt}](${src})\n\n`;
        if (figcaption && figcaption.textContent.trim()) {
          md += `*${figcaption.textContent.trim()}*\n\n`;
        }
        return md;
      }
      return content;
    },
  });

  turndown.addRule('blockquote', {
    filter: 'blockquote',
    replacement: (content) => {
      return '\n\n' + content.trim().split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
    },
  });

  let markdown = turndown.turndown(htmlContent);
  markdown = markdown
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^\s+/, '')
    .replace(/\s+$/, '\n');

  return `# ${title}\n\n${markdown}`;
}

/**
 * Main entry: extract article from URL or HTML string.
 * @param {string} input - URL or HTML content
 * @returns {{ markdown: string, title: string }}
 */
export async function extract(input) {
  const isURL = /^https?:\/\//i.test(input);
  const html = isURL ? await fetchHTML(input) : input;
  const sourceUrl = isURL ? input : '';

  const { title, htmlContent } = extractContent(html, sourceUrl);
  const markdown = htmlToMarkdown(htmlContent, title);

  return { markdown, title };
}
