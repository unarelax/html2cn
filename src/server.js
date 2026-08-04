const express = require('express');
const path = require('path');
const fs = require('fs');
const { extract } = require('./extractor');
const { exportPDF } = require('./pdf');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Serve static UI
const uiPath = path.join(__dirname, 'ui.html');
app.get('/', (req, res) => res.sendFile(uiPath));

// API: Extract article content
app.post('/api/extract', async (req, res) => {
  try {
    const { url, html } = req.body;
    let input;

    if (url) {
      input = url;
    } else if (html) {
      // Write temp HTML file for extractor
      const tmpPath = path.join(__dirname, '..', 'output', '_temp.html');
      fs.writeFileSync(tmpPath, html, 'utf-8');
      input = tmpPath;
    } else {
      return res.status(400).json({ error: '请提供 URL 或 HTML 内容' });
    }

    const { markdown, title } = await extract(input);

    // Cleanup temp file
    const tmpPath = path.join(__dirname, '..', 'output', '_temp.html');
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    res.json({ success: true, markdown, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Generate PDF
app.post('/api/pdf', async (req, res) => {
  try {
    const { markdown } = req.body;
    if (!markdown) {
      return res.status(400).json({ error: '请提供 Markdown 内容' });
    }

    const outPath = path.join(__dirname, '..', 'output', 'article.pdf');
    await exportPDF(markdown, outPath);

    res.json({ success: true, path: '/api/download' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Download generated PDF
app.get('/api/download', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'output', 'article.pdf');
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF 文件不存在，请先生成' });
  }
  res.download(pdfPath, 'article.pdf');
});

// API: Download markdown
app.post('/api/download-md', (req, res) => {
  const { markdown, filename } = req.body;
  if (!markdown) return res.status(400).json({ error: '无内容' });
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename || 'article'}.md"`);
  res.send(markdown);
});

module.exports = app;
