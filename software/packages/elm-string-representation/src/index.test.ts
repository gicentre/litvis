import * as moduleIndex from "./index";

describe("module", () => {
  it("exports parse()", () => {
    expect(typeof moduleIndex.parse).toEqual("function");
  });
  it("exports parseUsingCache()", () => {
    expect(typeof moduleIndex.parseUsingCache).toEqual("function");
  });
});
