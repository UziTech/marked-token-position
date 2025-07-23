// node:coverage ignore next
import type { MarkedExtension, Token, Tokens } from 'marked';

export interface TokenWithPosition extends Tokens.Generic {
  position: Position;
}

interface Position {
  /**
   * position at the beginning of token
   */
  start: PositionFields;
  /**
   * position at the end of token
   */
  end: PositionFields;
  /**
   * positions of each line of the token
   */
  lines?: Position[];
}

interface PositionFields {
  /**
   * Number of characters from the beginning of the markdown string
   */
  offset: number;
  /**
   * Line number of the token. Starts at line 0.
   */
  line: number;
  /**
   * Column number of the token. Starts at column 0.
   */
  column: number;
}

/**
 * Add position field to tokens
 */
export function addTokenPositions(tokens: Token[], markdown?: string) {
  // adding token.raw doesn't work this way if reflinks are used
  markdown ??= tokens.map(token => token.raw).join('');
  return addPosition(tokens, 0, 0, 0, markdown).tokens;
}

/**
 * Marked extension to add position field to tokens
 */
export default function(options = {}): MarkedExtension {
  let originalMarkdown = '';
  return {
    hooks: {
      preprocess(md) {
        originalMarkdown = md;
        return md;
      },
      processAllTokens(tokens) {
        return addTokenPositions(tokens, originalMarkdown);
      },
    },
  };
}

function addPosition(tokens: Token[], offset: number, line: number, column: number, markdown: string) {
  for (const token of tokens) {
    const genericToken = token as Tokens.Generic;
    const position = getPosition(offset, line, column, markdown, genericToken.raw);
    genericToken.position = position;

    if (genericToken.tokens) {
      addPosition(genericToken.tokens, offset, line, column, markdown);
    }

    if (genericToken.childTokens) {
      let nextOffset = offset;
      let nextLine = line;
      let nextColumn = column;
      let nextMarkdown = markdown;
      for (const childToken of genericToken.childTokens) {
        const nextPosition = addPosition(genericToken[childToken], nextOffset, nextLine, nextColumn, nextMarkdown);
        nextOffset = nextPosition.offset;
        nextLine = nextPosition.line;
        nextColumn = nextPosition.column;
        nextMarkdown = nextPosition.markdown;
      }
    }

    if (genericToken.type === 'list') {
      addPosition(genericToken.items, offset, line, column, markdown);
    }

    if (genericToken.type === 'table') {
      let nextOffset = offset;
      let nextLine = line;
      let nextColumn = column;
      let nextMarkdown = markdown;
      for (const headerCell of genericToken.header) {
        const nextPosition = addPosition(headerCell.tokens, nextOffset, nextLine, nextColumn, nextMarkdown);
        nextOffset = nextPosition.offset;
        nextLine = nextPosition.line;
        nextColumn = nextPosition.column;
        nextMarkdown = nextPosition.markdown;
      }
      for (const row of genericToken.rows) {
        for (const rowCell of row) {
          const nextPosition = addPosition(rowCell.tokens, nextOffset, nextLine, nextColumn, nextMarkdown);
          nextOffset = nextPosition.offset;
          nextLine = nextPosition.line;
          nextColumn = nextPosition.column;
          nextMarkdown = nextPosition.markdown;
        }
      }
    }

    const deltaOffset = position.end.offset - offset;
    offset = position.end.offset;
    line = position.end.line;
    column = position.end.column;
    markdown = markdown.slice(deltaOffset);
  }

  return {
    tokens: tokens as TokenWithPosition[],
    offset,
    line,
    column,
    markdown,
  };
}

function getPosition(offset: number, line: number, column: number, markdown: string, raw: string): Position {
  let lines: Position[] = [];
  const rawLines = raw.split('\n');
  const markdownLines = markdown.split('\n');

  // eslint-disable-next-line no-labels
  md: for (let i = 0; i <= markdownLines.length - rawLines.length; i++) {
    lines = [];
    for (let j = 0; j < rawLines.length; j++) {
      const markdownLine = markdownLines[i + j];
      const rawLine = rawLines[j];
      const lineStartOffset = markdownLine.indexOf(rawLine);

      if (lineStartOffset === -1) {
        // eslint-disable-next-line no-labels
        continue md;
      }

      const beforeMarkdownLines = markdownLines.slice(0, i + j).join('\n') + (i + j > 0 ? '\n' : '');
      const start = {
        offset: offset + beforeMarkdownLines.length + lineStartOffset,
        line: line + i + j,
        column: (i + j === 0 ? column : 0) + lineStartOffset,
      };
      const end = {
        offset: start.offset + rawLine.length,
        line: start.line,
        column: start.column + rawLine.length,
      };

      lines.push({
        start,
        end,
      });
    }
    break;
  }

  if (lines.length === 0) {
    throw new Error(`Cannot find ${JSON.stringify(raw)} in ${JSON.stringify(markdown)}`);
  }

  return {
    lines,
    start: lines[0].start,
    end: lines.at(-1)!.end,
  };
}
