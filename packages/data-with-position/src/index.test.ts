import * as moduleIndex from ".";

describe("module", () => {
  it("exports normalize()", () => {
    expect(typeof moduleIndex.fromYaml).toEqual("function");
  });
  it("exports parse()", () => {
    expect(typeof moduleIndex.getPosition).toEqual("function");
  });
  it("exports stringify()", () => {
    expect(typeof moduleIndex.getValue).toEqual("function");
  });
});
