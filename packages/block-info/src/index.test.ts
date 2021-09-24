import * as moduleIndex from ".";

describe("module", () => {
  it("exports normalizeBlockInfo()", () => {
    expect(typeof moduleIndex.normalizeBlockInfo).toEqual("function");
  });
  it("exports parseBlockInfo()", () => {
    expect(typeof moduleIndex.parseBlockInfo).toEqual("function");
  });
});
