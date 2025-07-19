import { Marked, type Token } from 'marked';
import markedTokenPosition, { addTokenPositions, type TokenWithPosition } from 'marked-token-position';

const marked = new Marked();

marked.use(markedTokenPosition());

const tokens: Token[] = marked.lexer('example markdown');
const tokensWithPosition: TokenWithPosition[] = addTokenPositions(tokens);
console.log(tokensWithPosition[0]?.position.start.offset);
console.log(tokensWithPosition[0]?.position.start.line);
console.log(tokensWithPosition[0]?.position.start.column);
console.log(tokensWithPosition[0]?.position.end.offset);
console.log(tokensWithPosition[0]?.position.end.line);
console.log(tokensWithPosition[0]?.position.end.column);
