import * as moduleIndex from ".";

describe("module", () => {
  it("findIntroducedSymbols()", () => {
    expect(typeof moduleIndex.findIntroducedSymbols).toEqual("function");
  });
});
