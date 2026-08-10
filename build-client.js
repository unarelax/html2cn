const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// Bundle the client-side extractor
esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'client-extractor.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  outfile: path.join(distDir, 'bundle.js'),
});

// Copy the UI HTML to dist/index.html
let html = fs.readFileSync(path.join(__dirname, 'src', 'ui.html'), 'utf-8');

// Replace the server-dependent extraction logic with the bundled client-side version
// Remove the old form action /api/extract references and update the JS

// Replace doExtract to use the client-side bundle instead of /api/extract API call
const newScript = `
<script type="module">
import { extract } from './bundle.js';

const PROMPTS = [
  {
    name: "精炼讲故事",
    desc: "视觉化·布道师风格",
    text: \`【角色设定】
你是一位风趣幽默、深谙"降维打击"之道的首席技术布道师。你的受众是刚入门的技术小白。你的使命是剥开技术高冷的外衣，用大白话帮他们建立"技术审美"。

【核心任务】
请将我提供的【英文技术文稿/逐字稿】转化为一份具有"视觉化、故事感"的进阶学习笔记。

【执行策略与输出规范】

1. 剧幕式叙事（破局与重组）：
打破原文原有的枯燥结构，将核心内容重组为 3-5 个逻辑递进的"剧幕"。每个剧幕的标题必须是极具网感和悬念的"钩子式反问"（例如："🔥 一个诺贝尔物理学奖得主，为什么跑去创业公司焊电路板？"）。

2. 降维比喻（概念锚定）：
遇到核心专业词汇，必须采用"专业术语 + 通俗类比"的结构。

示例：不要只写"找个私教"，要写"RLHF（基于人类反馈的强化学习）——这就好比给 AI 找了个严厉的私教，答错了就打手心"。

语气：像朋友喝咖啡时聊天一样自然，彻底消除翻译腔。

3. 高颜排版（视觉锚点）：

在小标题和关键段落精准使用 Emoji（🚀💡🧠🔥等）。

原文中的核心金句、硬核数据、关键结论，必须使用 Markdown 引用框（>）或【】高亮标出，确保手机端一眼抓取。

【不可逾越的边界（事实围栏）】

事实绝对忠诚：你可以为了通俗易懂而改变句式、重组逻辑框架、添加幽默吐槽，但绝对禁止凭空捏造原文中不存在的数据、案例、实验结果或人物发言。

不遗漏核心：确保原文推导结论的"必要条件"不被比喻吃掉。

【结尾彩蛋】
在文章末尾，独立成段，提供如下格式的彩蛋：
"💡 底层思维模型提取：如果今天只记住一个概念，那应该是【填入核心概念】，因为【一句话点透它的本质】。\`,
  },
  {
    name: "中英对照",
    desc: "双语·行业语境",
    text: \`请将以上英文 Markdown 文章，保留原文英文内容，按以下要求进行"段落级"的中英对照翻译：

1.【核心底线：图片绝对保护】：原文中的图片标签（如 \\\`![alt](url)\\\` 或 \\\`<img>\\\` 标签）必须 100% 原样保留！绝对禁止翻译图片 alt 文本，禁止修改或遗漏任何 URL。重排版时，图片代码必须独立成行（上下各留一个空行），放置在对应的中英对照段落下方。
2.【重构与美化排版】：原文的 Markdown 格式可能比较凌乱，请发挥你的排版能力重新梳理。合理使用 1-3 级标题（#）、列表（-）、加粗（**）和引用块（>）来重构文章层级。要求大标题醒目，段落分段合理、留白均匀，小标题、列表单独规整，整体视觉干净整洁、阅读舒适。
3.【翻译风格：自然通俗】：将英文翻译为轻松有趣、贴合日常阅读口吻的简体中文。拆分长难句，像圈内朋友聊天一样自然，彻底消除翻译腔和生硬的书面感；保留原文全部信息、逻辑、细节，不删减、不篡改文意，好懂不枯燥。
4.【内容忠实：无私货】：忠于原观点，不添加任何虚构信息和主观评价，完整保留核心判断、行业洞察与真实案例。
5.【术语与背景补充】：核心专业术语、行业黑话保留英文原词，第一次出现时用括号标注通俗中文解释；遇到小众公司、产品或行业梗，在当前段落内补充 1-3 句极简背景说明，帮助熟悉行业语境。
6.【输出规范】：严格按照"一段英文（重排版后），紧跟一段中文"的格式对照输出。最终成品需是一篇图文完全无损、排版精致、语言轻松的优质文章。\`,
  },
  {
    name: "纯净中文",
    desc: "口语化·轻松自然",
    text: \`【核心任务】
请将提供的英文 Markdown 文章，翻译并转化为一篇"全中文、高颜值、易阅读"的深度好文。

【执行规范】
1. 翻译风格（生动接地气）：彻底告别生硬的"机翻味"和死板书面语。采用轻松有趣、自然通俗的口语化表达，像优质爆款文章一样娓娓道来。巧妙拆解长难句，降低阅读门槛。
2. 内容忠实（零删减）：100% 完整保留原文的所有信息、核心逻辑、细节和真实案例。不增减内容，不篡改文意，不夹带主观私货。
3. 核心底线（图片绝对保护）：原文中的所有图片标签（如 \\\`![alt](url)\\\`）必须 100% 原样保留！绝对禁止翻译图片 alt 文本或乱加 HTML 标签。图片需在对应的中文段落下方独立成行（上下各留空行），确保图文紧跟、绝不丢失。
4. 高颜排版（清爽呼吸感）：发挥你的排版美学重新梳理文章。合理使用各级标题、列表、加粗和引用。要求大标题醒目，段落切分合理、留白均匀；特殊格式单独规整，整体视觉干净整洁。
5. 纯净输出（单语直出）：仅输出最终排版好的【纯中文完整版】。禁止保留英文原文段落（专业专有名词除外），禁止做双语对照，禁止输出任何诸如"好的，这是翻译结果"之类的开场白或解释性废话。\`,
  },
];

let selectedPromptIndex = 0;
let extractedMarkdown = "";
let extractedTitle = "";
let currentTab = "url";

function renderPromptCards() {
  const container = document.getElementById("promptCards");
  if (!container) return;
  container.innerHTML = PROMPTS.map(
    (p, i) =>
      \`<div class="prompt-card\${i === selectedPromptIndex ? " active" : ""}" onclick="selectPrompt(\${i})">
  <span class="prompt-card-badge">指令\${i + 1}</span>
  \${p.name}
  <span class="prompt-card-desc">\${p.desc}</span>
</div>\`,
  ).join("");
  const preview = document.getElementById("promptPreview");
  if (preview) preview.textContent = PROMPTS[selectedPromptIndex].text;
}

window.selectPrompt = function(index) {
  selectedPromptIndex = index;
  renderPromptCards();
};

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach((el, i) => {
    el.classList.toggle("active", (i === 0 && tab === "url") || (i === 1 && tab === "html"));
  });
  document.getElementById("tab-url").style.display = tab === "url" ? "" : "none";
  document.getElementById("tab-html").style.display = tab === "html" ? "" : "none";
}
window.switchTab = switchTab;

function showMsg(id, text, isError) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (isError ? "error" : "success");
  setTimeout(() => { el.className = "msg"; }, 5000);
}

function setLoading(btnId, spinId, loading) {
  document.getElementById(btnId).disabled = loading;
  document.getElementById(spinId).style.display = loading ? "inline-block" : "none";
}

window.doExtract = async function() {
  setLoading("btnExtract", "spinExtract", true);
  document.getElementById("msgExtract").className = "msg";

  try {
    const input = currentTab === "url"
      ? document.getElementById("inputUrl").value.trim()
      : document.getElementById("inputHtml").value;

    if (!input) {
      showMsg("msgExtract", currentTab === "url" ? "请输入文章 URL" : "请粘贴 HTML 内容", true);
      setLoading("btnExtract", "spinExtract", false);
      return;
    }

    const result = await extract(input);
    extractedMarkdown = result.markdown;
    extractedTitle = result.title;

    const preview = document.getElementById("enPreview");
    preview.textContent = result.markdown;
    preview.classList.remove("placeholder");
    document.getElementById("btnCopyEn").disabled = false;
    document.getElementById("btnCopyWithPrompt").disabled = false;
    document.getElementById("cnMarkdown").value = "";
    showMsg("msgExtract", \`提取成功！标题：\${result.title}，共 \${result.markdown.length} 字符\`, false);
  } catch (err) {
    showMsg("msgExtract", "提取失败: " + err.message, true);
  }
  setLoading("btnExtract", "spinExtract", false);
};

window.pasteEnMarkdown = function() {
  if (!extractedMarkdown) return;
  document.getElementById("cnMarkdown").value = extractedMarkdown;
};

window.copyEnMarkdown = function() {
  if (!extractedMarkdown) return;
  navigator.clipboard.writeText(extractedMarkdown).then(() => showCopied("enCopied"));
};

window.copyEnWithPrompt = function() {
  if (!extractedMarkdown) return;
  const prompt = "\\n\\n---\\n\\n" + PROMPTS[selectedPromptIndex].text;
  navigator.clipboard.writeText(extractedMarkdown + prompt).then(() => showCopied("enCopied"));
};

function showCopied(id) {
  const el = document.getElementById(id);
  el.style.display = "inline";
  el.textContent = "已复制！";
  setTimeout(() => { el.style.display = "none"; }, 2000);
}

window.doDownloadMD = function() {
  const md = document.getElementById("cnMarkdown").value.trim();
  const filename = extractedTitle ? extractedTitle.replace(/[\\/\\\\:*?"<>|]/g, "-").substring(0, 40) : "article";

  if (!md) {
    showMsg("msgStep3", "请先粘贴翻译后的中文 Markdown", true);
    return;
  }

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".md";
  a.click();
  URL.revokeObjectURL(url);
  showMsg("msgStep3", "下载成功！", false);
};

// Initialize on load
renderPromptCards();
</script>`;

// Remove the old <script> block and replace with our new one
html = html.replace(/<script>[\s\S]*?<\/script>/, newScript);

// Fix the header description to be fully static
html = html.replace(
  '<p>提取 · 翻译 · 排版 · 导出 PDF</p>',
  '<p>提取 · 翻译 · 排版 · 下载 Markdown</p>'
);

// Remove the PDF download button since we can't do PDF in static mode
html = html.replace(
  /<button class="btn btn-primary btn-sm" onclick="doGeneratePDF\(\)" id="btnPDF" disabled>[\s\S]*?<\/button>/,
  ''
);

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');

console.log('Build complete: dist/index.html + dist/bundle.js');
