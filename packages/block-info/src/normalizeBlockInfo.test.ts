import { normalizeBlockInfo } from "./normalizeBlockInfo";
import { BlockInfo } from "./types";

const testCases: Array<{
  infos: Array<Record<string, unknown>>;
  normalizedInfo: Record<string, unknown>;
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
        const result = normalizeBlockInfo(info as unknown as BlockInfo);
        expect(result).toEqual(normalizedInfo);
      });
    });
  });
});
