import { sharedTestCases } from "./__fixtures__/testCases";
import { parse } from "./parse";

describe("parse()", () => {
  sharedTestCases.map(({ raw, attributes }) => {
    if (!raw || !attributes) {
      return;
    }
    const arrayOfTexts = typeof raw === "string" ? [raw] : raw;
    arrayOfTexts.map((text) => {
      test(`works for ${text}`, () => {
        const result = parse(text!);
        expect(result).toEqual(attributes);
      });
    });
  });
});
