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
    title: "standard symbol followed by whitespace",
    code: `spec : Spec   `,
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
  {
    title: "literate records",
    code: `fn1 : List ( Int, Int )
fn2 : ( ( Int, Int ), ( String, String ) )
fn3 : { x : Int }
fn4 : ( Int, String )
fn5 : List (List ( Int, Int ))
fn6 : List { x : Int }
fn7 : List (List { x : Int })
fn8 : ( Int, List (List { x : Int }) )
`,
    introducedSymbols: [
      { name: "fn1", type: "List ( Int, Int )" },
      { name: "fn2", type: "( ( Int, Int ), ( String, String ) )" },
      { name: "fn3", type: "{ x : Int }" },
      { name: "fn4", type: "( Int, String )" },
      { name: "fn5", type: "List (List ( Int, Int ))" },
      { name: "fn6", type: "List { x : Int }" },
      { name: "fn7", type: "List (List { x : Int })" },
      { name: "fn8", type: "( Int, List (List { x : Int }) )" },
    ],
  },
  {
    title: "symbol followed by a comment",
    code: `spec : Spec -- this is a comment`,
    introducedSymbols: [
      {
        name: "spec",
        type: "Spec",
      },
    ],
  },
  {
    title: "code with false positives in multi-line strings",
    code: `realSymbol : String
realSymbol =
    """Some multiline text that looks a bit like some elm code
fakeSymbol : Int
fakeSymbol =
    99
"""
anotherRealSymbol : String
anotherRealSymbol =
    """Some multiline text that looks a bit like some elm code
anotherFakeSymbol : Int
anotherFakeSymbol =
    99
"""`,
    introducedSymbols: [
      {
        name: "realSymbol",
        type: "String",
      },
      {
        name: "anotherRealSymbol",
        type: "String",
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
