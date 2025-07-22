# marked-token-position

Add `position` field for each token.

```ts
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
```

# Usage

## Extension

```js
import {Marked} from "marked";
import markedTokenPosition from "marked-token-position";

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-token-position/lib/index.umd.js"></script>
// const Marked = marked.Marked;

const marked = new Marked();

function anotherExtension {
	return {
		walkTokens(token) {
			// token has `position` field
		}
		hooks: {
			processAllTokens(tokens) {
				// tokens have `position` field
			}
		}
	};
}

marked.use(anotherExtension(), markedTokenPosition());

marked.parse("# example markdown");
```

The `position` field will be added to the tokens so any other extension can
use the `position` field in a `walkTokens` function or `processAllTokens` hook.

> [!CAUTION]
> The `processAllTokens` hook is used by this extension so any other extension
> using `processAllTokens` that requires the `position` field must be added
> before this extension because marked calls the `processAllTokens` hooks in
> reverse order.

The tokens will look like:

```json
[
  {
    "type": "heading",
    "raw": "# example markdown",
    "depth": 1,
    "text": "example markdown",
    "tokens": [
      {
        "type": "text",
        "raw": "example markdown",
        "text": "example markdown",
        "escaped": false,
        "position": {
          "start": {
            "offset": 2,
            "line": 0,
            "column": 2
          },
          "end": {
            "offset": 18,
            "line": 0,
            "column": 18
          }
        }
      }
    ],
    "position": {
      "start": {
        "offset": 0,
        "line": 0,
        "column": 0
      },
      "end": {
        "offset": 18,
        "line": 0,
        "column": 18
      }
    }
  }
]
```

## addTokenPositions

Calling `marked.lexer()` will not add the `position` field with the extension
since the extension is only called on `marked.parse()` and `marked.parseInline()`.

An `addTokenPositions` function is exported to add the `position` field to the
tokens returned by `marked.lexer()`.

```js
import {Marked} from "marked";
import {addTokenPositions} from "marked-token-position";

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-token-position/lib/index.umd.js"></script>
// const Marked = marked.Marked;
// const addTokenPositions = markedTokenPosition.addTokenPositions;


const marked = new Marked();
const markdown = "# example markdown";
const tokens = marked.lexer(markdown);

addTokenPositions(tokens, markdown);

// tokens now have a `position` field
```


