# Elm String Representation

Parses Elm string representation for data.
Part of [litvis](https://github.com/gicentre/litvis).

```js
import { parse } from "elm-string-representation";

const data = parse('{ a = "test", b = 42 }');
console.log(JSON.stringify(data, null, 2));
```

<!-- prettier-ignore -->
```json
{
  "a": "test",
  "b": 42
}
```

**TODO:** Add `stringify`.
