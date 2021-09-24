import { parseBlockInfo } from "block-info";
import { Html5Entities } from "html-entities";
import MarkdownIt from "markdown-it";

const escapeString = new Html5Entities().encode;

const delimiters = [["^^^", "^^^"]];

export const useTripleHatReference = (md: MarkdownIt) => {
  md.inline.ruler.before(
    "escape",
    "litvis:triple-hat-reference",
    (state, silent) => {
      let openTag: string | null = null;
      let closeTag: string | null = null;
      for (const tagPair of delimiters) {
        if (state.src.startsWith(tagPair[0], state.pos)) {
          [openTag, closeTag] = tagPair;
          break;
        }
      }

      if (!openTag || !closeTag) {
        return false; // not triple hat reference
      }

      let content: string | null = null;
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
        content = state.src.slice(state.pos + openTag.length, end) as string;
      } else {
        return false;
      }

      const trimmedContent = content.trim();
      if (
        content.length &&
        trimmedContent.length === content.length &&
        !silent
      ) {
        const token = state.push(
          "litvis:triple-hat-reference",
          "litvis:triple-hat-reference",
          0,
        );
        token.content = trimmedContent;
        token.meta = {
          openTag,
          closeTag,
        };

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
      token.meta.openTag + token.content + token.meta.closeTag,
    )}</code></span>`;
  };
};
