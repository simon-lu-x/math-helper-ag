import React, { useRef, useEffect, useCallback } from 'react';
import katex from 'katex';

interface FriendlyEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

// ── Segment parsing ───────────────────────────────────────────────────────────

type Segment = { type: 'text'; value: string } | { type: 'math'; raw: string; value: string };

function parseSegments(text: string): Segment[] {
  const result: Segment[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$(?:[^$\n\\]|\\.)*?\$)/g;
  let last = 0;
  for (const m of text.matchAll(regex)) {
    const idx = m.index!;
    if (idx > last) result.push({ type: 'text', value: text.slice(last, idx) });
    const raw = m[0];
    result.push({ type: 'math', raw, value: raw.startsWith('$$') ? raw.slice(2, -2) : raw.slice(1, -1) });
    last = idx + raw.length;
  }
  if (last < text.length) result.push({ type: 'text', value: text.slice(last) });
  return result;
}

// ── Line parsing ──────────────────────────────────────────────────────────────

type LineType = 'h1' | 'h2' | 'li' | 'para' | 'empty';
interface ParsedLine { type: LineType; prefix: string; numLabel: string; segments: Segment[] }

function parseLine(raw: string): ParsedLine {
  if (raw.trim() === '') return { type: 'empty', prefix: '', numLabel: '', segments: [] };
  if (raw.startsWith('# '))  return { type: 'h1',  prefix: '# ',  numLabel: '', segments: parseSegments(raw.slice(2)) };
  if (raw.startsWith('## ')) return { type: 'h2',  prefix: '## ', numLabel: '', segments: parseSegments(raw.slice(3)) };
  const li = raw.match(/^(\d+\.)\s{1,4}(.*)/);
  if (li) return { type: 'li', prefix: li[1] + '  ', numLabel: li[1], segments: parseSegments(li[2]) };
  return { type: 'para', prefix: '', numLabel: '', segments: parseSegments(raw) };
}

// ── HTML building ─────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function segmentsToHTML(segs: Segment[]): string {
  if (segs.length === 0) return '<br>';
  const html = segs.map(seg => {
    if (seg.type === 'text') return esc(seg.value);
    try {
      const rendered = katex.renderToString(seg.value, { displayMode: false, throwOnError: false });
      return `<span class="math-chip" contenteditable="false" data-raw="${encodeURIComponent(seg.raw)}">${rendered}</span>`;
    } catch {
      return `<span class="math-chip" contenteditable="false" data-raw="${encodeURIComponent(seg.raw)}">${esc(seg.raw)}</span>`;
    }
  }).join('');
  return html || '<br>';
}

function buildHTML(content: string): string {
  return content.split('\n').map(raw => {
    const line = parseLine(raw);
    const inner = segmentsToHTML(line.segments);
    const p = `data-prefix="${encodeURIComponent(line.prefix)}"`;
    switch (line.type) {
      case 'h1':    return `<div class="fe-line fe-h1" ${p}>${inner}</div>`;
      case 'h2':    return `<div class="fe-line fe-h2" ${p}>${inner}</div>`;
      case 'empty': return `<div class="fe-line fe-empty" data-prefix=""><br></div>`;
      case 'li':
        return `<div class="fe-line fe-li" ${p}><span class="fe-num" contenteditable="false">${esc(line.numLabel)}</span><span class="fe-content">${inner}</span></div>`;
      default:      return `<div class="fe-line fe-para" ${p}>${inner}</div>`;
    }
  }).join('');
}

// ── Markdown extraction ───────────────────────────────────────────────────────

function extractNodeText(node: Node): string {
  let out = '';
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? '';
    } else if (child instanceof HTMLElement) {
      if (child.tagName === 'BR') continue;
      if (child.dataset.raw) { out += decodeURIComponent(child.dataset.raw); continue; }
      if (child.classList.contains('fe-num')) continue;           // skip visual label
      if (child.classList.contains('fe-content')) { out += extractNodeText(child); continue; }
      out += extractNodeText(child);
    }
  }
  return out;
}

function extractMarkdown(container: HTMLElement): string {
  const lines: string[] = [];
  for (const child of container.children) {
    const el = child as HTMLElement;
    const prefix = decodeURIComponent(el.dataset.prefix ?? '');
    lines.push(prefix + extractNodeText(el));
  }
  return lines.join('\n');
}

// ── Component ─────────────────────────────────────────────────────────────────

export const FriendlyEditor: React.FC<FriendlyEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastExternal = useRef(content);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = buildHTML(content);
      lastExternal.current = content;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (content !== lastExternal.current && editorRef.current) {
      editorRef.current.innerHTML = buildHTML(content);
      lastExternal.current = content;
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const markdown = extractMarkdown(editorRef.current);
    lastExternal.current = markdown;
    onChange(markdown);
  }, [onChange]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      className="fe-editor w-full min-h-[80vh] p-10 outline-none bg-white overflow-y-auto"
    />
  );
};
