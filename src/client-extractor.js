import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

/**
 * Fetch HTML from a URL. Tries direct fetch first, then several CORS proxies.
 * Static sites can't fetch arbitrary cross-origin URLs without a proxy, so we
 * fall back through a list of public CORS proxies in order of reliability.
 */
const CORS_PROXIES = [
  (url) => `https://proxy.cors.sh/${url}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

async function fetchWithTimeout(url, timeoutMs) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function fetchHTML(url) {
  // 1) Direct fetch — works for sites that already send CORS headers
  try {
    return await fetchWithTimeout(url, 15000);
  } catch (e) {
    // fall through to proxies
  }

  // 2) Try each CORS proxy in order
  let lastError = null;
  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const proxyUrl = buildProxyUrl(url);
      const text = await fetchWithTimeout(proxyUrl, 30000);
      // Some proxies return an error page/JSON instead of the real article
      if (text && !text.trim().startsWith('{') && text.length > 500) {
        return text;
      }
      lastError = new Error('Proxy returned invalid content');
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    '无法直接抓取该网页（跨域限制）。请回到第 1 步，切换到「粘贴 HTML」标签，用浏览器打开文章后「查看源代码」复制全文粘贴进来。' +
      (lastError ? `（原因: ${lastError.message}）` : '')
  );
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
