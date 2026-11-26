// Turns every file in content/sources (+ content/authored/*.md) into topic JSON.
// Run: node scripts/build-content.mjs   (runs automatically before dev/build)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { RULES, renderDiagram } from './diagrams.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = path.join(ROOT, 'content', 'sources');
const AUTH = path.join(ROOT, 'content', 'authored');
const OUT = path.join(ROOT, 'src', 'content', 'generated');
const PUB = path.join(ROOT, 'public');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'topics.json'), 'utf8'));

const LANGS = ['javascript', 'typescript', 'python', 'csharp', 'sql', 'bash', 'json', 'xml', 'css', 'yaml', 'dockerfile', 'plaintext'];
const PALETTE = ['#f59e0b', '#3b82f6', '#ef4444', '#14b8a6', '#6366f1', '#84cc16'];

// ---------- helpers ----------
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'section';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
const textOf = (html) => cheerio.load(html).root().text().replace(/\s+/g, ' ').trim();

function uniqueIds() {
  const seen = new Map();
  return (title) => {
    const base = slugify(title);
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
}

function highlight(code, lang) {
  try {
    if (lang && hljs.getLanguage(lang)) return { html: hljs.highlight(code, { language: lang }).value, lang };
    const r = hljs.highlightAuto(code, LANGS);
    return { html: r.value, lang: r.language || 'plaintext' };
  } catch {
    return { html: esc(code), lang: 'plaintext' };
  }
}

/** Clean + enhance an HTML fragment: strip scripts/handlers, highlight code blocks. */
function polish(html, { langHint } = {}) {
  const $ = cheerio.load(`<div id="__r">${html}</div>`, null, false);
  $('script,style,noscript,button,input,select').remove();
  $('*').each((_, el) => {
    for (const a of Object.keys(el.attribs || {})) {
      if (a.startsWith('on')) $(el).removeAttr(a);
    }
  });
  // single-cell tables that only hold code -> plain pre
  $('table').each((_, t) => {
    const cells = $(t).find('td,th');
    if (cells.length === 1 && $(cells[0]).find('pre').length && !$(cells[0]).text().replace($(cells[0]).find('pre').text(), '').trim()) {
      $(t).replaceWith($(cells[0]).find('pre'));
    }
  });
  $('table').each((_, t) => { if (!$(t).parent().hasClass('table-wrap')) $(t).wrap('<div class="table-wrap"></div>'); });
  $('pre').each((_, p) => {
    const $p = $(p);
    if ($p.find('span.hljs-keyword, span[class^="hljs"]').length) return;
    const raw = $p.text().replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\s+$/g, '');
    if (!raw) { $p.remove(); return; }
    const cls = ($p.attr('class') || '') + ' ' + ($p.find('code').attr('class') || '');
    const m = cls.match(/language-([\w#+-]+)/);
    let lang = m ? (m[1] === 'cs' ? 'csharp' : m[1]) : langHint;
    if ($p.hasClass('out')) lang = 'plaintext';
    const h = highlight(raw, lang);
    const extra = $p.hasClass('out') ? ' out' : '';
    $p.replaceWith(`<pre class="code-block${extra}" data-lang="${$p.hasClass('out') ? 'output' : h.lang}"><code class="hljs">${h.html}</code></pre>`);
  });
  $('img').each((_, i) => { $(i).attr('loading', 'lazy'); });
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (/^https?:/.test(href)) $(a).attr('target', '_blank').attr('rel', 'noreferrer');
    else if (href.startsWith('#')) $(a).replaceWith($(a).html() || '');
  });
  return $('#__r').html().trim();
}

function isQuestion(title) {
  return /^(q\s*\d+|question)\b/i.test(title) || /\?\s*$/.test(title);
}
function cleanQ(title) {
  return title.replace(/^Q\s*\d+\s*[.):-]\s*/i, '').trim();
}
function summaryOf(html, n = 420) {
  const $ = cheerio.load(`<div>${html}</div>`, null, false);
  $('pre,table,svg,img,.table-wrap').remove();
  return clip($.root().text().replace(/\s+/g, ' ').trim(), n);
}

/** Split a flat HTML document into parts (h1) and sections (h2/h3). */
function splitByHeadings(html, { partTag = 'h1', groupTag = 'h2', secTag = 'h3', introTitle = 'Introduction' } = {}) {
  const $ = cheerio.load(`<div id="__r">${html}</div>`, null, false);
  const parts = [];
  let part = null, group = null, sec = null;
  const nextId = uniqueIds();
  const newPart = (title) => { part = { id: slugify(title), title, sections: [] }; parts.push(part); group = null; sec = null; };
  const newSec = (title, grp) => {
    if (!part) newPart(introTitle);
    sec = { id: nextId(title), title, group: grp || null, html: '' };
    part.sections.push(sec);
  };
  $('#__r').children().each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (tag === partTag && txt) return newPart(txt);
    if (tag === groupTag && txt && secTag) { group = txt; return newSec(txt, txt); }
    if (tag === (secTag || groupTag) && txt) return newSec(txt, group);
    if (!sec) newSec(part ? part.title : introTitle, null);
    sec.html += $.html(el);
  });
  // drop empty group-heading sections, de-dup part ids
  const pid = uniqueIds();
  for (const p of parts) {
    p.id = pid(p.title);
    p.sections = p.sections.filter((s) => textOf(s.html) || /<(img|svg|pre|table)/.test(s.html));
  }
  return parts.filter((p) => p.sections.length);
}

