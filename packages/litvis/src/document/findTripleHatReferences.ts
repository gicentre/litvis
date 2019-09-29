// inspired by https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-kbd/src/index.js

import whitespace from "is-whitespace-character";

const HAT = "^";
const TRIPLE_HAT = "^^^";

function locator(value, fromIndex) {
  const index = value.indexOf(TRIPLE_HAT, fromIndex);
  return index;
}

export default function plugin() {
  function inlineTokenizer(eat, value, silent) {
    if (
      !this.options.gfm ||
      value.charAt(0) !== HAT ||
      value.charAt(1) !== HAT ||
      value.charAt(2) !== HAT ||
      value.startsWith(HAT.repeat(6)) ||
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
        character === HAT &&
        previous === HAT &&
        preceding === HAT &&
        (!prePreceding || !whitespace(prePreceding))
      ) {
        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true;
        }

        return eat(TRIPLE_HAT + subvalue + TRIPLE_HAT)({
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
    visitors.tripleHatReference = function(node) {
      return `${TRIPLE_HAT}${this.all(node).join("")}${TRIPLE_HAT}`;
    };
  }
}
