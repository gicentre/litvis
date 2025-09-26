// inspired by https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-kbd/src/index.js

// @ts-expect-error -- package is missing typings
import whitespace from "is-whitespace-character";
import { Processor } from "unified";
import { Node } from "unist";

const singleHat = "^";
const tripleHat = "^^^";

const locator = (value: string, fromIndex: number) => {
  const index = value.indexOf(tripleHat, fromIndex);

  return index;
};

// eslint-disable-next-line func-style -- Usage of "this" requires suppressing func-style eslint rule
export function findTripleHatReferences(this: Processor) {
  // eslint-disable-next-line func-style
  function inlineTokenizer(eat: any, value: string, silent: boolean) {
    if (
      // @ts-expect-error -- TODO: investigate
      !this.options.gfm ||
      value.charAt(0) !== singleHat ||
      value.charAt(1) !== singleHat ||
      value.charAt(2) !== singleHat ||
      value.startsWith(singleHat.repeat(6)) ||
      whitespace(value.charAt(3))
    ) {
      return;
    }

    let character = "";
    let previous = "";
    let preceding = "";
    let prePreceding = "";
    let subvalue = "";
    let index = 2;
    const length = value.length;
    const now = eat.now();
    now.column += 3;
    now.offset += 3;

    while (++index < length) {
      character = value.charAt(index);

      if (
        character === singleHat &&
        previous === singleHat &&
        preceding === singleHat &&
        (!prePreceding || !whitespace(prePreceding))
      ) {
        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true;
        }

        return eat(tripleHat + subvalue + tripleHat)({
          type: "tripleHatReference",
          data: {
            info: subvalue,
          },
        });
      }

      subvalue += preceding;
      prePreceding = preceding;
      preceding = previous;
      previous = character;
    }
  }
  (inlineTokenizer as any).locator = locator;

  const Parser = this.Parser;

  // Inject inlineTokenizer
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.tripleHatReference = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("text"), 0, "tripleHatReference");

  const Compiler = this.Compiler;

  // Stringify
  if (Compiler) {
    const visitors = Compiler.prototype.visitors;
    visitors.tripleHatReference = function (node: Node) {
      return `${tripleHat}${this.all(node).join("")}${tripleHat}`;
    };
  }
}