function finishTopic(meta, parts, extras = {}) {
  const pid = uniqueIds();
  for (const p of parts) p.id = pid(p.id);
  let qCount = 0;
  const cards = [];
  for (const p of parts) {
    for (const s of p.sections) {
      s.html = polish(s.html, { langHint: meta.langHint });
      s.isQuestion = s.isQuestion ?? isQuestion(s.title);
      s.summary = s.summary ?? summaryOf(s.html);
      if (s.isQuestion) {
        qCount++;
        if (s.summary) cards.push({ id: `${p.id}/${s.id}`, q: cleanQ(s.title), a: s.summary, part: p.title });
      }
    }
  }
  // animated diagrams: put a picture at the top of matching sections, and collect them for the Visual guide
  const visuals = [];
  const seen = new Set();
  for (const p of parts) for (const s of p.sections) {
    const figs = [];
    for (const [re, name] of RULES[meta.slug] || []) {
      if (!re.test(s.title)) continue;
      const svg = renderDiagram(name);
      if (!svg || figs.some((x) => x.name === name)) continue;
      figs.push({ name, svg });
      if (!seen.has(name)) { seen.add(name); visuals.push({ name, part: p.id, partTitle: p.title, section: s.id, sectionTitle: s.title, svg }); }
    }
    if (figs.length) { s.html = figs.map((x) => x.svg).join('') + s.html; s.hasVisual = true; }
  }
  if (visuals.length) extras.visuals = visuals;
  for (const c of extras.extraCards || []) cards.push(c);
  delete extras.extraCards;
  const sectionCount = parts.reduce((n, p) => n + p.sections.length, 0);
  return { ...meta, parts, cards, extras, stats: { parts: parts.length, sections: sectionCount, questions: qCount, cards: cards.length } };
}

/** Pull `const NAME=[...]` / `{...}` / `` `...` `` literals out of an HTML page's script. */
function extractConsts(src, names) {
  const out = {};
  for (const name of names) {
    const m = new RegExp(`const\\s+${name}\\s*=\\s*`).exec(src);
    if (!m) continue;
    let i = m.index + m[0].length;
    const open = src[i];
    let depth = 0, j = i, str = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (str) {
        if (c === '\\') { j++; continue; }
        if (c === str) str = null;
        continue;
      }
      if (open === '`') { if (j > i && c === '`') { j++; break; } continue; }
      if (c === '"' || c === "'" || c === '`') { str = c; continue; }
      if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
      if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
      if (c === '[' || c === '{') depth++;
      if (c === ']' || c === '}') { depth--; if (depth === 0) { j++; break; } }
    }
    try { out[name] = vm.runInNewContext('(' + src.slice(i, j) + ')'); } catch (e) { console.warn(`  ! could not read ${name}: ${e.message}`); }
  }
  return out;
}

/** Word docs store code as one paragraph per line, often inside a 1-column "label + code" table. Rebuild real code blocks. */
function mergeDocxCode(html) {
  const $ = cheerio.load(`<div id="__r">${html}</div>`, null, false);
  const isBlank = (el) => el && el.tagName === 'p' && !$(el).text().replace(/[\s ]/g, '') && !$(el).find('img').length;
  const LANG = { javascript: 'javascript', js: 'javascript', jsx: 'javascript', typescript: 'typescript', ts: 'typescript', python: 'python', sql: 'sql', bash: 'bash', shell: 'bash', json: 'json', html: 'xml', css: 'css', 'c#': 'csharp', csharp: 'csharp', yaml: 'yaml', dockerfile: 'dockerfile', docker: 'dockerfile', output: 'plaintext', text: 'plaintext' };
  // 1. one-column tables that hold code
  $('table').each((_, t) => {
    const rows = $(t).find('tr').toArray();
    if (!rows.length || !$(t).find('pre').length || rows.some((r) => $(r).children('td,th').length !== 1)) return;
    let label = '';
    const lines = [];
    rows.forEach((r, i) => {
      const cell = $(r).children().first();
      if (i === 0 && !cell.find('pre').length) { label = cell.text().trim(); return; }
      cell.children().each((_, c) => {
        if (c.tagName === 'pre') lines.push($(c).text());
        else if (isBlank(c)) lines.push('');
        else lines.push($(c).text());
      });
    });
    const lang = LANG[label.toLowerCase()] || '';
    const code = lines.join('\n').replace(/^\n+|\s+$/g, '');
    $(t).replaceWith(`${label && !lang ? `<p class="code-label">${esc(label)}</p>` : ''}<pre class="${lang ? `language-${lang}` : 'code'}">${esc(code)}</pre>`);
  });
  // 2. pre, blank paragraph(s), pre  -> one pre
  const gone = new Set();
  const skipWs = (n) => { while (n && n.type === 'text' && !n.data.trim()) n = n.next; return n; };
  for (const p of $('pre').toArray()) {
    if (gone.has(p)) continue;
    let text = $(p).text();
    for (;;) {
      let n = skipWs(p.next);
      const blanks = [];
      while (n && isBlank(n)) { blanks.push(n); n = skipWs(n.next); }
      if (!n || n.tagName !== 'pre' || ($(n).attr('class') || '') !== ($(p).attr('class') || '')) break;
      text += '\n' + '\n'.repeat(blanks.length) + $(n).text();
      blanks.forEach((b) => $(b).remove());
      gone.add(n);
      $(n).remove();
    }
    $(p).text(text);
  }
  return $('#__r').html();
}

