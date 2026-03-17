import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMathMarkdown } from './mathMarkdown.ts';
import { DEMO_MARKDOWN } from './demo_data.ts';

test('keeps valid inline math untouched', () => {
  const input = '若 $|a| > a$ 则 $\\frac{|a|}{a} = \\underline{\\qquad}$';
  assert.equal(normalizeMathMarkdown(input), input);
});

test('keeps standalone display math blocks', () => {
  const input = '$$\n\\frac{1}{2}\n$$';
  assert.equal(normalizeMathMarkdown(input), input);
});

test('downgrades inline display math to inline math inside text', () => {
  const input = '若 $$\\frac{|a|}{a}$$ 则答案为 $$\\underline{\\qquad}$$';
  const output = normalizeMathMarkdown(input);
  assert.equal(output, '若 $\\frac{|a|}{a}$ 则答案为 $\\underline{\\qquad}$');
});

test('repairs common stray closing dollars without leaking raw latex', () => {
  const input = '3. 方程 |x - 2| + |x - 3| = 1$ 的解为 $$\\underline{\\qquad}$$';
  const output = normalizeMathMarkdown(input);
  assert.equal(output, '3. 方程 $|x - 2| + |x - 3| = 1$ 的解为 $\\underline{\\qquad}$');
});

test('demo markdown remains stable', () => {
  assert.equal(normalizeMathMarkdown(DEMO_MARKDOWN), DEMO_MARKDOWN);
});
