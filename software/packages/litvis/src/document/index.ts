import * as frontmatter from "remark-frontmatter";
import * as remarkParse from "remark-parse";
import * as unified from "unified";
import { Node } from "unist";
import { VFile } from "vfile";
import { findNarrativeSchemaLabel } from "../narrative-schema-label";
import extractAttributeDerivatives from "./extract-attribute-derivatives";
import extractOutputItems from "./extract-output-items";
import findTripleHatReference from "./find-triple-hat-reference";
import processFrontmatter from "./process-frontmatter";

export { VFileBase } from "vfile";
export { Node } from "unist";
export type LitvisDocument = VFile<{
  data: {
    root: Node;
    litvisFollows?: string;
    litvisElmDependencies?: { [packageName: string]: string | false };
    litvisElmSourceDirectories?: string[];
    litvisNarrativeSchemas?: string[];
    renderedHtml?: string;
  };
}>;

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
