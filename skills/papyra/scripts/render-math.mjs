import { readFile } from 'node:fs/promises';
import temml from '../assets/temml-0.14.0/temml.mjs';

// Generation aid for agent-selected math, not a Markdown parser or product CLI.
const assets = new URL('../assets/', import.meta.url);
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function expression(source) {
  for (const [open, close, displayMode] of [
    ['$$', '$$', true], ['\\[', '\\]', true], ['\\(', '\\)', false], ['$', '$', false]
  ]) {
    if (source.startsWith(open) && source.endsWith(close) && source.length > open.length + close.length) {
      return { tex: source.slice(open.length, -close.length), displayMode };
    }
  }
  // References are explicitly selected tokens, never searched across a document.
  if (/^\\(?:eqref|ref)\{[A-Za-z0-9_-]+\}$/.test(source)) {
    return { tex: source, displayMode: false };
  }
  throw new Error('Expected a complete, explicitly selected math span with matching delimiters, or a standalone \\ref/\\eqref token.');
}

function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function sourceDetails(item) {
  return `<details class="math-source"${item.error ? ' open' : ''}><summary data-enhancement="math">${item.error ? '查看未能渲染的 TeX 原文' : '查看 TeX 原文'}</summary><pre><code>${escapeHTML(item.source)}</code></pre></details>`;
}

/**
 * Input is a list of agent-identified spans, not an entire Markdown document.
 * Each id must be unique in the page and contain only ASCII letters/digits/_/-.
 * Display math is numbered by default; numbered:false suppresses its number.
 * Use $$...\\label{key}$$ and separately selected \\eqref{key}/\\ref{key}.
 * Returns explicit failures; callers must inspect errors before publishing.
 */
export function renderMathEntries(entries) {
  const ids = new Set();
  let nextNumber = 0;
  const items = entries.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(entry.id) || ids.has(entry.id)) {
      throw new Error('Math entry ids must be unique, nonempty ASCII letters/digits/_/-.');
    }
    ids.add(entry.id);
    if (typeof entry.source !== 'string') throw new TypeError(`${entry.id}: source must be an exact string.`);
    const item = { id: entry.id, source: entry.source, labels: [], references: [], error: null };
    try {
      const parsed = expression(item.source);
      item.displayMode = parsed.displayMode;
      // Fixed security options: no document-supplied HTML, URLs, macros or options.
      // The pinned internal tree API is needed to resolve references before HTML exists.
      item.tree = temml.__renderToMathMLTree(parsed.tex, {
        displayMode: parsed.displayMode,
        annotate: false,
        throwOnError: true,
        strict: true,
        trust: false,
        macros: Object.create(null),
        maxExpand: 1000,
        maxSize: [20, 10],
        xml: true
      });
      walk(item.tree, node => {
        if (node.classes?.some(name => name === 'tml-eqn' || name === 'tml-tageqn' || name === 'tml-tag')) {
          throw new Error('Use display delimiters with aligned/matrix and \\label; automatic equation environments and \\tag are not supported by this numbering contract.');
        }
        if (node.label) item.labels.push(node.label);
        if (node.classes?.includes('tml-ref')) item.references.push(node);
      });
      if (item.labels.length && (!parsed.displayMode || entry.numbered === false)) {
        throw new Error('Equation labels require a numbered display formula.');
      }
      item.number = parsed.displayMode && entry.numbered !== false ? ++nextNumber : null;
    } catch (error) {
      item.error = error.message;
    }
    return item;
  });

  // Detect every duplicate, rather than letting one target silently win.
  const definitions = new Map();
  for (const item of items.filter(item => !item.error)) {
    for (const label of item.labels) {
      const owners = definitions.get(label) ?? [];
      owners.push(item);
      definitions.set(label, owners);
    }
  }
  for (const [label, owners] of definitions) {
    if (owners.length > 1) for (const owner of owners) owner.error = `Duplicate equation label: ${label}`;
  }
  // A failed target cannot keep its references looking successful. Propagate
  // failures through forward references until all remaining targets are valid.
  let changed;
  do {
    changed = false;
    const validLabels = new Map();
    for (const item of items.filter(item => !item.error)) {
      for (const label of item.labels) validLabels.set(label, item);
    }
    for (const item of items.filter(item => !item.error)) {
      const missing = item.references.find(node => !validLabels.has(node.href.slice(1)));
      if (missing) {
        item.error = `Unresolved equation reference: ${missing.href.slice(1)}`;
        changed = true;
      }
    }
  } while (changed);
  const validLabels = new Map();
  for (const item of items.filter(item => !item.error)) {
    for (const label of item.labels) validLabels.set(label, item);
  }

  const output = items.map(item => {
    if (!item.error) {
      for (const reference of item.references) {
        const target = validLabels.get(reference.href.slice(1));
        const text = reference.classes.includes('tml-eqref') ? `(${target.number})` : String(target.number);
        reference.href = `#papyra-equation-${target.id}`;
        reference.children = [{ toMarkup: () => escapeHTML(text) }];
      }
    }
    const block = item.displayMode ? ' math-block' : '';
    const html = item.error
      ? `<span class="math-error" data-enhancement="math">公式渲染失败：${escapeHTML(item.error)}</span>`
      : `<span class="math-visual${block}" data-enhancement="math"${item.displayMode ? ` id="papyra-equation-${item.id}"` : ''}><span class="math-typeset">${item.tree.toMarkup()}</span>${item.number ? `<span class="math-number">(${item.number})</span>` : ''}</span>`;
    return {
      id: item.id, source: item.source, html, sourceHTML: sourceDetails(item),
      ok: !item.error, error: item.error, number: item.number ?? null,
      labels: item.labels, displayMode: Boolean(item.displayMode)
    };
  });
  return { items: output, errors: output.filter(item => !item.ok).map(({ id, error }) => ({ id, message: error })) };
}

/** Read real bundled resources; no npm install, network or browser runtime. */
export async function loadMathAssets() {
  const [upstreamCSS, css, font, license] = await Promise.all([
    readFile(new URL('temml-0.14.0/Temml-Local.css', assets), 'utf8'),
    readFile(new URL('math.css', assets), 'utf8'),
    readFile(new URL('temml-0.14.0/Temml.woff2', assets)),
    readFile(new URL('../licenses/temml-MIT.txt', assets), 'utf8')
  ]);
  const fontURL = "url('Temml.woff2')";
  if (upstreamCSS.split(fontURL).length !== 2) throw new Error('Unexpected upstream Temml font URL.');
  const embeddedCSS = upstreamCSS.replace(fontURL, `url('data:font/woff2;base64,${font.toString('base64')}')`);
  if (/<\/style/i.test(embeddedCSS + css) || license.includes('-->')) throw new Error('Unsafe style/comment embedding boundary.');
  return {
    css: `${embeddedCSS}\n${css}`,
    licenseComment: `<!-- Temml 0.14.0; https://registry.npmjs.org/temml/-/temml-0.14.0.tgz\n${license}-->`
  };
}
