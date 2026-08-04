#!/usr/bin/env node
const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { extract } = require('./src/extractor');
const { generate } = require('./src/translate-helper');
const { exportPDF } = require('./src/pdf');
const app = require('./src/server');

const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

program
  .name('html2cn')
  .description('英文 HTML 文章 → 趣味中文精美排版工具')
  .version('1.0.0');

// ---- extract command ----
program
  .command('extract')
  .description('从 URL 或本地 HTML 文件提取文章内容，生成英文 Markdown')
  .argument('<input>', '文章 URL 或本地 HTML 文件路径')
  .option('-o, --output <path>', '输出 Markdown 文件路径（默认: output/<title>.md）')
  .action(async (input, options) => {
    try {
      console.log('正在提取文章内容...\n');

      const { markdown, title } = await extract(input);
      const safeName = title.replace(/[\/\\:*?"<>|]/g, '-').substring(0, 60);
      const outPath = options.output || path.join(OUTPUT_DIR, `${safeName}.md`);

      // Ensure output directory exists for the file
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      fs.writeFileSync(outPath, markdown, 'utf-8');
      console.log(`英文 Markdown 已保存: ${outPath}`);
      console.log(`文章标题: ${title}`);
      console.log(`字符数: ${markdown.length}`);

      // Generate translation helper page
      const helperPath = generate(markdown, title, outDir);
      console.log(`翻译助手页面: ${helperPath}\n`);

      // Print translation tool links
      console.log('── 下一步：翻译 ──');
      console.log('在浏览器中打开翻译助手页面，或直接访问：');
      console.log('  豆包:       https://www.doubao.com/chat');
      console.log('  DeepSeek:   https://chat.deepseek.com');
      console.log('  Kimi:       https://kimi.moonshot.cn');
      console.log('  通义千问:   https://tongyi.aliyun.com');
      console.log('  Claude:     https://claude.ai');
      console.log('  ChatGPT:    https://chat.openai.com');
      console.log('');
      console.log('将英文 Markdown 复制到上述任一平台翻译为中文，');
      console.log('翻译完成后保存为 cn.md，然后运行:');
      console.log(`  node cli.js pdf ${path.join(outDir, 'cn.md')} -o ${path.join(outDir, 'article.pdf')}`);
    } catch (err) {
      console.error('提取失败:', err.message);
      process.exit(1);
    }
  });

// ---- pdf command ----
program
  .command('pdf')
  .description('将 Markdown 文件转换为精美排版 PDF')
  .argument('<markdown>', 'Markdown 文件路径')
  .option('-o, --output <path>', '输出 PDF 文件路径（默认: 同名的 .pdf 文件）')
  .option('--font <path>', '自定义中文字体文件路径（.ttf/.otf）')
  .action(async (mdPath, options) => {
    try {
      if (!fs.existsSync(mdPath)) {
        throw new Error(`文件不存在: ${mdPath}`);
      }

      const markdown = fs.readFileSync(mdPath, 'utf-8');
      const outPath = options.output || mdPath.replace(/\.\w+$/, '.pdf');

      console.log('正在生成 PDF...');
      await exportPDF(markdown, outPath, {
        fontPath: options.font || '',
      });
    } catch (err) {
      console.error('PDF 生成失败:', err.message);
      process.exit(1);
    }
  });

// ---- serve command ----
program
  .command('serve')
  .description('启动 Web UI 界面（浏览器中操作）')
  .option('-p, --port <number>', '端口号（默认: 3456）', '3456')
  .action(async (options) => {
    const port = parseInt(options.port) || 3456;
    app.listen(port, () => {
      console.log('');
      console.log('  HTML → 中文 精美排版工具');
      console.log('  ─────────────────────────');
      console.log(`  Web UI:  http://localhost:${port}`);
      console.log('');
      console.log('  在浏览器中打开上述地址即可使用。');
      console.log('');
    });
  });

program.parse();
