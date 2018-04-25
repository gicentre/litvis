import { testCases } from "./parse.test";
import parseUsingCache from "./parseUsingCache";

describe("parse()", () => {
  testCases.map(({ input: arrayOfInputs, output: expectedOutput, error }) => {
    arrayOfInputs.map((input) => {
      if (error) {
        it(`throws for ${input}`, () => {
          expect(() => parseUsingCache(input)).toThrow(
            typeof error === "string" ? error : undefined,
          );
          expect(() => parseUsingCache(input)).toThrow(
            typeof error === "string" ? error : undefined,
          );
        });
      } else {
        it(`works for ${input}`, () => {
          const output = parseUsingCache(input);
          expect(output).toEqual(expectedOutput);
          const output2 = parseUsingCache(input);
          expect(output2).toEqual(expectedOutput);
        });
      }
    });
  });
});
