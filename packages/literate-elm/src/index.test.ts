import * as moduleIndex from "./index";

describe("module", () => {
  it("findIntroducedSymbols()", () => {
    expect(typeof moduleIndex.findIntroducedSymbols).toEqual("function");
  });
});
