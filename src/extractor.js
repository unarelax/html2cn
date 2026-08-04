const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');
const fs = require('fs');

/**
 * Fetch HTML from a URL
 */
async function fetchHTML(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Read HTML from a local file
 */
function readLocalHTML(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Extract article content from HTML using Readability.
 * Returns { title, htmlContent } of the extracted article body.
 */
function extractContent(html, url = '') {
  const dom = new JSDOM(html, { url: url || 'https://localhost/' });
  const doc = dom.window.document;

  // Remove scripts, styles, noscript, iframes before extraction
  doc.querySelectorAll('script, style, noscript, iframe, nav, footer, .sidebar, .ad, .advertisement, [role="navigation"], [role="banner"], .nav, .footer, .header-nav, .social-share, .related-posts, .comments, .comment').forEach(el => el.remove());

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    throw new Error('无法从页面中提取文章内容，请检查输入是否为有效的文章页面。');
  }

  return {
    title: article.title || 'Untitled',
    htmlContent: article.content || '',
  };
}

/**
 * Convert extracted HTML content to clean Markdown.
 * Preserves images, headings, paragraphs, lists, blockquotes, code blocks.
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

  // Custom image rule: preserve alt text and URL
  turndown.addRule('images', {
    filter: 'img',
    replacement: (content, node) => {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      if (!src) return '';
      return `\n\n![${alt}](${src})\n\n`;
    },
  });

  // Preformatted / code blocks
  turndown.addRule('pre', {
    filter: 'pre',
    replacement: (content, node) => {
      const code = node.querySelector('code');
      const text = code ? code.textContent : node.textContent;
      return `\n\n\`\`\`\n${text.trim()}\n\`\`\`\n\n`;
    },
  });

  // Figure elements (common in article bodies)
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

  // Blockquotes
  turndown.addRule('blockquote', {
    filter: 'blockquote',
    replacement: (content) => {
      return '\n\n' + content.trim().split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
    },
  });

  // Clean up extra whitespace and blank lines
  let markdown = turndown.turndown(htmlContent);

  // Post-process: normalize spacing
  markdown = markdown
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^\s+/, '')
    .replace(/\s+$/, '\n');

  // Prepend title as H1
  const result = `# ${title}\n\n${markdown}`;

  return result;
}

/**
 * Main entry: extract article from url/html, output clean markdown.
 * @param {string} input - URL or local file path
 * @returns {{ markdown: string, title: string }}
 */
async function extract(input) {
  const isURL = /^https?:\/\//i.test(input);
  const html = isURL ? await fetchHTML(input) : readLocalHTML(input);
  const sourceUrl = isURL ? input : '';

  const { title, htmlContent } = extractContent(html, sourceUrl);
  const markdown = htmlToMarkdown(htmlContent, title);

  return { markdown, title };
}

module.exports = { extract, fetchHTML, readLocalHTML, extractContent, htmlToMarkdown };
