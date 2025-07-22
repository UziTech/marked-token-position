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

function addPosition(tokens: Token[], offset: number, line: number, column: number, markdown : string) {
  for (const token of tokens) {
    const genericToken = token as Tokens.Generic;
    const raw = genericToken.raw;
    const position = getPosition(offset, line, column, markdown, raw);
    genericToken.position = position;

    if (genericToken.tokens) {
      addPosition(genericToken.tokens, position.start.offset, position.start.line, position.start.column, genericToken.type === 'blockquote' ? raw.replace(/(?<=^|\n)> /g, '') : raw);
    }

    if (genericToken.childTokens) {
      let nextOffset = position.start.offset;
      let nextLine = position.start.line;
      let nextColumn = position.start.column;
      let nextMarkdown = raw;
      for (const childToken of genericToken.childTokens) {
        const nextPosition = addPosition(genericToken[childToken], nextOffset, nextLine, nextColumn, nextMarkdown);
        nextOffset = nextPosition.offset;
        nextLine = nextPosition.line;
        nextColumn = nextPosition.column;
        nextMarkdown = nextPosition.markdown;
      }
    }

    if (genericToken.type === 'list') {
      addPosition(genericToken.items, position.start.offset, position.start.line, position.start.column, raw);
    }

    if (genericToken.type === 'table') {
      let nextOffset = position.start.offset;
      let nextLine = position.start.line;
      let nextColumn = position.start.column;
      let nextMarkdown = raw;
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
  const startOffset = markdown.indexOf(raw);
  const before = markdown.slice(0, startOffset);
  const beforeLines = before.split('\n');
  const rawLines = raw.split('\n');
  const start = {
    offset: offset + before.length,
    line: line + beforeLines.length - 1,
    column: (beforeLines.length === 1 ? column : 0) + beforeLines.at(-1)!.length,
  };
  const end = {
    offset: start.offset + raw.length,
    line: start.line + rawLines.length - 1,
    column: (rawLines.length === 1 ? start.column : 0) + rawLines.at(-1)!.length,
  };
  return {
    start,
    end,
  };
}
