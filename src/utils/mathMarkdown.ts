const MATH_TOKEN =
  String.raw`(?:\\[a-zA-Z]+(?:\{[^{}]*\})*|[A-Za-z0-9|{}_^+\-*/=<>()[\].]+)`;

function countInlineDollarDelimiters(line: string): number {
  let count = 0;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] !== '$') continue;
    if (line[i - 1] === '\\') continue;
    if (line[i + 1] === '$') {
      i += 1;
      continue;
    }
    count += 1;
  }
  return count;
}

function isStandaloneDisplayMath(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('$$') &&
    trimmed.endsWith('$$') &&
    trimmed.length >= 4 &&
    trimmed.slice(2, -2).indexOf('$$') === -1
  );
}

function toInlineMath(expr: string): string {
  return `$${expr.trim()}$`;
}

function downgradeInlineDisplayMath(line: string): string {
  if (isStandaloneDisplayMath(line)) return line;
  return line.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, inner: string) => toInlineMath(inner));
}

function repairMissingOpeningDollar(line: string): string {
  const pattern = new RegExp(
    String.raw`(^|[\s(（:：，。；、])((?:${MATH_TOKEN})(?:\s+(?:${MATH_TOKEN}))*)\$(?=\s*[\u4e00-\u9fff，。；、])`,
    'g',
  );
  return line.replace(pattern, (_, prefix: string, expr: string) => `${prefix}${toInlineMath(expr)}`);
}

function removeRightmostSingleDollar(line: string, matcher: (index: number) => boolean): string {
  for (let i = line.length - 1; i >= 0; i -= 1) {
    if (line[i] !== '$') continue;
    if (line[i - 1] === '\\' || line[i - 1] === '$' || line[i + 1] === '$') continue;
    if (!matcher(i)) continue;
    return `${line.slice(0, i)}${line.slice(i + 1)}`;
  }
  return line;
}

function trimOrphanTrailingDollar(line: string): string {
  let next = line;
  if (countInlineDollarDelimiters(next) % 2 === 0) return next;

  next = removeRightmostSingleDollar(next, (index) => {
    const tail = next.slice(index + 1);
    return /^\s*(?:[，。；、]|$)/.test(tail);
  });
  if (countInlineDollarDelimiters(next) % 2 === 0) return next;

  next = removeRightmostSingleDollar(next, (index) => /^\s*[\u4e00-\u9fff]/.test(next.slice(index + 1)));
  return next;
}

function normalizeLineMath(line: string): string {
  let next = downgradeInlineDisplayMath(line);
  next = next.replace(/\$\$\s*(=?\s*\\underline\{\\qquad\})\s*\$\$/g, (_, expr: string) => toInlineMath(expr));
  if (countInlineDollarDelimiters(next) % 2 !== 0) {
    next = repairMissingOpeningDollar(next);
    next = trimOrphanTrailingDollar(next);
  }
  return next;
}

function mergeBlankIntoPrevious(lines: string[]): string[] {
  const result: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim() === '$$\\underline{\\qquad}$$'
      ? '$\\underline{\\qquad}$'
      : rawLine;

    if (
      result.length > 0 &&
      line.trim() === '$\\underline{\\qquad}$' &&
      /(?:=|为|值为|范围为|解为)\s*$/.test(result[result.length - 1].trim())
    ) {
      result[result.length - 1] = `${result[result.length - 1].trimEnd()} ${line.trim()}`;
      continue;
    }

    result.push(line);
  }
  return result;
}

export function normalizeMathMarkdown(raw: string): string {
  const normalizedLines = raw.replace(/\r\n?/g, '\n').split('\n').map(normalizeLineMath);
  return mergeBlankIntoPrevious(normalizedLines).join('\n');
}
