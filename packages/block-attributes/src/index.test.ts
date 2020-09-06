import * as moduleIndex from "./index";

describe("module", () => {
  it("exports normalizeBlockAttributes()", () => {
    expect(typeof moduleIndex.normalizeBlockAttributes).toEqual("function");
  });
  it("exports parseBlockAttributes()", () => {
    expect(typeof moduleIndex.parseBlockAttributes).toEqual("function");
  });
  it("exports stringifyBlockAttributes()", () => {
    expect(typeof moduleIndex.stringifyBlockAttributes).toEqual("function");
  });
});
