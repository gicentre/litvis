import parse from "./parse";

export const testCases: Array<{
  input: any[];
  output?: any;
  error?: true | string;
}> = [
  {
    input: [""],
    output: null,
  },
  {
    input: ["42"],
    output: 42,
  },
  {
    input: ['"42"'],
    output: "42",
  },
  {
    input: ["True"],
    output: true,
  },
  {
    input: ["False"],
    output: false,
  },
  {
    input: ["<function>"],
    output: "<function>",
  },
  {
    input: ['"Hello World"'],
    output: "Hello World",
  },
  {
    input: ['{ a = "test", b = 42 }'],
    output: {
      a: "test",
      b: 42,
    },
  },
  {
    input: ["{ x = True, y = False }"],
    output: {
      x: true,
      y: false,
    },
  },
  {
    input: ['"{ x = True, y = False }"'],
    output: "{ x = True, y = False }",
  },
  {
    input: [
      '{ type = "geoshape", filled = False, visible = True, stroke = "#000", strokeWidth = 0.1 }',
    ],
    output: {
      type: "geoshape",
      filled: false,
      visible: true,
      stroke: "#000",
      strokeWidth: 0.1,
    },
  },
  {
    input: [
      '{ $schema = "https://vega.github.io/schema/vega-lite/v2.json", data = { values = { 0 = { a = "C", b = 2 }, 1 = { a = "C", b = 7 }, 2 = { a = "D", b = 1 }, 3 = { a = "D", b = 2 }, 4 = { a = "E", b = 6 }, 5 = { a = "E", b = 8 } } }, encoding = { x = { field = "a", type = "nominal" }, y = { field = "b", type = "quantitative", aggregate = "mean" } }, mark = "bar" }',
    ],
    output: {
      $schema: "https://vega.github.io/schema/vega-lite/v2.json",
      data: {
        values: [
          { a: "C", b: 2 },
          { a: "C", b: 7 },
          { a: "D", b: 1 },
          { a: "D", b: 2 },
          { a: "E", b: 6 },
          { a: "E", b: 8 },
        ],
      },
      encoding: {
        x: { field: "a", type: "nominal" },
        y: { field: "b", type: "quantitative", aggregate: "mean" },
      },
      mark: "bar",
    },
  },
  {
    input: [
      '{ 0 = { a = "C", b = 2 }, 1 = { a = "C", b = 7 }, 2 = { a = { 0 = "hello", 1 = "world"}, b = 1 }, 42 = true }',
    ],
    output: {
      "0": { a: "C", b: 2 },
      "1": { a: "C", b: 7 },
      "2": { a: ["hello", "world"], b: 1 },
      "42": true,
    },
  },
  {
    input: [
      '{ x = { field = "x", type = "quantitative", axis = null }, y = { field = "y", type = "quantitative", axis = null }, order = { field = "order", type = "ordinal" } }',
    ],
    output: {
      x: {
        field: "x",
        type: "quantitative",
        axis: null,
      },
      y: {
        field: "y",
        type: "quantitative",
        axis: null,
      },
      order: {
        field: "order",
        type: "ordinal",
      },
    },
  },
  {
    input: [
      '{ $schema = "https://vega.github.io/schema/vega-lite/v3.json", data = { values = { 0 = { speed (m/s) = 1 }, 1 = { speed (m/s) = 2 }, 2 = { speed (m/s) = 3 } } }, encoding = { x = { field = "speed (m/s)", type = "quantitative" } }, mark = "circle" }',
    ],
    output: {
      $schema: "https://vega.github.io/schema/vega-lite/v3.json",
      data: {
        values: [
          { "speed (m/s)": 1 },
          { "speed (m/s)": 2 },
          { "speed (m/s)": 3 },
        ],
      },
      encoding: { x: { field: "speed (m/s)", type: "quantitative" } },
      mark: "circle",
    },
  },
  {
    input: [
      '{ = "test", b = 42 }',
      '{ b = 42, = "test" }',
      '{  = "test", b = 42 }',
    ],
    output: {
      "": "test",
      b: 42,
    },
  },
  {
    input: ['{ two words = "test", b = 42 }', '{ b = 42, two words = "test" }'],
    output: {
      "two words": "test",
      b: 42,
    },
  },
  {
    input: [
      '{ dashed-key = "test", b = 42 }',
      '{ b = 42, dashed-key = "test" }',
    ],
    output: {
      "dashed-key": "test",
      b: 42,
    },
  },
  {
    input: [
      '{ special-symbols +*/&|, = "test", key=with =equality= signs = 42 }',
      '{ key=with =equality= signs = 42, special-symbols +*/&|, = "test" }',
    ],
    output: {
      "special-symbols +*/&|,": "test",
      "key=with =equality= signs": 42,
    },
  },
  {
    input: [
      '{ a lot of words = "test", b = 42 }',
      '{ b = 42, a lot of words = "test" }',
    ],
    output: {
      "a lot of words": "test",
      b: 42,
    },
  },
  {
    input: ["( False, True )", "(False,True)"],
    output: [false, true],
  },
  {
    input: ["( 1, 2 )", "(1,2)"],
    output: [1, 2],
  },
  {
    input: ["[ ( 1, 2 ) ]", "[(1,2)]"],
    output: [[1, 2]],
  },
  {
    input: ["[ ( 1, 2, 3 ), ( 4, 5, 6 ) ]", "[(1,2,3),(4,5,6)]"],
    output: [
      [1, 2, 3],
      [4, 5, 6],
    ],
  },
  {
    input: ['{ a = "test", b = (1, 2, 3) }'],
    output: {
      a: "test",
      b: [1, 2, 3],
    },
  },
  {
    input: ['{ a = "(1, 2, 3)", b = (1, 2, 3) }'],
    output: {
      a: "(1, 2, 3)",
      b: [1, 2, 3],
    },
  },
  {
    input: [
      '{ booItem = True, fnItem = <function>, intItem = 1, lstItem = [3,4,5], rcdItem = { nestedName = "fourteen", nestedValue = 15 }, strItem = "two", tLsItem = [(1,11),(1.2,13)], tp3Item = (False,8,"nine"), tplItem = (6,7) }',
    ],
    output: {
      booItem: true,
      fnItem: "<function>",
      intItem: 1,
      lstItem: [3, 4, 5],
      rcdItem: {
        nestedName: "fourteen",
        nestedValue: 15,
      },
      strItem: "two",
      tLsItem: [
        [1, 11],
        [1.2, 13],
      ],
      tp3Item: [false, 8, "nine"],
      tplItem: [6, 7],
    },
  },
  {
    input: [
      "{ x = {",
      '{ x = { field = "x", type = "quantitative", axis = null }, y = { field = "y", type =',
      "{ keyWithEquality = signAndSpaces = 1, a = 42 }",
    ],
    error: true,
  },
  {
    input: [42, null, {}],
    error: true,
  },
];

describe("parse()", () => {
  testCases.map(({ input: arrayOfInputs, output: expectedOutput, error }) => {
    arrayOfInputs.map((input) => {
      if (error) {
        it(`throws for ${input}`, () => {
          expect(() => parse(input)).toThrow(
            typeof error === "string" ? error : undefined,
          );
        });
      } else {
        it(`works for ${input}`, () => {
          const output = parse(input);
          expect(output).toEqual(expectedOutput);
        });
      }
    });
  });
});
