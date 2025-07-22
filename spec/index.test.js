import { describe, test } from 'node:test';
import { Marked, walkTokens } from 'marked';
import markedTokenPosition, { addTokenPositions } from '../src/index.ts';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function getFixture(path) {
  return readFile(resolve(import.meta.dirname, 'fixtures', path), { encoding: 'utf-8' });
}

function getLineColumn(offset, markdown) {
  const lines = markdown.substring(0, offset).split('\n');

  return {
    line: lines.length - 1,
    column: lines.at(-1)?.length ?? 0,
  };
}

function checkPositions(t, tokens, markdown) {
  walkTokens(tokens, (token) => {
    const offsetString = markdown.substring(token.position.start.offset, token.position.end.offset);
    const { line: startLine, column: startColumn } = getLineColumn(token.position.start.offset, markdown);
    const { line: endLine, column: endColumn } = getLineColumn(token.position.end.offset, markdown);

    t.assert.equal(offsetString, token.raw);
    t.assert.equal(startLine, token.position.start.line);
    t.assert.equal(startColumn, token.position.start.column);
    t.assert.equal(endLine, token.position.end.line);
    t.assert.equal(endColumn, token.position.end.column);
  });
}

function testPosition(t) {
  return {
    hooks: {
      processAllTokens(tokens) {
        t.assert.snapshot(tokens);
        return tokens;
      },
    },
  };
}

describe('markedTokenPosition', () => {
  test('example', (t) => {
    const marked = new Marked(testPosition(t));
    marked.use(markedTokenPosition());

    t.assert.snapshot(marked.parse('# example markdown'));
  });

  test('list', (t) => {
    const marked = new Marked(testPosition(t));
    marked.use(markedTokenPosition());

    t.assert.snapshot(marked.parse('- example markdown'));
  });

  test('table', (t) => {
    const marked = new Marked(testPosition(t));
    marked.use(markedTokenPosition());

    t.assert.snapshot(marked.parse(`
| a | b |
|---|---|
| 1 | 2 |
`));
  });

  test('childTokens', (t) => {
    const marked = new Marked(testPosition(t));
    const extension = {
      extensions: [
        {
          name: 'customTag',
          level: 'block',
          tokenizer(src) {
            const match = src.match(/^:(.*?):\n([^]*?)\n:(?:\n|$)/);

            if (match) {
              return {
                type: 'customTag',
                raw: match[0],
                tag: match[1],
                text: match[2],
                childTokens: ['myTokens'],
                myTokens: this.lexer.inline(match[2]),
              };
            }
          },
          renderer({ tag, myTokens }) {
            return `<${tag}>${this.parser.parseInline(myTokens)}</${tag}>`;
          },
          childTokens: ['myTokens'],
        },
      ],
    };
    marked.use(markedTokenPosition(), extension);

    t.assert.snapshot(marked.parse(`
:newTag:
**some text**
:
`));
  });
});

describe('addTokenPositions', () => {
  test('example markdown', (t) => {
    const marked = new Marked();
    const md = '# example markdown';
    const tokens = marked.lexer(md);
    t.assert.snapshot(addTokenPositions(tokens));
    checkPositions(t, tokens, md);
  });

  test('reference', async(t) => {
    const marked = new Marked();
    const md = await getFixture('reference.md');
    const tokens = marked.lexer(md);
    t.assert.snapshot(addTokenPositions(tokens, md));
    // TODO: enable this when it is passing
    // checkPositions(t, tokens, md);
  });
});
