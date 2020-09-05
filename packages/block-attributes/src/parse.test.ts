import testCases from "./fixtures/sharedTestCases";
import parse from "./parse";

describe("parse()", () => {
  testCases.map(({ raw, attributes }) => {
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
