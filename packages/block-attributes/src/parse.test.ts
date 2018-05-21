import parse from "./parse";

import testCases from "./fixtures/sharedTestCases";

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
