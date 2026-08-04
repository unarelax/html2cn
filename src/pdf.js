const { marked } = require('marked');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Render Markdown to a full HTML page using the template.
 * @param {string} markdown - Markdown content
 * @param {string} fontPath - Path to the font file (or empty)
 */
function renderHTML(markdown, fontPath = '') {
  const templatePath = path.join(__dirname, 'template.html');
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Extract title from first H1
  const titleMatch = markdown.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : '文章';

  // Convert markdown to HTML body
  const bodyHTML = marked.parse(markdown);

  // Fill template
  const html = template
    .replace('{{TITLE}}', escapeHTML(title))
    .replace('{{CONTENT}}', bodyHTML)
    .replace('{{FONT_PATH}}', fontPath);

  return { html, title };
}

/**
 * Export Markdown to PDF.
 * @param {string} markdown - Markdown content (Chinese or English)
 * @param {string} outputPath - Output PDF file path
 * @param {object} options
 * @param {string} options.fontPath - Optional path to font file for Chinese rendering
 */
async function exportPDF(markdown, outputPath, options = {}) {
  const { fontPath = '' } = options;
  const { html } = renderHTML(markdown, fontPath);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '18mm',
        right: '18mm',
      },
      printBackground: true,
      displayHeaderFooter: false,
    });

    console.log(`PDF 已导出: ${outputPath}`);
  } finally {
    await browser.close();
  }

  return outputPath;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { exportPDF, renderHTML };
