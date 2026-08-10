# html2cn

**English articles → Beautiful Chinese reading experience, in one click.**

`html2cn` extracts content from any English article (URL or HTML), preserves images and structure, and provides AI translation prompts so you can turn it into a well-formatted Chinese article — ready for reading, sharing, or PDF export.

## Why

Reading English articles is fine. Reading a beautifully typeset Chinese version with all images intact and a natural, conversational tone is better. `html2cn` handles the tedious parts — content extraction, Markdown cleanup, typography-ready PDF rendering — so you only do the creative part: translating with your favorite AI.

## Features

- **Clean extraction** — Uses Mozilla Readability to pull article body content, stripping nav, ads, sidebars, and cruft. Images, headings, lists, quotes, and code blocks are all preserved
- **AI-powered translation** — Built-in translation prompt templates (casual, storytelling, bilingual) with one-click copy + jump to DeepSeek, Doubao, Kimi, Tongyi, Claude, or ChatGPT
- **Image protection** — All `![](url)` markup is locked in place; translation won't lose images
- **Chinese-first PDF** — Puppeteer-rendered PDF with proper Chinese typography (A4, custom fonts supported, print-optimized CSS)
- **Web UI + CLI** — Browser-based interface for quick use, or command-line for scripting

## Quick Start

```bash
# Install dependencies
npm install

# Start the web UI
npm start
```

Open `http://localhost:3456` and follow the 3-step flow:

1. **Input article** — Paste a URL or HTML source, click extract
2. **Translate** — Copy the English Markdown + translation prompt, paste into any AI platform
3. **Download** — Paste the Chinese result back, download as Markdown or convert to PDF

## CLI

```bash
# Extract English Markdown from a URL
node cli.js extract https://example.com/article -o output/en.md

# Extract from local HTML file
node cli.js extract article.html -o output/en.md

# Convert Markdown to PDF (Chinese typography)
node cli.js pdf output/cn.md -o output/article.pdf

# Use custom Chinese font
node cli.js pdf output/cn.md --font ./fonts/LXGWWenKai.ttf
```

## How It Works

```
URL / HTML
  → [Mozilla Readability] extract article body
  → [Turndown] convert to clean Markdown
  → [AI platform] translate to Chinese
  → [Marked + Puppeteer] render as PDF with Chinese layout
```

## Project Structure

```
html2cn/
├── cli.js                  # CLI entry point
├── src/
│   ├── server.js           # Express web server
│   ├── ui.html             # Web UI
│   ├── extractor.js        # HTML → Markdown extraction
│   ├── translate-helper.js # Translation prompt helper
│   ├── pdf.js              # Markdown → PDF rendering
│   └── template.html       # PDF layout template
├── output/                 # Default output directory
└── fonts/                  # Custom fonts (optional)
```

## Dependencies

| Package | Purpose |
|---|---|
| [@mozilla/readability](https://github.com/mozilla/readability) | Article body extraction |
| [jsdom](https://github.com/jsdom/jsdom) | DOM parsing in Node.js |
| [turndown](https://github.com/mixmark-io/turndown) | HTML → Markdown conversion |
| [marked](https://github.com/markedjs/marked) | Markdown → HTML |
| [puppeteer](https://github.com/puppeteer/puppeteer) | HTML → PDF rendering |
| [express](https://github.com/expressjs/express) | Web server |
| [commander](https://github.com/tj/commander.js) | CLI argument parsing |

## Custom Fonts

For better Chinese typography in PDF output, download a Chinese font (e.g., [LXGW WenKai](https://github.com/lxgw/LxgwWenKai)) and place it in the `fonts/` directory, then use:

```bash
node cli.js pdf article.md --font ./fonts/LXGWWenKai.ttf
```

## License

MIT
