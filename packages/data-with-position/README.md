# Data with position

Pseudo AST that contains data with its positions attached.
Its main goal is to work with the data from YAML and be able to report errors at specific locations.
Inspired by [pseudo-yaml-ast](https://github.com/yldio/pseudo-yaml-ast).

This module is a part of [litvis](https://github.com/gicentre/litvis).

TypeScript typings are included ✅

## Usage example

```js
import { fromYaml, getPosition, getValue } from "data-with-position";

const dataWithPosition = fromYaml(`obj:
  arr:
  - nums:
    - 1
    - 2
    - 3
    strs:
    - '1'
    - '2'
    - '3'
  num: 1
  str: '1'
`);

console.log(getValue(dataWithPosition.obj.str));
// "1"

console.log(getValue(dataWithPosition.obj.num));
// 1

console.log(getValue(dataWithPosition.obj.arr[0].nums));
// [1, 2, 3]

console.log(getValue(dataWithPosition.obj.arr[0].strs));
// ["1", "2", "3"]

console.log(getPosition(dataWithPosition.obj.str));
// { start: { line: 12, column: 3 }, end: { line: 12, column: 11 } }

console.log(getPosition(dataWithPosition.obj.arr[0]));
// { start: { line: 3, column: 5 }, end: { line: 11, column: 3 } }
```

Rows and columns in position are 1-indexed for compatibility with [unist Position](https://github.com/syntax-tree/unist#position).

Objects and arrays are iterable just like normal JavaScript entities, which means you can write `for` loops with no need to call `getValue()` (this function can be expensive near the root of a large tree).
In order to detect the kind of a data node, you can use `getKind` function:

```js
import { fromYaml, getKind, getPosition } from "data-with-position";

const dataWithPosition = fromYaml("...");

if (getKind(dataWithPosition) === "array") {
  for (let i = 0; i < dataWithPosition.length; i += 1) {
    console.log(getPosition(dataWithPosition[i]));
  }
  // or
  for (const element of dataWithPosition) {
    console.log(getPosition(element));
  }
}

if (getKind(dataWithPosition) === "object") {
  for (const key in dataWithPosition) {
    console.log(getPosition(dataWithPosition[key]));
  }
}
```

The results of `getKind()` are compatible with [`kind-of`](https://www.npmjs.com/package/kind-of).

```js
import kindOf from "kind-of";
import { getKind, getValue } from "data-with-position";

kindOf(getValue(dataWithPosition.element)) ===
  getKind(dataWithPosition.element);
// always true, even when element is undefined
```