// ---------- handlers ----------
async function fromDocx(file, meta) {
  const MONO = /consolas|courier|mono|menlo|lucida console/i;
  const imgDir = path.join(PUB, 'content', meta.slug);
  fs.mkdirSync(imgDir, { recursive: true });
  let imgN = 0;
  const transform = (el) => {
    if (el.type === 'paragraph') {
      const runs = [];
      const walk = (e) => { if (e.type === 'run') runs.push(e); (e.children || []).forEach(walk); };
      walk(el);
      const textRuns = runs.filter((r) => r.children.some((c) => c.type === 'text' && c.value.trim()));
      if (textRuns.length && textRuns.every((r) => MONO.test(r.font || ''))) return { ...el, styleName: 'CodeBlock', styleId: 'CodeBlock' };
      if (runs.length === 0 && el.children.length === 0 && el.styleName === 'CodeBlock') return el;
      return { ...el, children: el.children.map(transform) };
    }
    if (el.type === 'run' && MONO.test(el.font || '')) return { ...el, styleName: 'InlineCode', styleId: 'InlineCode' };
    if (el.children) return { ...el, children: el.children.map(transform) };
    return el;
  };
  const r = await mammoth.convertToHtml({ path: file }, {
    transformDocument: transform,
    styleMap: ["p[style-name='CodeBlock'] => pre.code:separator('\\n')", "r[style-name='InlineCode'] => code", "p[style-name='Title'] => h1.doc-title:fresh"],
    convertImage: mammoth.images.imgElement(async (img) => {
      const ext = (img.contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
      const name = `img-${++imgN}.${ext}`;
      fs.writeFileSync(path.join(imgDir, name), await img.read());
      return { src: `/content/${meta.slug}/${name}`, alt: img.altText || 'diagram' };
    }),
  });
  const html = mergeDocxCode(r.value.replace(/<h1 class="doc-title">[\s\S]*?<\/h1>/, ''));
  const parts = splitByHeadings(html);
  // the intro (contents list) is only useful as an overview
  return finishTopic(meta, parts);
}

function fromGenericHtml(file, meta) {
  const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
  const body = $('main').length ? $('main') : $('body');
  body.find('nav,header,footer,script,style').remove();
  const hasH1Parts = body.find('h1').length > 1;
  const parts = splitByHeadings(body.html() || '', hasH1Parts ? {} : { partTag: 'h1x', groupTag: 'h2', secTag: 'h3', introTitle: meta.title });
  return finishTopic(meta, parts);
}

async function fromMarkdown(file, meta) {
  let src = fs.readFileSync(file, 'utf8');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(src);
  if (fm) {
    for (const line of fm[1].split(/\r?\n/)) {
      const m = /^(\w+):\s*(.*)$/.exec(line);
      if (m) meta[m[1]] = /^\d+$/.test(m[2]) ? Number(m[2]) : m[2].replace(/^["']|["']$/g, '');
    }
    src = src.slice(fm[0].length);
  }
  marked.use({ gfm: true });
  const html = marked.parse(src);
  const parts = splitByHeadings(html, { partTag: 'h1', groupTag: 'h2', secTag: null });
  // in markdown, ## is the section; ### stays inside it
  if (meta.cards === 'all') for (const p of parts) for (const sec of p.sections) sec.isQuestion = sec.title !== p.title;
  // optional <slug>.js-solutions.mjs: a JavaScript tab next to the first C# block of each section
  const jsFile = file.replace(/\.md$/, '.js-solutions.mjs');
  if (fs.existsSync(jsFile)) {
    const sols = (await import(pathToFileURL(jsFile).href)).default;
    for (const p of parts) for (const sec of p.sections) {
      const js = sols[(sec.title.match(/^(\d+)\./) || [])[1] || sec.title];
      if (!js) continue;
      const jsPre = `<pre><code class="language-javascript">${esc(js)}</code></pre>`;
      const m = /<pre><code class="language-csharp">[\s\S]*?<\/code><\/pre>/.exec(sec.html);
      sec.html = m
        ? sec.html.slice(0, m.index) + `<div class="code-tabs">${m[0]}${jsPre}</div>` + sec.html.slice(m.index + m[0].length)
        : sec.html + `<h4>JavaScript / Node.js</h4>${jsPre}`;
    }
  }
  const extras = {};
  const quizFile = file.replace(/\.md$/, '.quiz.json');
  if (fs.existsSync(quizFile)) extras.quiz = JSON.parse(fs.readFileSync(quizFile, 'utf8'));

  // optional <slug>.lessons.mjs: numbered tutorial lessons in the same layout as the C# lessons,
  // inserted right after the first ("Start here") part
  // front matter may point at a shared lessons file and pick one technology: lessonsFile + lessonTopic
  const lessonFile = meta.lessonsFile ? path.join(path.dirname(file), meta.lessonsFile) : file.replace(/\.md$/, '.lessons.mjs');
  if (fs.existsSync(lessonFile)) {
    const mod = await import(pathToFileURL(lessonFile).href);
    let lessons = mod.lessons, groups = mod.groups, renumbered = false;
    if (meta.lessonTopic) {
      lessons = lessons.filter((l) => l.topic === meta.lessonTopic).sort((a, b) => a.n - b.n);
      groups = mod.groupsByTopic[meta.lessonTopic];
      renumbered = true;
    }
    const final = renumbered ? renumberLessons(lessons) : lessons;       // same order as `lessons`
    const lessonParts = groups.map((g) => {
      const idx = lessons.map((l, i) => (l.n >= g.from && l.n <= g.to ? i : -1)).filter((i) => i >= 0);
      const list = idx.map((i) => final[i]);
      if (!list.length) return null;
      const range = list.length > 1 ? `${list[0].n}–${list[list.length - 1].n}` : `${list[0].n}`;
      return {
        id: g.id,
        title: renumbered ? `${g.title} (lesson${list.length > 1 ? 's' : ''} ${range})` : g.title,
        blurb: list.map((l) => l.title).slice(0, 4).join(', ') + '…',
        sections: list.map((l) => ({ id: `lesson-${l.n}`, title: `${l.n}. ${l.title}`, group: null, isQuestion: false, lesson: true, summary: l.sub, html: lessonHtml(l) })),
      };
    }).filter(Boolean);
    parts.splice(1, 0, ...lessonParts);
    extras.extraCards = final.map((l) => ({ id: `lesson-${l.n}`, q: `Lesson ${l.n}: ${l.title}`, a: clip(`${l.sub} ${l.big}`, 420), part: 'Lessons' }));
  }
  return finishTopic(meta, parts, extras);
}

/** Number a topic's lessons 1..n and fix "lesson N" / "NN-name.mjs" references inside their text. */
function renumberLessons(list) {
  const map = new Map(list.map((l, i) => [l.n, i + 1]));
  const fix = (s) => (typeof s !== 'string' ? s : s
    .replace(/\b([Ll]essons? )(\d+)\b/g, (m, p, d) => (map.has(+d) ? p + map.get(+d) : m))
    .replace(/\b(\d{2})-([a-z0-9-]+\.mjs)\b/g, (m, d, rest) => (map.has(+d) ? String(map.get(+d)).padStart(2, '0') + '-' + rest : m)));
  return list.map((l) => ({
    ...l, n: map.get(l.n), title: fix(l.title), sub: fix(l.sub), big: fix(l.big), output: fix(l.output), file: fix(l.file),
    program: fix(l.program), run: fix(l.run), steps: l.steps.map((st) => st.map(fix)), mistakes: l.mistakes.map(fix),
  }));
}

/** Same markup as a C# lesson: big idea, numbered steps with a snippet each, output to predict, common mistakes, full program. */
function lessonHtml(l) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const lang = l.lang || 'javascript';
  const steps = l.steps.map(([code, text, stepLang]) => `<li><pre class="language-${stepLang || lang}">${esc(code)}</pre><p>${inline(text)}</p></li>`).join('');
  return `<p class="sub">${inline(l.sub)}</p>`
    + `<div class="box big"><h3>💡 The big idea</h3><p>${inline(l.big)}</p></div>`
    + `<h3>🪜 Step by step through the code</h3><ol class="steps">${steps}</ol>`
    + `<div class="two"><div><h3>🖥️ Output</h3><details class="reveal"><summary>🤔 Predict the output first, then click to reveal</summary><pre class="out">${esc(l.output)}</pre></details></div>`
    + `<div class="box warn"><h3>⚠️ Common mistakes</h3><ul>${l.mistakes.map((m) => `<li>${inline(m)}</li>`).join('')}</ul></div></div>`
    + `<details><summary>Show the full ${esc(l.fileLabel || 'program')} (${esc(l.file)})</summary><pre class="language-${lang}">${esc(l.program)}</pre></details>`
    + `<p class="run"><span class="run-label">▶ Run it</span><code>${esc(l.run).replace(/\n/g, '<br>')}</code></p>`;
}

function fromCsharp(file, meta) {
  const raw = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(raw);
  const lessons = [];
  $('section.lesson').each((i, el) => {
    const $s = $(el);
    const n = i + 1;
    const title = $s.find('h2').first().text().trim();
    $s.find('.num,h2').first().remove();
    $s.find('h2').first().remove();
    // markdown-ish ** and ` inside text
    $s.find('p,li').each((_, p) => {
      const h = $(p).html();
      if (h && /\*\*|`/.test(h)) $(p).html(h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>'));
    });
    $s.find('pre.snip').addClass('language-csharp');
    $s.find('pre.code').addClass('language-csharp');
    // the output is hidden behind a "predict first" button (the pre sits INSIDE <details>, after the <summary>)
    $s.find('pre.out').each((_, o) => {
      $(o).replaceWith(`<details class="reveal"><summary>🤔 Predict the output first, then click to reveal</summary>${$.html(o)}</details>`);
    });
    $s.find('h3').each((_, h) => {
      const t = $(h).text().trim();
      const icon = /big idea/i.test(t) ? '💡 ' : /step by step/i.test(t) ? '🪜 ' : /output/i.test(t) ? '🖥️ ' : /common mistakes/i.test(t) ? '⚠️ ' : '';
      $(h).text(icon + (/output you will see/i.test(t) ? 'Output' : t));
    });
    $s.find('p.run').each((_, p) => {
      const cmd = $(p).find('code').first().text() || $(p).text().replace(/^Run it:\s*/i, '');
      $(p).html(`<span class="run-label">▶ Run it</span><code>${esc(cmd)}</code>`);
    });
    const sub = $s.find('p.sub').first().text().trim();
    const big = $s.find('.box.big p').first().text().replace(/\*\*|`/g, '').trim();
    lessons.push({ n, title, sub, big, html: $s.html() });
  });
  const parts = [];
  for (let i = 0; i < lessons.length; i += 10) {
    const chunk = lessons.slice(i, i + 10);
    const first = chunk[0].n, last = chunk[chunk.length - 1].n;
    parts.push({
      id: `lessons-${first}-${last}`,
      title: `Lessons ${first}–${last}`,
      blurb: chunk.map((l) => l.title).slice(0, 4).join(', ') + '…',
      sections: chunk.map((l) => ({ id: `lesson-${l.n}`, title: `${l.n}. ${l.title}`, group: null, html: l.html, isQuestion: false, summary: l.sub, lesson: true })),
    });
  }
  const extraCards = lessons.map((l) => ({ id: `lesson-${l.n}`, q: `C# lesson ${l.n}: ${l.title}`, a: clip(`${l.sub} ${l.big}`, 420), part: 'Lessons' }));
  meta.langHint = 'csharp';
  meta.layout = 'lessons';
  return finishTopic(meta, parts, { extraCards });
}

function fromGenai(file, meta) {
  const raw = fs.readFileSync(file, 'utf8');
  const d = extractConsts(raw, ['SECS', 'QA', 'CONCEPTS', 'CHEAT', 'REVISION', 'PLAN', 'CHECKLIST', 'TEN', 'GROUPS', 'RAGSTEPS', 'MOCK', 'TQ', 'DQ']);
  const $ = cheerio.load(raw);
  const parts = [];
  // 1. Start here: the big picture section from the static page
  const big = $('h2').filter((_, h) => /big picture/i.test($(h).text())).first();
  const bigHtml = big.length ? big.nextUntil('h2').toArray().map((e) => $.html(e)).join('') : '';
  const tenHtml = (d.TEN || []).map(([t, qs]) => `<li><b>${esc(t)}</b> <span class="muted">(${qs.join(', ')})</span></li>`).join('');
  const startSecs = [];
  if (bigHtml) startSecs.push({ id: 'big-picture', title: 'The big picture in one minute', html: bigHtml, isQuestion: false });
  if (tenHtml) startSecs.push({ id: 'ten-ideas', title: 'The 10 ideas to explain in under a minute', html: `<ol>${tenHtml}</ol>`, isQuestion: false });
  if (d.CHEAT) startSecs.push({ id: 'which-one', title: 'Which one to use? (problem → fix)', isQuestion: false, html: `<table><thead><tr><th>Problem</th><th>Reach for</th></tr></thead><tbody>${d.CHEAT.map(([a, b]) => `<tr><td>${esc(a)}</td><td><b>${esc(b)}</b></td></tr>`).join('')}</tbody></table>` });
  if (d.REVISION) startSecs.push({ id: 'one-liners', title: 'Last-minute revision one-liners', isQuestion: false, html: `<table><tbody>${d.REVISION.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>` });
  parts.push({ id: 'start-here', title: 'Start here', sections: startSecs });

  // 2. Concepts, grouped
  if (d.CONCEPTS) {
    const groups = d.GROUPS || {};
    const byG = {};
    for (const [g, name, simple, analogy, use] of d.CONCEPTS) (byG[g] ||= []).push({ name, simple, analogy, use });
    parts.push({
      id: 'concepts', title: 'Concepts in plain words',
      sections: Object.entries(byG).flatMap(([g, list]) => list.map((c) => ({
        id: slugify(c.name), title: c.name, group: groups[g] || g, isQuestion: false, summary: c.simple,
        html: `<p>${esc(c.simple)}</p><div class="callout analogy"><b>Everyday picture:</b> ${esc(c.analogy)}</div><div class="callout use"><b>Use it when:</b> ${esc(c.use)}</div>`,
      }))),
    });
  }
  // 3. Questions, by section
  const secs = d.SECS || {};
  const byS = {};
  for (const [id, s, q, a] of d.QA || []) (byS[s] ||= []).push({ id, q, a });
  for (const [s, list] of Object.entries(byS)) {
    parts.push({
      id: slugify(secs[s] || s), title: secs[s] || s,
      sections: list.map((x) => ({ id: x.id.toLowerCase(), title: `${x.id}. ${x.q}`, isQuestion: true, summary: x.a, html: `<p>${esc(x.a).replace(/\n/g, '<br>')}</p>` })),
    });
  }
  // 4. Code snippets
  const code = [];
  $('script.codesrc').each((_, s) => code.push({ title: $(s).attr('data-title'), note: $(s).attr('data-note'), body: $(s).html().replace(/^\n+|\s+$/g, '') }));
  const langOf = (t) => (/python|chroma|fastapi/i.test(t) ? 'python' : /postgres|sql|pgvector/i.test(t) ? 'sql' : 'javascript');
  if (code.length) parts.push({ id: 'code', title: 'Code you can reuse', sections: code.map((c) => ({ id: slugify(c.title), title: c.title, isQuestion: false, summary: c.note || '', html: `<pre class="language-${langOf(c.title)}">${esc(c.body)}</pre>${c.note ? `<p class="muted">${esc(c.note)}</p>` : ''}` })) });
  // 5. Study plan
  if (d.PLAN) parts.push({ id: 'study-plan', title: 'Study plan & checklist', sections: [
    { id: 'plan', title: '14-day study plan', isQuestion: false, html: `<table><thead><tr><th>Days</th><th>Topic</th><th>Do this</th></tr></thead><tbody>${d.PLAN.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td><b>${esc(b)}</b></td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>` },
    ...(d.CHECKLIST ? [{ id: 'checklist', title: 'Ready-for-interview checklist', isQuestion: false, html: `<ul class="checklist">${d.CHECKLIST.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` }] : []),
    ...['Project ideas for your CV', 'Interview tips'].map((t) => {
      const card = $('div.card').filter((_, c) => $(c).find('h3').first().text().trim() === t).first();
      return card.length ? { id: slugify(t), title: t, isQuestion: false, html: card.find('ul').toString() } : null;
    }).filter(Boolean),
  ] });
  // design scenarios: attach the mock-interview key points to S1..S10
  const qaPartOf = (id) => parts.flatMap((p) => p.sections).find((s) => s.id === id.toLowerCase());
  for (const [k, pts] of Object.entries(d.MOCK || {})) {
    const s = qaPartOf(k);
    if (s) s.html += `<h4>Key points to mention (mock interview checklist)</h4><ul class="checklist">${pts.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`;
  }
  const mock = Object.entries(d.MOCK || {}).map(([k, pts]) => ({ id: k, q: (d.QA || []).find((r) => r[0] === k)?.[2] || k, points: pts }));
  // the two practice quizzes become multiple-choice items
  const toMcq = (list, pool) => (list || []).map((x) => {
    const wrong = [...new Set(pool)].filter((o) => o !== x.a).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [x.a, ...wrong];
    return { q: x.q, options, answer: 0, explain: x.why };
  });
  const tPool = [...(d.TQ || []).map((t) => t.a), 'Fine-tuning with LoRA', 'Quantization', 'Semantic caching', 'Streaming responses', 'Larger context window', 'Lower temperature only'];
  const dPool = [...(d.DQ || []).map((t) => t.a), 'Switching to a bigger LLM', 'Fine-tuning the model'];
  const quiz = [...toMcq(d.TQ, tPool), ...toMcq(d.DQ, dPool)];
  const extraCards = (d.CONCEPTS || []).map(([, name, simple, analogy]) => ({ id: `concept-${slugify(name)}`, q: `Concept: ${name}`, a: `${simple} — ${analogy}`, part: 'Concepts' }));
  return finishTopic(meta, parts, { extraCards, ragSteps: d.RAGSTEPS || null, quiz, mock });
}

function fromVoice(file, meta) {
  const raw = fs.readFileSync(file, 'utf8');
  const d = extractConsts(raw, ['STEPS', 'MORE', 'UTTS', 'SC', 'EXTRA', 'QA', 'CODE', 'CODE2']);
  const $ = cheerio.load(raw);
  const staticSec = (id) => {
    const h = $(`h2#${id}`);
    if (!h.length) return null;
    const html = h.nextUntil('h2').toArray().map((e) => $.html(e)).join('');
    return { id: id.replace(/^s-/, ''), title: h.text().replace(/^\d+\.\s*/, ''), html, isQuestion: false };
  };
  const pick = (...ids) => ids.map(staticSec).filter(Boolean);
  const parts = [];
  parts.push({ id: 'explainer', title: 'The explainer', sections: pick('s-pitch', 's-arch', 's-state', 's-latency') });
  if (d.STEPS) parts.push({
    id: 'pipeline', title: 'The pipeline, step by step',
    sections: d.STEPS.map((s, i) => {
      const m = (d.MORE || [])[i] || {};
      return {
        id: slugify(s.nm), title: s.title, isQuestion: false, summary: s.say,
        html: `<div class="kv"><div><span>Tool</span>${esc(s.tool)}</div><div><span>Time</span>${esc(s.ms)}</div><div><span>In</span>${esc(s.inp)}</div><div><span>Out</span>${esc(s.out)}</div></div>`
          + `<div class="callout warn"><b>Risk:</b> ${esc(s.risk)}</div><div class="callout say"><b>Say it in the interview:</b> “${esc(s.say)}”</div>`
          + (m.how ? `<h4>How it works</h4><ol>${m.how.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : '')
          + (m.alt ? `<p class="muted"><b>Alternative:</b> ${esc(m.alt)}</p>` : '')
          + Object.entries(m).filter(([k]) => !['how', 'alt'].includes(k)).map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(Array.isArray(v) ? v.join(' · ') : typeof v === 'object' ? JSON.stringify(v) : v)}</p>`).join(''),
      };
    }),
  });
  const framework = $('h2#s-scen').nextAll('div.card').first();
  if (d.SC) parts.push({
    id: 'scenarios', title: 'Scenarios: problem → fix',
    sections: [
      ...(framework.length ? [{ id: 'six-step-structure', title: 'A 6-step structure for ANY “what if” question', isQuestion: false, html: framework.html() }] : []),
      ...d.SC.map((s, i) => {
      const x = (d.EXTRA || [])[i] || {};
      return {
        id: slugify(s.t), title: `If ${s.t.charAt(0).toLowerCase()}${s.t.slice(1)}, what goes wrong?`, group: s.c, isQuestion: true,
        summary: `Problem: ${s.bad} Fix: ${s.fix}`,
        html: `<div class="callout warn"><b>What goes wrong:</b> ${esc(s.bad)}</div><div class="callout use"><b>How to fix it:</b> ${esc(s.fix)}</div>`
          + (x.why ? `<p><b>Why it happens:</b> ${esc(x.why)}</p>` : '') + (x.trade ? `<p><b>Trade-off:</b> ${esc(x.trade)}</p>` : '') + (x.metric ? `<p><b>Measure it with:</b> ${esc(x.metric)}</p>` : ''),
      };
    }),
    ],
  });
  if (d.QA) parts.push({ id: 'quick-qa', title: 'Quick Q&A', sections: [...pick('s-qa').map((s) => ({ ...s, title: 'Cascade vs speech-to-speech' })), ...d.QA.map(([q, a]) => ({ id: slugify(q), title: q, isQuestion: true, summary: a, html: `<p>${esc(a)}</p>` }))] });
  const code = [];
  if (d.CODE) code.push({ id: 'cloud-code', title: 'Minimal working code (Python, cloud LLM)', isQuestion: false, html: `<pre class="language-python">${esc(d.CODE)}</pre>` });
  if (d.CODE2) code.push({ id: 'local-code', title: 'Run it for real (free, local, no API key)', isQuestion: false, html: (staticSec('s-local')?.html || '') + `<pre class="language-python">${esc(d.CODE2)}</pre>` });
  parts.push({ id: 'code', title: 'Code', sections: code });
  parts.push({ id: 'production', title: 'Measure, cost & safety', sections: pick('s-metrics', 's-sec', 's-gloss', 's-board') });
  return finishTopic(meta, parts, { steps: d.STEPS || [], utts: d.UTTS || [] });
}

/** The SQL lab runs PostgreSQL (PGlite) in the browser; serve its prebuilt ESM + wasm from /pglite. */
function copyPglite() {
  const from = path.join(ROOT, 'node_modules', '@electric-sql', 'pglite', 'dist');
  const to = path.join(PUB, 'pglite');
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    if (!/^(index\.js|chunk-[\w-]+\.js|pglite\.(js|wasm|data)|initdb\.(js|wasm))$/.test(f)) continue;
    const src = path.join(from, f), dst = path.join(to, f);
    if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) fs.copyFileSync(src, dst);
  }
}

// ---------- main ----------
async function main() {
  fs.mkdirSync(path.join(OUT, 'topics'), { recursive: true });
  fs.mkdirSync(path.join(PUB, 'originals'), { recursive: true });
  for (const f of fs.readdirSync(path.join(OUT, 'topics'))) fs.rmSync(path.join(OUT, 'topics', f));
  const files = [
    ...fs.readdirSync(SRC).map((f) => path.join(SRC, f)),
    ...(fs.existsSync(AUTH) ? fs.readdirSync(AUTH).filter((f) => f.endsWith('.md')).map((f) => path.join(AUTH, f)) : []),
  ].filter((f) => /\.(docx|html?|md)$/i.test(f));

  const index = [];
  const search = [];
  const built = {};
  let pi = 0;
  for (const file of files) {
    const base = path.basename(file);
    const cfg = CONFIG[base] || {};
    const stem = base.replace(/\.\w+$/, '');
    const meta = {
      slug: cfg.slug || slugify(stem),
      title: cfg.title || stem.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      subtitle: cfg.subtitle || '',
      emoji: cfg.emoji || '📘',
      accent: cfg.accent || PALETTE[pi++ % PALETTE.length],
      category: cfg.category || 'My notes',
      order: cfg.order ?? 100,
      source: base,
      original: null,
      layout: 'qa',
    };
    const handler = cfg.handler || (base.endsWith('.docx') ? 'docx' : base.endsWith('.md') ? 'md' : 'html');
    const t0 = Date.now();
    let topic;
    try {
      if (handler === 'docx') topic = await fromDocx(file, meta);
      else if (handler === 'md') topic = await fromMarkdown(file, meta);
      else if (handler === 'genai') topic = fromGenai(file, meta);
      else if (handler === 'voice') topic = fromVoice(file, meta);
      else if (handler === 'csharp') topic = fromCsharp(file, meta);
      else topic = fromGenericHtml(file, meta);
    } catch (e) {
      console.error(`✗ ${base}: ${e.stack}`);
      continue;
    }
    if (cfg.order != null) topic.order = cfg.order;
    if (cfg.about) topic.about = cfg.about;
    if (cfg.importParts && built[cfg.importParts.from]) {
      const src = built[cfg.importParts.from];
      const re = new RegExp(cfg.importParts.match, 'i');
      for (const p of src.parts.filter((x) => re.test(x.title))) {
        const title = (cfg.importParts.prefix || '') + p.title.replace(/^Part \d+\s*[—-]\s*/, '');
        topic.parts.push({ ...p, id: slugify(title), title });
        topic.cards.push(...src.cards.filter((c) => c.part === p.title).map((c) => ({ ...c, id: 'imp-' + c.id, part: title })));
      }
      topic.stats = { ...topic.stats, parts: topic.parts.length, sections: topic.parts.reduce((n, p) => n + p.sections.length, 0), questions: topic.parts.reduce((n, p) => n + p.sections.filter((x) => x.isQuestion).length, 0), cards: topic.cards.length };
    }
    built[topic.slug] = topic;
    if (/\.html?$/i.test(base)) {
      fs.copyFileSync(file, path.join(PUB, 'originals', base));
      topic.original = `/originals/${base}`;
    }
    delete topic.langHint;
    fs.writeFileSync(path.join(OUT, 'topics', `${topic.slug}.json`), JSON.stringify(topic));
    const { parts, cards, extras, ...rest } = topic;
    index.push({ ...rest, partList: parts.map((p) => ({ id: p.id, title: p.title, count: p.sections.length, blurb: p.blurb || p.sections.slice(0, 3).map((s) => cleanQ(s.title)).join(' · ') })), hasQuiz: !!extras.quiz, visualCount: (extras.visuals || []).length, lessonCount: parts.reduce((n, p) => n + p.sections.filter((s) => s.lesson).length, 0) });
    for (const p of parts) for (const s of p.sections) {
      // full-text: the unique words of the section body, so search finds terms beyond the title
      const words = [...new Set(textOf(s.html).toLowerCase().match(/[a-z0-9#+.$_-]{3,}/g) || [])].join(' ').slice(0, 2500);
      search.push([topic.slug, p.id, s.id, cleanQ(s.title), clip(s.summary || '', 140), p.title, words]);
    }
    console.log(`✓ ${base.padEnd(34)} → ${topic.slug.padEnd(18)} ${String(topic.stats.sections).padStart(4)} sections, ${String(topic.stats.cards).padStart(4)} cards (${Date.now() - t0} ms)`);
  }
  copyPglite();
  index.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  fs.writeFileSync(path.join(PUB, 'search-index.json'), JSON.stringify(search));
  console.log(`Done: ${index.length} topics, ${search.length} searchable sections.`);
}
main();
