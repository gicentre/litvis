import { parseBlockInfo } from "./parseBlockInfo";

const testCases: Array<{
  info: object;
  raw: string[];
}> = [
  {
    info: { language: "js", attributes: { cmd: true } },
    raw: [
      "js cmd=true",
      "js {cmd=true}",
      "js  {  cmd=true  }  ",
      "js{cmd=True}",
    ],
  },
  {
    info: { language: "hello", attributes: {} },
    raw: ["hello", " hello ", "hello {}", "hello {   }"],
  },
  {
    info: { language: undefined, attributes: { just: "attribute" } },
    raw: [" {just=attribute}"],
  },
];

describe("parse()", () => {
  testCases.map(({ raw, info }) => {
    raw.map((text) => {
      it(`works for`, () => {
        const result: object = parseBlockInfo(text);
        expect(result).toEqual(info);
      });
    });
  });
});
