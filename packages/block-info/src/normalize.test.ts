import { normalize } from "./normalize";
import { BlockInfo } from "./types";

const testCases: Array<{
  infos: object[];
  normalizedInfo: object;
}> = [
  {
    infos: [{}],
    normalizedInfo: { language: "", attributes: {} },
  },
  {
    infos: [
      { language: "js", attributes: { cmd: true } },
      { language: "js", attributes: { Cmd: true } },
      { language: "js", attributes: { CMD: true } },
    ],
    normalizedInfo: { language: "js", attributes: { cmd: true } },
  },
  {
    infos: [{ language: "vega" }, { language: "VEGA", attributes: {} }],
    normalizedInfo: { language: "vega", attributes: {} },
  },
];

describe("normalize()", () => {
  testCases.map(({ infos, normalizedInfo }) => {
    infos.map((info) => {
      it(`works for ${JSON.stringify(info)}`, () => {
        const result: object = normalize(info as BlockInfo);
        expect(result).toEqual(normalizedInfo);
      });
    });
  });
});
