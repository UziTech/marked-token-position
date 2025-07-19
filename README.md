<!-- You may also delete any comments you don't need anymore. -->

# TODO:

- [ ] Write extension in `/src/index.ts`
- [ ] Write tests in `/spec/index.test.js`
- [ ] Uncomment release in `/.github/workflows/main.yml`

<!-- Delete this line and above -->

# marked-token-position

Add `position` field for each token.

`token.position.line` = line token starts on
`token.position.column` = column token starts on

# Usage

```js
import {Marked} from "marked";
import markedTokenPosition from "marked-token-position";

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-token-position/lib/index.umd.js"></script>
// const Marked = marked.Marked;

const marked = new Marked();

marked.use(markedTokenPosition());

marked.lexer("# example markdown");
// TODO: show example output
```
