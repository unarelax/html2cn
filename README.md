# HTML → 趣味中文排版

将英文网页文章一键转为轻松有趣的中文阅读版，支持 Markdown 导出和 PDF 排版。

## 工作流

```
英文文章 URL/HTML → 提取正文+配图 → AI 翻译为趣味中文 → 精美 Markdown/PDF 输出
```

## 功能

- **精准提取**：基于 Mozilla Readability，自动过滤导航、广告、侧边栏，保留图片、标题、段落、列表、引用
- **翻译助手**：内置翻译指令模板，一键跳转豆包/DeepSeek/通义千问，复制即用
- **图片保护**：Markdown `![](url)` 格式锁定图片位置，翻译过程不丢失
- **格式转换**：一键跳转 Markdown 转 Word 工具
- **PDF 导出**：中文排版精美，支持自定义字体

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Web 界面
npm start
```

浏览器打开 ``，三步完成：

1. **输入文章** — 粘贴 URL 或 HTML 源码，点击提取
2. **提取 & 翻译** — 复制原文+翻译指令，跳转 AI 平台翻译
3. **粘贴中文** — 贴回译文，下载 Markdown 或转格式

## CLI 命令

```bash
# 从 URL 提取英文 Markdown
node cli.js extract https://example.com/article -o output/en.md

# 从本地 HTML 文件提取
node cli.js extract article.html -o output/en.md

# Markdown 导出 PDF
node cli.js pdf output/cn.md -o output/article.pdf
```

## 项目结构

```
html2cn/
├── cli.js                  # CLI 入口
├── src/
│   ├── server.js           # Express Web 服务
│   ├── ui.html             # Web UI 界面
│   ├── extractor.js        # HTML 正文提取
│   ├── translate-helper.js # 翻译助手页面生成
│   ├── pdf.js              # Markdown → PDF
│   └── template.html       # PDF 排版模板
├── output/                 # 输出目录
└── fonts/                  # 自定义字体（可选）
```

## 依赖

| 包 | 用途 |
|---|---|
| @mozilla/readability | 网页正文提取 |
| jsdom | Node.js DOM 解析 |
| turndown | HTML → Markdown |
| marked | Markdown → HTML |
| puppeteer | HTML → PDF |
| express | Web 服务 |
| commander | CLI 参数解析 |

## License

MIT
