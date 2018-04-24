import * as moduleIndex from "./index";

describe("module", () => {
  it("exports normalize()", () => {
    expect(typeof moduleIndex.normalize).toEqual("function");
  });
  it("exports parse()", () => {
    expect(typeof moduleIndex.parse).toEqual("function");
  });
});
