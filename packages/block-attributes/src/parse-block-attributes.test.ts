import { sharedTestCases } from "./__fixtures__/test-cases";
import { parseBlockAttributes } from "./parse-block-attributes";

describe("parseBlockAttributes()", () => {
  sharedTestCases.map(({ raw, attributes }) => {
    if (!raw || !attributes) {
      return;
    }
    const arrayOfTexts = typeof raw === "string" ? [raw] : raw;
    arrayOfTexts.map((text) => {
      test(`works for ${text}`, () => {
        const result = parseBlockAttributes(text!);
        expect(result).toEqual(attributes);
      });
    });
  });
});
