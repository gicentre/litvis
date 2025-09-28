import { processUnist as extractLabels } from "narrative-schema-label";
import frontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import unified from "unified";
import type { Parent } from "unist";
import type { VFile } from "vfile";

import type { LitvisDocument } from "../types";
import { extractAttributeDerivatives } from "./extract-attribute-derivatives";
import { extractOutputItems } from "./extract-output-items";
import { findTripleHatReferences } from "./find-triple-hat-references";
import { processFrontmatter } from "./processFrontmatter";

export const engine = unified()
  .use(remarkParse)
  .use(frontmatter, ["yaml", "toml"])
  .use(findTripleHatReferences)
  .use(extractAttributeDerivatives)
  .use(extractOutputItems)
  .use(processFrontmatter)
  .use(extractLabels);

export const parseDocument = async (vFile: VFile): Promise<LitvisDocument> => {
  const result = vFile as LitvisDocument;
  result.data.root = engine.parse(vFile) as Parent;
  await engine.run(result.data.root, vFile);

  return result;
};
