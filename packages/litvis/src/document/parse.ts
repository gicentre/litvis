import { processUnist as extractLabels } from "narrative-schema-label";
import frontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import unified from "unified";
import { LitvisDocument } from "../types";
import extractAttributeDerivatives from "./extractAttributeDerivatives";
import extractOutputItems from "./extractOutputItems";
import findTripleHatReference from "./findTripleHatReferences";
import processFrontmatter from "./processFrontmatter";

// @ts-ignore
import { Parent, Position, VFileBase } from "../types";

export const engine = unified()
  .use(remarkParse)
  .use(frontmatter, ["yaml", "toml"])
  .use(findTripleHatReference)
  .use(extractAttributeDerivatives)
  .use(extractOutputItems)
  .use(processFrontmatter)
  .use(extractLabels);

export default async (vFile: LitvisDocument) => {
  vFile.data.root = (await engine.parse(vFile)) as Parent;
  await engine.run(vFile.data.root, vFile);
};
