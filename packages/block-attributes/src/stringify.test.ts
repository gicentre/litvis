import { sharedTestCases } from "./__fixtures__/testCases";
import { stringify } from "./stringify";

describe("stringify()", () => {
  sharedTestCases.map(
    ({
      attributes = null,
      normalizedAttributes = null,
      stringified = null,
    }) => {
      if (typeof stringified !== "string") {
        return;
      }
      const attributesToTest: any[] = [];
      if (normalizedAttributes) {
        attributesToTest.push(normalizedAttributes);
      } else if (attributes) {
        attributesToTest.push(attributes);
      }
      attributesToTest.map((attrs) => {
        test(`works for ${JSON.stringify(attrs)}`, () => {
          // without curly parentheses
          const resultWithoutCurlyParentheses = stringify(attrs);
          expect(resultWithoutCurlyParentheses).toEqual(stringified);

          // with curly parentheses (default)
          const resultWithCurlyParentheses = stringify(attrs, true);
          expect(resultWithCurlyParentheses).toEqual(`{${stringified}}`);
        });
      });
    },
  );
});
