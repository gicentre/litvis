import { processUnist as extractLabels } from "narrative-schema-label";
import frontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import unified from "unified";
// tslint:disable-next-line:no-implicit-dependencies
import { Parent } from "unist";
import { VFile } from "vfile";
import { LitvisDocument } from "../types";
import extractAttributeDerivatives from "./extractAttributeDerivatives";
import extractOutputItems from "./extractOutputItems";
import findTripleHatReference from "./findTripleHatReferences";
import processFrontmatter from "./processFrontmatter";

export const engine = unified()
  .use(remarkParse)
  .use(frontmatter, ["yaml", "toml"])
  .use(findTripleHatReference)
  .use(extractAttributeDerivatives)
  .use(extractOutputItems)
  .use(processFrontmatter)
  .use(extractLabels);

export default async (vFile: VFile): Promise<LitvisDocument> => {
  const result = vFile as LitvisDocument;
  result.data.root = engine.parse(vFile) as Parent;
  await engine.run(result.data.root, vFile);
  return result;
};
