import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMathEntries } from '../skills/papyra/scripts/render-math.mjs';

// Cross-entry failures must not leave plausible but incorrect equation references.
test('duplicate labels invalidate all owners and references', () => {
  const result = renderMathEntries([
    { id: 'first', source: '$$a=1\\label{shared}$$' },
    { id: 'second', source: '$$b=2\\label{shared}$$' },
    { id: 'reference', source: '\\eqref{shared}' }
  ]);
  assert.deepEqual(result.items.map(item => [item.id, item.ok]), [
    ['first', false], ['second', false], ['reference', false]
  ]);
  assert.deepEqual(new Set(result.errors.map(error => error.id)), new Set(['first', 'second', 'reference']));
});

test('unknown macro invalidates its equation and dependent references, not unrelated math', () => {
  const result = renderMathEntries([
    { id: 'reference', source: '\\eqref{broken}' },
    { id: 'broken', source: '$$\\notARealMathCommand{x}\\label{broken}$$' },
    { id: 'independent', source: '$x^2$' }
  ]);
  assert.deepEqual(result.items.map(item => [item.id, item.ok]), [
    ['reference', false], ['broken', false], ['independent', true]
  ]);
  assert.deepEqual(new Set(result.errors.map(error => error.id)), new Set(['reference', 'broken']));
});

test('a missing label reports the reference as unresolved', () => {
  const result = renderMathEntries([{ id: 'reference', source: '\\eqref{absent}' }]);
  assert.deepEqual(result.errors.map(error => error.id), ['reference']);
  assert.equal(result.items[0].ok, false);
});

test('document-supplied links and HTML extensions are rejected', () => {
  const result = renderMathEntries([
    { id: 'link', source: '$\\href{javascript:alert(1)}{x}$' },
    { id: 'html', source: '$\\htmlClass{injected}{x}$' }
  ]);
  assert.deepEqual(result.items.map(item => [item.id, item.ok]), [['link', false], ['html', false]]);
  assert.deepEqual(new Set(result.errors.map(error => error.id)), new Set(['link', 'html']));
});
