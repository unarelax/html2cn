const fs = require('fs');
const path = require('path');

const TRANSLATION_TOOLS = [
  { name: '豆包 (Doubao)', url: 'https://www.doubao.com/chat' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com' },
  { name: 'Kimi', url: 'https://kimi.moonshot.cn' },
  { name: '通义千问', url: 'https://tongyi.aliyun.com' },
  { name: 'Claude', url: 'https://claude.ai' },
  { name: 'ChatGPT', url: 'https://chat.openai.com' },
];

const PROMPTS = [
  {
    name: '趣味翻译',
    desc: '口语化·轻松自然',
    text: `请将以下英文 Markdown 文章翻译为轻松有趣、自然通俗的简体中文。要求：
1. 保留所有 ![](url) 图片标记完全不动
2. 保留 Markdown 格式结构不动（标题#、列表-、引用>等）
3. 只翻译文字内容
4. 翻译风格：口语化、不生硬、适当优化语气
5. 拆分英文长难句，符合中文短句阅读习惯
6. 保留原文全部信息和细节，不删减不篡改`,
  },
  {
    name: '讲故事学习笔记',
    desc: '视觉化·布道师风格',
    text: `通过讲故事进行知识学习
角色设定：
你是一位风趣幽默、擅长比喻的AI领域首席布道师。你的读者是刚入门的小白，你需要帮他们建立"AI审美"和"领域语感"。

任务：
请将我发你的这段【英文技术文稿/逐字稿】转化为一份"视觉化学习笔记"。

输出要求：
大段落叙事结构：全文只分 3-5 个超级大板块，每个板块必须有抓人眼球的小标题（例如："🧠 第一幕：大模型的大脑是怎么搭积木的"）。
语言风格（接地气+生动）：禁止直译术语。遇到专业词汇（如Transformer、RLHF），必须用生活中的场景类比（比如把RLHF比作"给AI请了个私教纠错"）。语调要像哥们儿聊天，多用感叹号和口语词。
信息重组（小白友好）：原文的逻辑可能是"1,2,3"，请你重组成"为什么这东西重要 -> 它到底解决了啥痛点 -> 目前行业里做到哪一步了"这个逻辑链条。
高颜值排版：大量使用 Emoji（🚀💡🔥⭐）作为视觉锚点。关键结论和核心金句必须用 【高亮框】 或者 > 引用格式 框起来，让我在手机上扫一眼就能抓住重点。
"审美"彩蛋：在结尾用一句话告诉我："如果只记住今天的一个核心概念，那应该是______"，帮我提炼出这个领域的思维模型。

核心铁则（绝对不能破）
1. 信息 100% 忠实原文：原文里的所有核心观点、数据、案例、人物发言、逻辑推导、限定条件、结论，必须完整保留。绝对不能为了 "好懂" 就删减、简化、篡改原意，也不能加入你自己的看法和延伸解读。
2. 只优化表达，不改变内容：你做的是 "翻译 + 转述润色"，不是 "二次创作"，所有信息都必须来自原文。

请提取核心知识点，按上述讲故事格式输出`,
  },
  {
    name: '中英对照翻译',
    desc: '双语·行业语境',
    text: `保留原文英文内容，按以下要求进行中英对照翻译：
1. 将全文英文内容翻译为轻松有趣、自然通俗、不生硬机翻的简体中文，贴合日常阅读口吻，拆分长难句，保留原文全部信息、逻辑、细节，不删减、不篡改文意，像圈内朋友聊天一样自然，彻底消除翻译腔和生硬的书面感，好懂不枯燥 。
2. 忠于原观点，不添加任何虚构信息和主观私货，完整保留核心判断、行业洞察与真实案例
3. 核心专业术语、行业黑话保留英文原词，第一次出现时用括号标注通俗中文解释；遇到小众公司、产品或行业梗，补充1-3句极简背景说明，帮我熟悉行业语境
4. 排版要求：全程精美轻量化排版，层级清晰、阅读舒适。文章大标题醒目，段落分段合理、留白均匀，图片居中自适应，紧跟对应段落，图文间距协调不乱序；小标题、列表、特殊格式单独规整排版，整体干净整洁、无杂乱格式。
5. 输出规范：按照段落输出双语对照、最终成品为一篇排版精致、语言轻松、图文完整的中文阅读文章。`,
  },
];

/**
 * Generate the translation helper HTML page.
 * @param {string} markdown - English markdown content
 * @param {string} title - Article title
 * @param {string} outputDir - Output directory for the HTML file
 * @returns {string} Path to the generated HTML file
 */
function generate(markdown, title, outputDir) {
  const toolButtons = TRANSLATION_TOOLS.map(
    (t) =>
      `<a href="${t.url}" target="_blank" rel="noopener" class="tool-btn">${t.name}</a>`
  ).join('\n');

  // Escape markdown content for safe embedding in HTML
  const escapedMarkdown = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>翻译助手 - ${escapeHTML(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; font-size: 1.6em; margin: 20px 0; color: #1a1a1a; }
    .card {
      background: #fff;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .card h2 { font-size: 1.2em; margin-bottom: 12px; color: #2563eb; }

    /* Tool buttons */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;
    }
    .tool-btn {
      display: block;
      text-align: center;
      padding: 12px 8px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95em;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .tool-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }

    /* Prompt section */
    .prompt-box {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      font-size: 0.9em;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 12px;
    }
    .copy-btn {
      display: inline-block;
      padding: 8px 20px;
      border: none; border-radius: 6px;
      background: #2563eb;
      color: #fff;
      font-size: 0.9em;
      cursor: pointer;
      transition: background 0.15s;
    }
    .copy-btn:hover { background: #1d4ed8; }
    .copy-btn.copied { background: #16a34a; }

    /* Markdown preview */
    .md-preview {
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 8px;
      padding: 20px;
      font-family: "Cascadia Code", "Fira Code", "JetBrains Mono", monospace;
      font-size: 0.85em;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 500px;
      overflow-y: auto;
      line-height: 1.7;
    }

    .steps { padding-left: 20px; }
    .steps li { margin-bottom: 8px; }

    .tip {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin-top: 16px;
      font-size: 0.9em;
    }

    /* Prompt selector */
    .prompt-cards { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .prompt-card {
      flex: 1; min-width: 130px;
      padding: 12px 14px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      cursor: pointer;
      text-align: center;
      font-size: 0.85em;
      font-weight: 600;
      transition: all 0.18s;
      background: #fafafa;
      user-select: none;
    }
    .prompt-card:hover { border-color: #c4b5fd; background: #f5f3ff; }
    .prompt-card.active {
      border-color: #667eea;
      background: linear-gradient(135deg, #ede9fe, #f5f3ff);
      color: #5b21b6;
      box-shadow: 0 2px 10px rgba(102,126,234,0.2);
    }
    .prompt-card-badge {
      display: block;
      font-size: 0.7em;
      padding: 2px 10px;
      border-radius: 10px;
      background: #667eea;
      color: #fff;
      margin: 0 auto 4px;
    }
    .prompt-card.active .prompt-card-badge { background: #5b21b6; }
    .prompt-card-desc {
      display: block;
      font-size: 0.78em;
      font-weight: 400;
      color: #888;
      margin-top: 2px;
    }
    .prompt-card.active .prompt-card-desc { color: #7c3aed; }
  </style>
</head>
<body>
<div class="container">
  <h1>翻译助手</h1>
  <p style="text-align:center;color:#888;margin-bottom:20px;">文章：${escapeHTML(title)}</p>

  <!-- Step 1: Pick a tool -->
  <div class="card">
    <h2>第1步：选择翻译平台</h2>
    <p style="margin-bottom:12px;color:#666;">点击下方任一按钮，在新标签页中打开 AI 翻译工具：</p>
    <div class="tools-grid">${toolButtons}</div>
  </div>

  <!-- Step 2: Select & copy prompt -->
  <div class="card">
    <h2>第2步：选择并复制翻译指令</h2>
    <p style="margin-bottom:8px;color:#666;">点击卡片切换翻译风格，预览满意后复制指令：</p>
    <div class="prompt-cards" id="promptCards"></div>
    <div class="prompt-box" id="promptPreview"></div>
    <button class="copy-btn" onclick="copyPrompt()" id="promptBtn">复制翻译指令</button>
    <span id="promptMsg" style="margin-left:10px;color:#16a34a;display:none;">已复制！</span>
  </div>

  <!-- Step 3: Copy markdown -->
  <div class="card">
    <h2>第3步：复制英文 Markdown</h2>
    <p style="margin-bottom:8px;color:#666;">复制以下 Markdown 内容，接在翻译指令后面一起发给 AI：</p>
    <div class="md-preview">${escapedMarkdown}</div>
    <button class="copy-btn" onclick="copyMarkdown()" id="mdBtn" style="margin-top:12px;">复制 Markdown 内容</button>
    <span id="mdMsg" style="margin-left:10px;color:#16a34a;display:none;">已复制！</span>
  </div>

  <!-- Step 4: Save result -->
  <div class="card">
    <h2>第4步：保存翻译结果</h2>
    <ol class="steps">
      <li>等待 AI 返回中文翻译结果</li>
      <li>检查图片标记 <code>![](url)</code> 是否完整保留</li>
      <li>将翻译后的 Markdown 保存为 <code>cn.md</code></li>
      <li>回到命令行运行：<br><code>node cli.js pdf cn.md -o article.pdf</code></li>
    </ol>
    <div class="tip">
      <strong>提示：</strong>翻译完成后务必检查 Markdown 格式是否完整，特别是图片链接和标题标记。如果 AI 翻译时不小心修改了格式语法，手动修正后再导出 PDF。
    </div>
  </div>
</div>

<script>
const PROMPTS = ${JSON.stringify(PROMPTS)};
const markdownText = ${JSON.stringify(markdown)};
let selectedPromptIndex = 0;

function renderPromptCards() {
  const container = document.getElementById('promptCards');
  container.innerHTML = PROMPTS.map((p, i) =>
    '<div class="prompt-card' + (i === selectedPromptIndex ? ' active' : '') + '" onclick="selectPrompt(' + i + ')">' +
      '<span class="prompt-card-badge">指令' + (i + 1) + '</span>' +
      p.name +
      '<span class="prompt-card-desc">' + p.desc + '</span>' +
    '</div>'
  ).join('');
  document.getElementById('promptPreview').textContent = PROMPTS[selectedPromptIndex].text;
}

function selectPrompt(index) {
  selectedPromptIndex = index;
  renderPromptCards();
}

function copyPrompt() {
  navigator.clipboard.writeText(PROMPTS[selectedPromptIndex].text).then(() => {
    const btn = document.getElementById('promptBtn');
    btn.textContent = '已复制！';
    btn.classList.add('copied');
    document.getElementById('promptMsg').style.display = 'inline';
    setTimeout(() => { btn.textContent = '复制翻译指令'; btn.classList.remove('copied'); document.getElementById('promptMsg').style.display = 'none'; }, 2000);
  });
}

function copyMarkdown() {
  navigator.clipboard.writeText(markdownText).then(() => {
    const btn = document.getElementById('mdBtn');
    btn.textContent = '已复制！';
    btn.classList.add('copied');
    document.getElementById('mdMsg').style.display = 'inline';
    setTimeout(() => { btn.textContent = '复制 Markdown 内容'; btn.classList.remove('copied'); document.getElementById('mdMsg').style.display = 'none'; }, 2000);
  });
}

renderPromptCards();
</script>
</body>
</html>`;

  const filePath = path.join(outputDir, 'translate-helper.html');
  fs.writeFileSync(filePath, html, 'utf-8');
  return filePath;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { generate };
