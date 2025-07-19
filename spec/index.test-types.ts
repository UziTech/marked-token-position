import { Marked, type Token } from 'marked';
import markedTokenPosition, { addTokenPositions, type TokenWithPosition } from 'marked-token-position';

const marked = new Marked();

marked.use(markedTokenPosition());

const tokens: Token[] = marked.lexer('example markdown');
const tokensWithPosition: TokenWithPosition[] = addTokenPositions(tokens);
console.log(tokensWithPosition[0]?.position.offset);
console.log(tokensWithPosition[0]?.position.line);
console.log(tokensWithPosition[0]?.position.column);
