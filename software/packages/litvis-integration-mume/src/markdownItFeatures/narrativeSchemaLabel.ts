import { parseBlockInfo } from "block-info";
import { MarkdownIt } from "markdown-it";
import { deriveLabelType } from "narrative-schemas";
import { escapeString } from "../../utility";

const openTagLength = 2;
const closeTagLength = 2;

export default (md: MarkdownIt) => {
  md.inline.ruler.before(
    "escape",
    "litvis:narrative-schema-label",
    // @ts-ignore
    (state, silent) => {
      const startPos = state.pos;
      if (
        !state.src.startsWith("{(", startPos) &&
        !state.src.startsWith("{|", startPos)
      ) {
        return false;
      }

      let endPos = -1;
      let i = startPos + openTagLength;
      while (i < state.src.length) {
        if (state.src.startsWith("|}", i) || state.src.startsWith(")}", i)) {
          endPos = i;
          break;
        } else if (state.src[i] === "\\") {
          i += 1;
        }
        i += 1;
      }

      if (endPos < 0) {
        return false;
      }

      const content = state.src.slice(startPos + openTagLength, endPos);
      if (!silent) {
        const token = state.push("litvis:narrative-schema-label");
        token.content = content;
        token.openTag = state.src.slice(startPos, startPos + openTagLength);
        token.closeTag = state.src.slice(endPos, endPos + closeTagLength);
        token.labelType = deriveLabelType(token.openTag, token.closeTag);
        token.displayMode = false;

        state.pos += content.length + openTagLength + openTagLength;
        return true;
      } else {
        return false;
      }
    },
  );

  md.renderer.rules["litvis:narrative-schema-label"] = (tokens, idx) => {
    const token: any = tokens[idx];
    const parsedInfo = parseBlockInfo(token.content.trim());
    return `<span data-role="litvis:narrative-schema-label" data-info="${escapeString(
      token.content,
    )}" data-labelType="${token.labelType}" data-parsedInfo="${escapeString(
      JSON.stringify(parsedInfo),
    )}"><code>${escapeString(
      token.openTag + token.content + token.closeTag,
    )}</code></span>`;
  };
};
