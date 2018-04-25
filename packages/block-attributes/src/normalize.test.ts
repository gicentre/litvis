import normalize from "./normalize";

import testCases from "./testCases";

describe("normalize()", () => {
  testCases.map(({ attributes = null, normalizedAttributes = null }) => {
    if (!attributes || !normalizedAttributes) {
      return;
    }
    test(`works for ${JSON.stringify(attributes)}`, () => {
      const result = normalize(attributes);
      expect(result).toEqual(normalizedAttributes);
    });
  });
});
