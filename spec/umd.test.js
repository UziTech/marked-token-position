import { describe, test } from 'node:test';
import '../lib/index.umd.js';

describe('marked-token-position umd', () => {
  test('test umd global', (t) => {
    t.assert.equal(typeof globalThis.markedTokenPosition, 'function');
    t.assert.equal(typeof globalThis.markedTokenPosition.addTokenPositions, 'function');
  });
});
