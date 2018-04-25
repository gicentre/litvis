import { findNarrativeSchemaLabel } from "narrative-schema-label";
import * as frontmatter from "remark-frontmatter";
import * as remarkParse from "remark-parse";
import * as unified from "unified";
import { LitvisDocument } from "../types";
import extractAttributeDerivatives from "./extractAttributeDerivatives";
import extractOutputItems from "./extractOutputItems";
import findTripleHatReference from "./findTripleHatReference";
import processFrontmatter from "./processFrontmatter";

export const engine = unified()
  .use(remarkParse)
  .use(frontmatter, ["yaml", "toml"])
  .use(findTripleHatReference)
  .use(findNarrativeSchemaLabel)
  .use(extractAttributeDerivatives)
  .use(extractOutputItems)
  .use(processFrontmatter);

export async function parse(vFile: LitvisDocument) {
  vFile.data.root = await engine.parse(vFile);
  await engine.run(vFile.data.root, vFile);
}
