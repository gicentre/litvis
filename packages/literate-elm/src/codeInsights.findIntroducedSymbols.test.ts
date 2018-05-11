import { findIntroducedSymbols } from "./codeInsights";

const testCases: Array<{
  title?: string;
  code: string;
  introducedSymbols: any[];
}> = [
  {
    title: "standard symbol",
    code: `spec : Spec`,
    introducedSymbols: [
      {
        name: "spec",
        type: "Spec",
      },
    ],
  },
  {
    title: "partially applied function",
    code: `
sparkline : String -> Spec
`,
    introducedSymbols: [
      {
        name: "sparkline",
        type: "String -> Spec",
      },
    ],
  },
  {
    title: "multiple symbols",
    code: `
spec : Spec
sparkline : String -> Spec
`,
    introducedSymbols: [
      {
        name: "spec",
        type: "Spec",
      },
      {
        name: "sparkline",
        type: "String -> Spec",
      },
    ],
  },
  {
    title: "empty code block",
    code: ``,
    introducedSymbols: [],
  },
  {
    title: "code block with let ... in",
    code: `result : Int
result =
    let
        square : Int -> Int
        square x =
            x * x
    in
    square 32
`,
    introducedSymbols: [
      {
        name: "result",
        type: "Int",
      },
    ],
  },
];

describe("findIntroducedSymbols()", () => {
  testCases.map(({ code, introducedSymbols, title }, index) => {
    it(`works for ${title || `test case ${index + 1}`}`, () => {
      expect(findIntroducedSymbols(code)).toEqual(introducedSymbols);
    });
  });
});
