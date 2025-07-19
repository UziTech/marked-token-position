// node:coverage ignore next
import type { MarkedExtension, Token, Tokens } from 'marked';

export interface TokenWithPosition extends Tokens.Generic {
  position: {
    offset: number;
    line: number;
    column: number;
  }
}

interface Position {
  start: PositionFields;
  end: PositionFields;
}

interface PositionFields {
  offset: number;
  line: number;
  column: number;
}

export function addTokenPositions(tokens: Token[]) {
  return addPosition(tokens, 0, 0, 0, tokens.map(token => token.raw).join('')).tokens;
}

export default function(options = {}): MarkedExtension {
  return {
    hooks: {
      processAllTokens: addTokenPositions,
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
      addPosition(genericToken.tokens, position.start.offset, position.start.line, position.start.column, raw);
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
