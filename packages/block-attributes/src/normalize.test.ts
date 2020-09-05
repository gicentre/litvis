import { sharedTestCases } from "./__fixtures__/testCases";
import { normalize } from "./normalize";

describe("normalize()", () => {
  sharedTestCases.map(({ attributes = null, normalizedAttributes = null }) => {
    if (!attributes || !normalizedAttributes) {
      return;
    }
    test(`works for ${JSON.stringify(attributes)}`, () => {
      const result = normalize(attributes);
      expect(result).toEqual(normalizedAttributes);
    });
  });
});
