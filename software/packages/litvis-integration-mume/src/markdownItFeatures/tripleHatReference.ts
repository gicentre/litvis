import { MarkdownIt } from "markdown-it";
import { parseBlockInfo } from "../../lib/block-info/index";
import { escapeString } from "../../utility";

const delimiters = [["^^^", "^^^"]];

export default (md: MarkdownIt) => {
  md.inline.ruler.before(
    "escape",
    "litvis:triple-hat-reference",
    // @ts-ignore
    (state, silent) => {
      let openTag = null;
      let closeTag = null;
      for (const tagPair of delimiters) {
        if (state.src.startsWith(tagPair[0], state.pos)) {
          [openTag, closeTag] = tagPair;
          break;
        }
      }

      if (!openTag) {
        return false; // not triple hat reference
      }

      let content = null;
      let end = -1;

      let i = state.pos + openTag.length;
      while (i < state.src.length) {
        if (state.src.startsWith(closeTag, i)) {
          end = i;
          break;
        } else if (state.src[i] === "\\") {
          i += 1;
        }
        i += 1;
      }

      if (end >= 0) {
        content = state.src.slice(state.pos + openTag.length, end);
      } else {
        return false;
      }

      const trimmedContent = content.trim();
      if (
        content.length &&
        trimmedContent.length === content.length &&
        !silent
      ) {
        const token = state.push("litvis:triple-hat-reference");
        token.content = trimmedContent;
        token.openTag = openTag;
        token.closeTag = closeTag;
        token.displayMode = false;

        state.pos += content.length + openTag.length + closeTag.length;
        return true;
      } else {
        return false;
      }
    },
  );

  md.renderer.rules["litvis:triple-hat-reference"] = (tokens, idx) => {
    const token: any = tokens[idx];
    const parsedInfo = parseBlockInfo(token.content);

    return `<span data-role="litvis:triple-hat-reference" data-info="${escapeString(
      token.content,
    )}" data-parsedInfo="${escapeString(
      JSON.stringify(parsedInfo),
    )}"><code>${escapeString(
      token.openTag + token.content + token.closeTag,
    )}</code></span>`;
  };
};
