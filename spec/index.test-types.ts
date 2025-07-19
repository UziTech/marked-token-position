import { Marked, type Token } from 'marked';
import markedTokenPosition, { addTokenPositions, type TokenWithPosition } from 'marked-token-position';

const marked = new Marked();

marked.use(markedTokenPosition());

const tokens: Token[] = marked.lexer('example markdown');
const tokensWithPosition: TokenWithPosition[] = addTokenPositions(tokens);
const tokenPosition = tokensWithPosition[0].position;

console.log(tokenPosition.start.offset);
console.log(tokenPosition.start.line);
console.log(tokenPosition.start.column);
console.log(tokenPosition.end.offset);
console.log(tokenPosition.end.line);
console.log(tokenPosition.end.column);
