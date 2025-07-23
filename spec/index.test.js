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

function checkPositionLines(t, tokens, markdown) {
  walkTokens(tokens, (token) => {
    const { line: startLine, column: startColumn } = getLineColumn(token.position.start.offset, markdown);
    const { line: endLine, column: endColumn } = getLineColumn(token.position.end.offset, markdown);
    t.assert.equal(startLine, token.position.start.line);
    t.assert.equal(startColumn, token.position.start.column);
    t.assert.equal(endLine, token.position.end.line);
    t.assert.equal(endColumn, token.position.end.column);

    const offsetLines = markdown.substring(token.position.start.offset, token.position.end.offset).replace(/\n$/, '').split('\n');
    const rawLines = token.raw.replace(/\n$/, '').split('\n');
    t.assert.equal(token.position.lines.length, rawLines.length);
    t.assert.equal(token.position.lines.length, offsetLines.length);

    for (let i = 0; i < token.position.lines.length; i++) {
      const position = token.position.lines[i];
      const rawLine = rawLines[i];

      t.assert.ok(offsetLines[i].includes(rawLine));
      if (i === 0) {
        t.assert.ok(offsetLines[0].startsWith(rawLine));
      }
      if (i === token.position.lines.length - 1) {
        t.assert.ok(offsetLines.at(-1).endsWith(rawLine));
      }

      const offsetString = markdown.substring(position.start.offset, position.end.offset);
      t.assert.equal(offsetString, rawLine);

      const { line: startLine, column: startColumn } = getLineColumn(position.start.offset, markdown);
      const { line: endLine, column: endColumn } = getLineColumn(position.end.offset, markdown);
      t.assert.equal(startLine, position.start.line);
      t.assert.equal(startColumn, position.start.column);
      t.assert.equal(endLine, position.end.line);
      t.assert.equal(endColumn, position.end.column);
    }
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
    checkPositionLines(t, tokens, md);
  });

  test('blockquote', (t) => {
    const marked = new Marked();
    const md = '> line 1\n> line 2';
    const tokens = marked.lexer(md);
    t.assert.snapshot(addTokenPositions(tokens));
    checkPositionLines(t, tokens, md);
  });

  test('list', (t) => {
    const marked = new Marked();
    const md = '- line 1\n  line 2';
    const tokens = marked.lexer(md);
    t.assert.snapshot(addTokenPositions(tokens));
    checkPositionLines(t, tokens, md);
  });

  test('reference', async(t) => {
    const marked = new Marked();
    const md = await getFixture('reference.md');
    const tokens = marked.lexer(md);
    t.assert.snapshot(addTokenPositions(tokens, md));
    checkPositionLines(t, tokens, md);
  });
});
