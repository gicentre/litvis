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
      "{ x = {",
      '{ x = { field = "x", type = "quantitative", axis = null }, y = { field = "y", type =',
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
